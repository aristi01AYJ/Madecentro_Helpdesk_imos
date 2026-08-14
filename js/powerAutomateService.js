/**
 * powerAutomateService.js
 * -----------------------------------------------------------------------
 * Para usuarios de Madecentro (sin cuenta Microsoft), el navegador NO puede
 * pedir un token de Graph API. En cambio, llama a flujos de Power Automate
 * (URLs configuradas en config.js) que corren con la cuenta de AYJ y son
 * los que efectivamente leen/escriben en la lista de SharePoint.
 *
 * Fase 1: solo texto (crear caso, consultar mis casos, consultar
 * resueltos). Los adjuntos se suman en una segunda vuelta.
 * -----------------------------------------------------------------------
 */

async function paFetch(url, body) {
  if (!url || url.includes("PEGAR_URL_DEL_FLUJO")) {
    throw new Error(
      "Todavía no configuraste la URL de este flujo de Power Automate en js/config.js."
    );
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`El flujo respondió con error (${res.status}): ${t}`);
  }
  return res.json();
}

/**
 * Crea un caso a través del flujo "IMOS - Crear Caso".
 */
async function crearCasoPA(caso) {
  return paFetch(APP_CONFIG.powerAutomate.crearCasoUrl, caso);
}

/**
 * Trae los casos de un usuario (por correo) a través del flujo "IMOS - Mis Casos".
 */
async function getMisCasosPA(correo) {
  const data = await paFetch(APP_CONFIG.powerAutomate.misCasosUrl, { correo });
  const items = data.casos || data.value || [];
  return items.map(mapCasoPA);
}

/**
 * Trae los casos resueltos/cerrados DEL CLIENTE del usuario logueado (para
 * el Helpdesk) a través del flujo "IMOS - Casos Resueltos". El filtro por
 * categoría/texto se hace en el navegador (ver helpdesk.html); el filtro
 * por cliente se hace en el flujo, para no mezclar casos entre empresas.
 */
async function getCasosResueltosPA(cliente) {
  const data = await paFetch(APP_CONFIG.powerAutomate.casosResueltosUrl, { cliente });
  const items = data.casos || data.value || [];
  return items.map(mapCasoPA);
}

/**
 * Normaliza la forma del caso, sea cual sea el nombre de campo que use
 * el flujo al devolverlo (por si el flujo devuelve los nombres internos
 * de SharePoint tal cual, en vez de los "amigables").
 */
/**
 * Los campos de selección (Choice) de SharePoint a veces vienen como
 * texto simple ("Abierto") y a veces como objeto { Value: "Abierto" }
 * según el conector que los devuelva. Esto normaliza cualquiera de las dos formas.
 */
function extraerValor(v) {
  if (v && typeof v === "object" && "Value" in v) return v.Value;
  return v;
}

function mapCasoPA(c) {
  return {
    id: c.id || c.ID || c.Id,
    asunto: c.asunto || c.Title,
    descripcion: c.descripcion || c.Descripcion,
    tipoCaso: extraerValor(c.tipoCaso || c.TipoCaso),
    urgencia: extraerValor(c.urgencia || c.Urgencia),
    categoria: extraerValor(c.categoria || c.Categoria),
    cliente: extraerValor(c.cliente || c.Cliente),
    estado: extraerValor(c.estado || c.Estado),
    solucion: c.solucion || c.Solucion,
    creadoPorNombre: c.creadoPorNombre || c.CreadoPorNombre,
    creadoPorCorreo: c.creadoPorCorreo || c.CreadoPorCorreo,
    fechaCreacion: c.fechaCreacion || c.Created,
    fechaApertura: c.fechaApertura || c.FechaApertura,
    fechaCierre: c.fechaCierre || c.FechaCierre,
    tiempoUsadoHoras: c.tiempoUsadoHoras || c.TiempoUsadoHoras,
    synergyId: c.synergyId || c.SynergyId,
    adjuntos: (c.adjuntos || c.AdjuntosUrls || "").split("\n").filter(Boolean),
    adjuntosSolucion: (c.adjuntosSolucion || c.AdjuntosSolucionUrls || "").split("\n").filter(Boolean),
  };
}
