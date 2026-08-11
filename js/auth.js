/**
 * auth.js
 * -----------------------------------------------------------------------
 * Login/logout con Microsoft (MSAL.js) usando las cuentas corporativas
 * de Madecentro (Azure AD / Entra ID). No hay contraseñas propias: todo
 * pasa por el login de Microsoft.
 * -----------------------------------------------------------------------
 */

const msalConfig = {
  auth: {
    clientId: APP_CONFIG.auth.clientId,
    authority: `https://login.microsoftonline.com/${APP_CONFIG.auth.tenantId}`,
    redirectUri: APP_CONFIG.auth.redirectUri,
    postLogoutRedirectUri: APP_CONFIG.auth.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

/**
 * Debe llamarse una vez al cargar cualquier página que use MSAL,
 * para procesar el redirect de login si venimos de uno.
 */
async function initAuth() {
  await msalInstance.initialize();
  const response = await msalInstance.handleRedirectPromise();
  if (response && response.account) {
    msalInstance.setActiveAccount(response.account);
  } else {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }
  return getActiveAccount();
}

function getActiveAccount() {
  return msalInstance.getActiveAccount();
}

async function login() {
  await msalInstance.loginRedirect({ scopes: APP_CONFIG.graphScopes });
}

async function logout() {
  const account = getActiveAccount();
  await msalInstance.logoutRedirect({ account });
}

/**
 * Devuelve un access token válido para llamar a Microsoft Graph.
 * Intenta primero en silencio; si hace falta interacción, redirige.
 */
async function getGraphToken() {
  const account = getActiveAccount();
  if (!account) {
    await login();
    return null;
  }
  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes: APP_CONFIG.graphScopes,
      account,
    });
    return result.accessToken;
  } catch (err) {
    await msalInstance.acquireTokenRedirect({ scopes: APP_CONFIG.graphScopes });
    return null;
  }
}

/**
 * Protege una página: si no hay sesión activa, manda a index.html a hacer login.
 * Llamar al inicio de cada página "privada" (nueva-caso, helpdesk, mis-casos).
 */
async function requireAuth() {
  const account = await initAuth();
  if (!account) {
    window.location.href = "index.html";
    return null;
  }
  return account;
}
