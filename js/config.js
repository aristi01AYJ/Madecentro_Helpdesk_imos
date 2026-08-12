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
    clientId: "25696701-ec12-4c2a-b51f-7efd7f27cc7a",          // Application (client) ID de la app registrada
    tenantId: "c03f8e40-2600-4b72-bd82-3d604e8a9aac",          // Directory (tenant) ID de Madecentro
    redirectUri: window.location.origin + window.location.pathname.replace(/[^/]+$/, "") + "index.html",
    postLogoutRedirectUri: window.location.origin,
  },

  // Permisos delegados de Microsoft Graph que la app solicita al usuario
  graphScopes: ["User.Read", "Sites.ReadWrite.All"],

  // --- SharePoint / Microsoft Lists ---
  // Usado SOLO por gestionar-casos.html (login Microsoft, equipo AYJ).
  sharepoint: {
    // ID del sitio de SharePoint donde vive la lista. Ej: "contoso.sharepoint.com,GUID,GUID"
    siteId: "ayjcsp.sharepoint.com,c7a4dc17-944b-4ffb-8a45-6b58a6380e7a,bbba19ba-2b3e-4b11-bc3f-ce54e0dec277",
    // ID (o nombre) de la lista "CasosSoporteIMOS"
    listId: "126c7de4-9596-453b-ad8c-572d16c1be45",
    // Nombre de la biblioteca de documentos donde se guardan los adjuntos de los casos
    attachmentsLibrary: "AdjuntosCasos",
  },

  // --- Flujos de Power Automate ---
  // Usado por las páginas de Madecentro (login simple, sin cuenta Microsoft):
  // nuevo-caso.html, mis-casos.html, helpdesk.html.
  // Pegá acá la URL "HTTP POST URL" que te da cada flujo al guardarlo.
  powerAutomate: {
    crearCasoUrl: "https://defaultc03f8e4026004b72bd823d604e8a9a.ac.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/18/workflows/36f266747c6044bb8289c03eb2702207/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BB78BEJKqv4ZUz2sSl3kTcYBqRWT210wlMnH5Z_f0eM",
    misCasosUrl: "https://defaultc03f8e4026004b72bd823d604e8a9a.ac.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/13/workflows/863e00d32d28466198405d7e03398a21/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IHg6f3WT-5zTwi-PJlV1-UG8QLiRxHF7td4c5uxRk4A",
    casosResueltosUrl: "https://defaultc03f8e4026004b72bd823d604e8a9a.ac.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/06/workflows/08958f10db2c4f26ba2bca0b25c3aae0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DviA7NcCKBKTIFr7EQdLDMplCbi9SZ8SWzDikaSKdDs",
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
