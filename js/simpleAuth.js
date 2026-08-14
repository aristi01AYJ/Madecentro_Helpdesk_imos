/**
 * simpleAuth.js
 * -----------------------------------------------------------------------
 * "Login" liviano para usuarios de Madecentro que NO tienen cuenta
 * Microsoft en la organización de AYJ. No es autenticación real (no hay
 * contraseña ni verificación) — solo identifica quién dice ser quién,
 * igual que un formulario de "tu nombre" en cualquier mesa de ayuda.
 *
 * Se guarda en sessionStorage: se pierde al cerrar la pestaña, así cada
 * persona que use la misma computadora tiene que volver a identificarse.
 * -----------------------------------------------------------------------
 */

const SIMPLE_AUTH_KEY = "madecentroUser";

function getSimpleUser() {
  try {
    const raw = sessionStorage.getItem(SIMPLE_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSimpleUser(nombre, correo, cliente) {
  sessionStorage.setItem(SIMPLE_AUTH_KEY, JSON.stringify({ nombre, correo, cliente }));
}

function simpleLogout() {
  sessionStorage.removeItem(SIMPLE_AUTH_KEY);
  window.location.href = "login.html";
}

/**
 * Protege una página "de Madecentro": si no hay usuario simple guardado,
 * manda al login. Llamar al inicio de nuevo-caso.html, mis-casos.html y
 * helpdesk.html.
 */
function requireSimpleAuth() {
  const user = getSimpleUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}
