<#
.SYNOPSIS
  Crea la lista "CasosSoporteIMOS" en un sitio de SharePoint, con todas las
  columnas que usa la web de Soporte IMOS de Madecentro, más la biblioteca
  de documentos para adjuntos.

.REQUISITOS
  - Módulo PnP.PowerShell instalado:  Install-Module PnP.PowerShell -Scope CurrentUser
  - Permisos de administrador de sitio sobre el sitio de SharePoint destino.

.USO
  .\Create-CasosList.ps1 -SiteUrl "https://madecentro.sharepoint.com/sites/SoporteIMOS"
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$SiteUrl
)

Write-Host "Conectando a $SiteUrl ..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

# --- 1. Crear la lista principal de casos ---------------------------------
$listName = "CasosSoporteIMOS"
$existing = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue

if (-not $existing) {
  Write-Host "Creando lista '$listName'..." -ForegroundColor Cyan
  New-PnPList -Title $listName -Template GenericList -EnableAttachments:$false | Out-Null
} else {
  Write-Host "La lista '$listName' ya existe, se van a agregar/verificar las columnas." -ForegroundColor Yellow
}

# --- 2. Columnas de elección (choice) --------------------------------------
$choiceFields = @(
  @{ Name = "TipoCaso";  Choices = @("Error de sistema","Duda de uso","Solicitud de mejora","Capacitación","Licencias y accesos","Otro") },
  @{ Name = "Urgencia";  Choices = @("Baja","Media","Alta","Crítica") },
  @{ Name = "Categoria"; Choices = @("Diseño","Cotización","Producción","Instalación","Licencias y accesos","Reportes","Otro") },
  @{ Name = "Estado";    Choices = @("Abierto","En proceso","Resuelto","Cerrado") }
)

foreach ($f in $choiceFields) {
  if (-not (Get-PnPField -List $listName -Identity $f.Name -ErrorAction SilentlyContinue)) {
    Add-PnPField -List $listName -DisplayName $f.Name -InternalName $f.Name `
      -Type Choice -Choices $f.Choices -AddToDefaultView | Out-Null
    Write-Host "  + Columna '$($f.Name)' creada." -ForegroundColor Green
  }
}

# Valor por defecto para Estado
Set-PnPField -List $listName -Identity "Estado" -Values @{ DefaultValue = "Abierto" } | Out-Null

# --- 3. Columnas de texto ----------------------------------------------------
$textFields = @(
  @{ Name = "Descripcion";       Type = "Note" },
  @{ Name = "Solucion";          Type = "Note" },
  @{ Name = "CreadoPorNombre";   Type = "Text" },
  @{ Name = "CreadoPorCorreo";   Type = "Text" },
  @{ Name = "AdjuntosUrls";      Type = "Note" }
)

foreach ($f in $textFields) {
  if (-not (Get-PnPField -List $listName -Identity $f.Name -ErrorAction SilentlyContinue)) {
    Add-PnPField -List $listName -DisplayName $f.Name -InternalName $f.Name `
      -Type $f.Type -AddToDefaultView | Out-Null
    Write-Host "  + Columna '$($f.Name)' creada." -ForegroundColor Green
  }
}

# --- 4. Biblioteca de documentos para adjuntos ------------------------------
$libraryName = "AdjuntosCasos"
if (-not (Get-PnPList -Identity $libraryName -ErrorAction SilentlyContinue)) {
  Write-Host "Creando biblioteca de documentos '$libraryName'..." -ForegroundColor Cyan
  New-PnPList -Title $libraryName -Template DocumentLibrary | Out-Null
}

Write-Host ""
Write-Host "Listo. Datos para completar js/config.js:" -ForegroundColor Cyan
$web = Get-PnPWeb -Includes Id
$site = Get-PnPSite -Includes Id
$list = Get-PnPList -Identity $listName
Write-Host "  siteId (formato Graph): $($site.Id):$($web.Id)"  -ForegroundColor White
Write-Host "  listId: $($list.Id)" -ForegroundColor White
Write-Host ""
Write-Host "Nota: el formato correcto de siteId para Graph API es:" -ForegroundColor Yellow
Write-Host "  <hostname>,<site collection id>,<web id>" -ForegroundColor Yellow
Write-Host "  Podés obtenerlo también así:" -ForegroundColor Yellow
Write-Host "  GET https://graph.microsoft.com/v1.0/sites/madecentro.sharepoint.com:/sites/SoporteIMOS" -ForegroundColor Yellow
