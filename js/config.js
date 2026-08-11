/**
 * config.js
 * -----------------------------------------------------------------------
 * CONFIGURACIÓN DEL PROYECTO — completar estos valores antes de usar el sitio.
 * Ver README.md, sección "Configuración", para instrucciones paso a paso
 * de dónde sacar cada dato.
 * -----------------------------------------------------------------------
 */

const APP_CONFIG = {
  // --- Azure AD / Entra ID (App Registration) ---
  auth: {
    clientId: "TU_CLIENT_ID_AQUI",          // Application (client) ID de la app registrada
    tenantId: "TU_TENANT_ID_AQUI",          // Directory (tenant) ID de Madecentro
    redirectUri: window.location.origin + window.location.pathname.replace(/[^/]+$/, "") + "index.html",
    postLogoutRedirectUri: window.location.origin,
  },

  // Permisos delegados de Microsoft Graph que la app solicita al usuario
  graphScopes: ["User.Read", "Sites.ReadWrite.All"],

  // --- SharePoint / Microsoft Lists ---
  // Usado SOLO por gestionar-casos.html (login Microsoft, equipo AYJ).
  sharepoint: {
    // ID del sitio de SharePoint donde vive la lista. Ej: "contoso.sharepoint.com,GUID,GUID"
    siteId: "TU_SITE_ID_AQUI",
    // ID (o nombre) de la lista "CasosSoporteIMOS"
    listId: "TU_LIST_ID_AQUI",
    // Nombre de la biblioteca de documentos donde se guardan los adjuntos de los casos
    attachmentsLibrary: "AdjuntosCasos",
  },

  // --- Flujos de Power Automate ---
  // Usado por las páginas de Madecentro (login simple, sin cuenta Microsoft):
  // nuevo-caso.html, mis-casos.html, helpdesk.html.
  // Pegá acá la URL "HTTP POST URL" que te da cada flujo al guardarlo.
  powerAutomate: {
    crearCasoUrl: "https://defaultc03f8e4026004b72bd823d604e8a9a.ac.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/18/workflows/36f266747c6044bb8289c03eb2702207/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BB78BEJKqv4ZUz2sSl3kTcYBqRWT210wlMnH5Z_f0eM",
    misCasosUrl: "PEGAR_URL_DEL_FLUJO_MIS_CASOS",
    casosResueltosUrl: "PEGAR_URL_DEL_FLUJO_CASOS_RESUELTOS",
  },

  // --- Datos de negocio (editable sin tocar el resto del código) ---
  tiposDeCaso: [
    "Error de sistema",
    "Duda de uso",
    "Solicitud de mejora",
    "Capacitación",
    "Licencias y accesos",
    "Otro",
  ],

  urgencias: ["Baja", "Media", "Alta", "Crítica"],

  categorias: [
    "CAD",
    "XML",
    "Organizer",
    "INI",
    "Licencias",
    "Planos",
    "Reportes",
  ],

  estados: ["Abierto", "En proceso", "Resuelto", "Cerrado"],
};
