/**
 * nav.js
 * Dos barras de navegación separadas:
 *  - renderNavPublic: páginas de clientes (login simple nombre+correo+empresa)
 *  - renderNav: página interna de AYJ (login Microsoft)
 * Ambas insertan en <div id="app-nav"></div>.
 */

function renderNavPublic(user, activePage) {
  const nav = document.getElementById("app-nav");
  if (!nav) return;

  const links = [
    { href: "nuevo-caso.html", label: "Nuevo caso", key: "nuevo-caso" },
    { href: "mis-casos.html", label: "Mis casos", key: "mis-casos" },
    { href: "helpdesk.html", label: "Mini Helpdesk", key: "helpdesk" },
  ];

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="nuevo-caso.html" class="nav-brand">
        <span class="nav-brand-badge">S</span>
        Soporte IMOS${user && user.cliente ? " · " + user.cliente : ""}
      </a>
      <div class="nav-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.key === activePage ? "active" : ""}">${l.label}</a>`
          )
          .join("")}
      </div>
      <div class="nav-user">
        <span>${user ? user.nombre : ""}</span>
        <button id="btn-logout" class="btn btn-ghost btn-sm">Salir</button>
      </div>
    </div>
  `;

  const btn = document.getElementById("btn-logout");
  if (btn) btn.addEventListener("click", () => simpleLogout());
}

/**
 * Nav de la vista interna de AYJ (gestionar-casos.html), con login Microsoft.
 */
function renderNav(account, activePage) {
  const nav = document.getElementById("app-nav");
  if (!nav) return;

  const nombre = account ? account.name : "";
  const links = [{ href: "gestionar-casos.html", label: "Gestionar casos", key: "gestionar-casos" }];

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="gestionar-casos.html" class="nav-brand">
        <span class="nav-brand-badge">M</span>
        Soporte IMOS · Vista AYJ
      </a>
      <div class="nav-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.key === activePage ? "active" : ""}">${l.label}</a>`
          )
          .join("")}
      </div>
      <div class="nav-user">
        <span>${nombre}</span>
        <button id="btn-logout" class="btn btn-ghost btn-sm">Salir</button>
      </div>
    </div>
  `;

  const btn = document.getElementById("btn-logout");
  if (btn) btn.addEventListener("click", () => logout());
}
