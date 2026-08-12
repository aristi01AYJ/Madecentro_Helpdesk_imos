/**
 * graphService.js
 * -----------------------------------------------------------------------
 * Toda la comunicación con Microsoft Graph API vive acá:
 *  - Crear un caso (item en la lista de Microsoft Lists)
 *  - Subir documentos adjuntos (a una biblioteca de documentos del sitio)
 *  - Consultar casos (propios, o resueltos por categoría para el helpdesk)
 * -----------------------------------------------------------------------
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(path, options = {}) {
  const token = await getGraphToken();
  if (!token) throw new Error("No hay token de acceso disponible todavía.");

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph API error (${res.status}): ${errText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Crea un nuevo caso en la lista de Microsoft Lists.
 * @param {Object} caso - { asunto, descripcion, tipoCaso, urgencia, categoria, creadoPorNombre, creadoPorCorreo }
 * @returns {Promise<Object>} el item creado (incluye su id)
 */
async function crearCaso(caso) {
  const { siteId, listId } = APP_CONFIG.sharepoint;
  const body = {
    fields: {
      Title: caso.asunto,
      Descripcion: caso.descripcion,
      TipoCaso: caso.tipoCaso,
      Urgencia: caso.urgencia,
      Categoria: caso.categoria,
      Estado: "Abierto",
      CreadoPorNombre: caso.creadoPorNombre,
      CreadoPorCorreo: caso.creadoPorCorreo,
      FechaApertura: new Date().toISOString(),
    },
  };
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Sube un archivo a la biblioteca de adjuntos, en una carpeta con el id del caso,
 * y devuelve la URL del archivo subido (para guardarla en el caso).
 */
async function subirAdjunto(casoId, file) {
  const { siteId, attachmentsLibrary } = APP_CONFIG.sharepoint;
  const token = await getGraphToken();
  const path = `/sites/${siteId}/drive/root:/${attachmentsLibrary}/${casoId}/${encodeURIComponent(
    file.name
  )}:/content`;

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error subiendo adjunto (${res.status}): ${errText}`);
  }
  const driveItem = await res.json();
  return driveItem.webUrl;
}

/**
 * Sube varios adjuntos y guarda los links (uno por línea) en el campo
 * AdjuntosUrls del item del caso.
 */
async function subirAdjuntosYVincular(casoId, files) {
  if (!files || files.length === 0) return;
  const urls = [];
  for (const file of files) {
    const url = await subirAdjunto(casoId, file);
    urls.push(url);
  }
  const { siteId, listId } = APP_CONFIG.sharepoint;
  await graphFetch(`/sites/${siteId}/lists/${listId}/items/${casoId}/fields`, {
    method: "PATCH",
    body: JSON.stringify({ AdjuntosUrls: urls.join("\n") }),
  });
}

/**
 * Trae los casos creados por un usuario (por correo), más recientes primero.
 */
async function getMisCasos(correo) {
  const { siteId, listId } = APP_CONFIG.sharepoint;
  const filter = encodeURIComponent(`fields/CreadoPorCorreo eq '${correo}'`);
  const data = await graphFetch(
    `/sites/${siteId}/lists/${listId}/items?expand=fields&$filter=${filter}`
  );
  return (data.value || []).map(mapListItem).sort(ordenarPorFechaDesc);
}

/**
 * Trae los casos con Estado = Resuelto (o Cerrado), opcionalmente filtrados por categoría.
 * Esto alimenta el mini helpdesk.
 */
async function getCasosResueltos(categoria) {
  const { siteId, listId } = APP_CONFIG.sharepoint;
  let filter = "(fields/Estado eq 'Resuelto' or fields/Estado eq 'Cerrado')";
  if (categoria) {
    filter += ` and fields/Categoria eq '${categoria}'`;
  }
  const data = await graphFetch(
    `/sites/${siteId}/lists/${listId}/items?expand=fields&$filter=${encodeURIComponent(
      filter
    )}`
  );
  return (data.value || []).map(mapListItem).sort(ordenarPorFechaDesc);
}

/**
 * Trae TODOS los casos (para la pantalla de gestión), más recientes primero.
 * Nota: sigue la regla aprendida en los cotizadores AYJ — nunca usar
 * $select=fields en queries a listas de SharePoint (da error 400).
 * Se usa expand=fields en su lugar.
 */
async function getTodosCasos() {
  const { siteId, listId } = APP_CONFIG.sharepoint;
  const data = await graphFetch(
    `/sites/${siteId}/lists/${listId}/items?expand=fields&$top=500`
  );
  return (data.value || []).map(mapListItem).sort(ordenarPorFechaDesc);
}

/**
 * "Created" no está indexada en la lista, así que SharePoint no permite
 * usarla en $orderby (Graph tira error 400). Se ordena acá en el navegador.
 */
function ordenarPorFechaDesc(a, b) {
  return new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0);
}

/**
 * Actualiza el estado (y opcionalmente la solución) de un caso existente.
 * Se hace con PATCH sobre /fields, igual que el patrón usado en los
 * cotizadores AYJ para campos adicionales tras la creación del item.
 */
async function actualizarCaso(casoId, { estado, solucion, tiempoUsadoHoras, synergyId, fechaCierre }) {
  const { siteId, listId } = APP_CONFIG.sharepoint;
  const fields = {};
  if (estado !== undefined) fields.Estado = estado;
  if (solucion !== undefined) fields.Solucion = solucion;
  if (tiempoUsadoHoras !== undefined && tiempoUsadoHoras !== "") fields.TiempoUsadoHoras = Number(tiempoUsadoHoras);
  if (synergyId !== undefined) fields.SynergyId = synergyId;
  if (fechaCierre !== undefined) fields.FechaCierre = fechaCierre;

  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${casoId}/fields`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

function mapListItem(item) {
  const f = item.fields || {};
  return {
    id: item.id,
    asunto: f.Title,
    descripcion: f.Descripcion,
    tipoCaso: f.TipoCaso,
    urgencia: f.Urgencia,
    categoria: f.Categoria,
    estado: f.Estado,
    solucion: f.Solucion,
    creadoPorNombre: f.CreadoPorNombre,
    creadoPorCorreo: f.CreadoPorCorreo,
    adjuntos: (f.AdjuntosUrls || "").split("\n").filter(Boolean),
    fechaCreacion: f.Created,
    fechaApertura: f.FechaApertura,
    fechaCierre: f.FechaCierre,
    tiempoUsadoHoras: f.TiempoUsadoHoras,
    synergyId: f.SynergyId,
  };
}
