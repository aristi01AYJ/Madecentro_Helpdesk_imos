# Soporte IMOS · Madecentro

Mini helpdesk para que los usuarios de **Madecentro** creen y consulten casos de soporte de **IMOS**, y el equipo de **AYJ** los resuelva. Los casos se guardan en una **lista de Microsoft Lists (SharePoint)** — sin base de datos propia.

- Repo: [aristi01AYJ/Madecentro_Helpdesk_imos](https://github.com/aristi01AYJ/Madecentro_Helpdesk_imos)
- Sitio (una vez publicado): `https://aristi01ayj.github.io/Madecentro_Helpdesk_imos/`

## Por qué hay dos formas de entrar

El sitio de SharePoint donde vive la lista de casos pertenece a la organización de **AYJ** (`ayjcsp.sharepoint.com`), no a Madecentro. Los usuarios de Madecentro no tienen cuenta Microsoft ahí, así que no pueden loguearse con Microsoft ni hablar directo con Microsoft Graph. Por eso el sitio tiene **dos caminos separados**:

| | Quién | Cómo entra | Con quién habla |
|---|---|---|---|
| **Madecentro** | Cualquiera que reporte un caso | Nombre + correo (sin cuenta Microsoft) | Flujos de **Power Automate** |
| **AYJ** | Equipo de soporte (hoy: Adolfo) | Login **Microsoft** (MSAL) | **Microsoft Graph API** directo |

## Qué incluye

- **Portal de entrada** (`index.html`): elegís si sos de Madecentro o del equipo AYJ.
- **Login simple** (`login-madecentro.html`): nombre + correo, sin contraseña — identifica quién crea cada caso.
- **Nuevo caso** (`nuevo-caso.html`): asunto, descripción, tipo de caso, urgencia, categoría. *(Adjuntos: fase 2, ver más abajo.)*
- **Mis casos** (`mis-casos.html`): cada usuario de Madecentro ve solo los casos que él mismo creó.
- **Gestionar casos** (`gestionar-casos.html`, login Microsoft): el equipo AYJ ve todos los casos, cambia el estado y escribe la solución.
- **Mini Helpdesk** (`helpdesk.html`): biblioteca de casos resueltos, filtrable por categoría y texto — se llena sola apenas un caso queda "Resuelto"/"Cerrado" con solución.

## Arquitectura

```
                    ┌── Madecentro (nombre + correo) ──┐
                    │                                   │
                    ▼                                   │
         Flujos de Power Automate  ─────────────────────┘
         (crear caso / mis casos / casos resueltos)
                    │
                    ▼
      Lista "CasosSoporteIMOS" (Microsoft Lists / SharePoint, sitio de AYJ)
                    ▲
                    │
         Microsoft Graph API (directo)
                    │
                    └── AYJ / equipo de soporte (login Microsoft, gestionar-casos.html)
```

Power Automate corre con la cuenta de AYJ (dueño del flujo), así que Madecentro nunca necesita permisos sobre SharePoint — solo llama a una URL.

> **Nota de seguridad:** la URL de cada flujo de Power Automate queda visible en el código del sitio (cualquiera que abra las herramientas de desarrollador del navegador la puede ver). Esa URL funciona como una clave: quien la tenga puede crear casos o leer la lista de casos resueltos. Es un nivel de seguridad razonable para un helpdesk interno de bajo riesgo, pero no uses este mismo patrón para datos sensibles. Si más adelante hace falta más seguridad, se puede agregar una clave adicional que el flujo valide antes de responder.

---

## 1. Crear la lista en SharePoint

Ya tenés el sitio: `https://ayjcsp.sharepoint.com/sites/MADECENTROIMOS`.

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser   # una sola vez
cd madecentro-soporte-imos\scripts
.\Create-CasosList.ps1 -SiteUrl "https://ayjcsp.sharepoint.com/sites/MADECENTROIMOS"
```

Al final imprime el `siteId` y `listId` — copiálos, los necesitás en el paso 3 (y para armar los flujos de Power Automate).

**Columnas que crea:**

| Columna            | Tipo                  | Notas                                   |
|---------------------|-----------------------|------------------------------------------|
| Title               | Texto                 | Se usa como "Asunto"                     |
| Descripcion         | Varias líneas de texto|                                            |
| TipoCaso            | Selección             | Error de sistema, Duda de uso, Solicitud de mejora, Capacitación, Licencias y accesos, Otro |
| Urgencia            | Selección             | Baja, Media, Alta, Crítica               |
| Categoria           | Selección             | Diseño, Cotización, Producción, Instalación, Licencias y accesos, Reportes, Otro |
| Estado              | Selección             | Abierto, En proceso, Resuelto, Cerrado (default: Abierto) |
| Solucion            | Varias líneas de texto| La completa AYJ al resolver              |
| CreadoPorNombre     | Texto                 |                                            |
| CreadoPorCorreo     | Texto                 |                                            |
| AdjuntosUrls        | Varias líneas de texto| Fase 2 (adjuntos)                        |

## 2. Crear los 3 flujos de Power Automate

Esto reemplaza el registro de app en Azure AD para el lado de Madecentro — no hace falta Azure AD para esta parte. Los tres flujos van uno por uno; empezamos por el primero y seguimos cuando lo tengas funcionando.

### 2.1 Flujo "IMOS - Crear Caso"

1. Andá a [make.powerautomate.com](https://make.powerautomate.com) → **Flujos de nube** → **+ Nuevo flujo** → **Flujo de nube instantáneo**.
2. Nombre: `IMOS - Crear Caso`. Desencadenador: **Cuando se recibe una solicitud HTTP**. Crear.
3. En el desencadenador, pegá este JSON en "Esquema JSON del cuerpo de solicitud" (botón "Usar contenido de ejemplo" para generarlo, o pegalo directo):

```json
{
  "type": "object",
  "properties": {
    "asunto": { "type": "string" },
    "descripcion": { "type": "string" },
    "tipoCaso": { "type": "string" },
    "urgencia": { "type": "string" },
    "categoria": { "type": "string" },
    "creadoPorNombre": { "type": "string" },
    "creadoPorCorreo": { "type": "string" }
  }
}
```

4. **+ Nuevo paso** → buscar **SharePoint** → acción **Crear elemento**.
   - Dirección del sitio: `https://ayjcsp.sharepoint.com/sites/MADECENTROIMOS`
   - Nombre de lista: `CasosSoporteIMOS`
   - Completá los campos con el contenido dinámico del disparador: Title = `asunto`, Descripcion = `descripcion`, TipoCaso = `tipoCaso`, Urgencia = `urgencia`, Categoria = `categoria`, Estado = escribí manualmente `Abierto`, CreadoPorNombre = `creadoPorNombre`, CreadoPorCorreo = `creadoPorCorreo`.
5. **+ Nuevo paso** → **Respuesta** (acción "Response"):
   - Código de estado: `200`
   - Encabezados: agregar `Content-Type` = `application/json` y `Access-Control-Allow-Origin` = `*`
   - Cuerpo: `{ "ok": true, "id": "@{outputs('Crear_elemento')?['body/ID']}" }` (ajustá el nombre `Crear_elemento` al que le haya puesto Power Automate al paso anterior, lo ves en el selector de contenido dinámico).
6. Guardar. Abrí el paso del desencadenador (el primero) — ahí aparece **URL HTTP POST**. Copiala.

### 2.2 Pegar la URL en el sitio

Abrí `js/config.js` y reemplazá:

```js
powerAutomate: {
  crearCasoUrl: "PEGAR_ACÁ_LA_URL_QUE_COPIASTE",
  ...
}
```

### 2.3 Probar

Con el sitio corriendo localmente o ya en GitHub Pages, entrá como Madecentro, creá un caso de prueba, y confirmá que aparece en la lista de SharePoint (`Contenido del sitio` → `CasosSoporteIMOS`).

Cuando esto funcione, seguimos con los otros dos flujos (**"IMOS - Mis Casos"** e **"IMOS - Casos Resueltos"**) — misma lógica, cambia la acción de SharePoint por "Obtener elementos" con un filtro. Te doy el detalle de esos dos cuando confirmes que este primero te funcionó.

## 3. Login Microsoft para el equipo AYJ (gestionar-casos.html)

1. [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Nombre: `Soporte IMOS Madecentro`. Cuenta: solo tu organización.
3. Redirect URI tipo **SPA**: `https://aristi01ayj.github.io/Madecentro_Helpdesk_imos/index.html`
4. Copiá **Application (client) ID** y **Directory (tenant) ID**.
5. **API permissions** → Microsoft Graph → Delegated → `User.Read`, `Sites.ReadWrite.All` → **Grant admin consent**.
6. En `js/config.js`, completá `auth.clientId`, `auth.tenantId`, `sharepoint.siteId`, `sharepoint.listId` (estos dos últimos son los que imprimió el script del paso 1).

## 4. Publicar en GitHub Pages

Ya creaste el repo (`aristi01AYJ/Madecentro_Helpdesk_imos`). Desde la carpeta descomprimida:

```bash
cd madecentro-soporte-imos
git remote add origin https://github.com/aristi01AYJ/Madecentro_Helpdesk_imos.git
git branch -M main
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**. La URL que te da tiene que ser `https://aristi01ayj.github.io/Madecentro_Helpdesk_imos/` — si no coincide con lo que pusiste en el Redirect URI del paso 3, el login Microsoft va a fallar (el login simple de Madecentro no se ve afectado por esto).

---

## Estructura del proyecto

```
madecentro-soporte-imos/
├── index.html              # Portal: elegir Madecentro o AYJ
├── login-madecentro.html    # Login simple (nombre + correo)
├── nuevo-caso.html           # Crear caso (Madecentro)
├── mis-casos.html             # Mis casos (Madecentro)
├── helpdesk.html               # Biblioteca de casos resueltos (Madecentro)
├── gestionar-casos.html         # Resolver casos (AYJ, login Microsoft)
├── css/styles.css
├── js/
│   ├── config.js              # ⚠️ Completar: Azure AD + SharePoint + URLs de Power Automate
│   ├── auth.js                 # Login Microsoft (MSAL) — solo AYJ
│   ├── simpleAuth.js            # Login simple — solo Madecentro
│   ├── graphService.js           # Llamadas directas a Graph — solo AYJ (gestionar-casos.html)
│   ├── powerAutomateService.js    # Llamadas a los flujos — solo Madecentro
│   └── nav.js                      # Dos barras de navegación (pública / AYJ)
└── scripts/
    └── Create-CasosList.ps1        # Crea la lista y biblioteca en SharePoint
```

## Personalización de marca

Colores centralizados en `css/styles.css` (`:root { --mc-orange, --mc-navy, ... }`).

## Próximos pasos

- **Fase 2 — Adjuntos**: sumar el flujo de subida de archivos desde Madecentro (vía Power Automate) y reactivar el campo en `nuevo-caso.html`.
- **Notificaciones**: flujo de Power Automate que avise por correo/Teams cuando entra un caso con urgencia "Crítica".
- **Roles dentro de AYJ**: si sumás más gente al equipo de soporte, restringir `gestionar-casos.html` con un grupo de Azure AD.
