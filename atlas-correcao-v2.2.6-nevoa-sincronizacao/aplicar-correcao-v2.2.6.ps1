$ErrorActionPreference = "Stop"

$PatchRoot = $PSScriptRoot
$ProjectRoot = Split-Path $PatchRoot -Parent
$PackageJson = Join-Path $ProjectRoot "package.json"

if (-not (Test-Path $PackageJson)) {
  throw "A pasta da correção precisa estar dentro da raiz do projeto Atlas das Cinzas."
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $ProjectRoot "backup-v2.2.6-$Timestamp"

$Files = @(
  "apps/api/src/campaigns/campaigns.service.ts",
  "apps/api/src/campaigns/campaigns.controller.ts",
  "apps/api/src/hexes/hexes.service.ts",
  "apps/web/components/campaign-view.tsx",
  "apps/web/components/hex-map.tsx",
  "apps/web/lib/types.ts",
  "apps/web/lib/api.ts",
  "apps/web/app/globals.css"
)

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

foreach ($RelativePath in $Files) {
  $Source = Join-Path $PatchRoot $RelativePath
  $Destination = Join-Path $ProjectRoot $RelativePath
  $Backup = Join-Path $BackupRoot $RelativePath

  if (-not (Test-Path $Source)) {
    throw "Arquivo ausente na correção: $RelativePath"
  }

  if (Test-Path $Destination) {
    New-Item -ItemType Directory -Path (Split-Path $Backup -Parent) -Force | Out-Null
    Copy-Item $Destination $Backup -Force
  }

  New-Item -ItemType Directory -Path (Split-Path $Destination -Parent) -Force | Out-Null
  Copy-Item $Source $Destination -Force
}

Copy-Item (Join-Path $PatchRoot "CORRECAO-NEVOA-SINCRONIZACAO-V2.2.6.md") (Join-Path $ProjectRoot "CORRECAO-NEVOA-SINCRONIZACAO-V2.2.6.md") -Force

Remove-Item (Join-Path $ProjectRoot "apps/api/dist") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $ProjectRoot "apps/web/.next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Correção v2.2.6 aplicada com sucesso." -ForegroundColor Green
Write-Host "Backup criado em: $BackupRoot" -ForegroundColor Yellow
Write-Host "Banco de dados e arquivos .env foram preservados." -ForegroundColor Cyan
Write-Host "Execute: npm run dev" -ForegroundColor Cyan
