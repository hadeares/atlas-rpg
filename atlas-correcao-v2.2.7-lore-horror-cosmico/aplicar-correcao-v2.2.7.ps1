$ErrorActionPreference = "Stop"

$PatchDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $PatchDir

if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
  throw "A pasta da correção precisa estar dentro da raiz do projeto Atlas das Cinzas."
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot "backup-v2.2.7-$timestamp"

$files = @(
  "apps/api/src/creatures/creatures.service.ts",
  "apps/api/src/creatures/generation/original-creature-generator.ts",
  "apps/api/src/database/entities/creature-template.entity.ts",
  "apps/api/src/encounters/dto/generate-encounter.dto.ts",
  "apps/api/src/encounters/encounters.service.ts",
  "apps/api/src/encounters/generation/encounter-generator.ts",
  "apps/api/src/hexes/generation/lore-generator.ts",
  "apps/api/src/hexes/hexes.service.ts",
  "apps/web/app/globals.css",
  "apps/web/components/campaign-view.tsx",
  "apps/web/components/encounters-panel.tsx",
  "apps/web/lib/types.ts"
)

foreach ($relativePath in $files) {
  $source = Join-Path $PatchDir $relativePath
  $target = Join-Path $ProjectRoot $relativePath
  $backup = Join-Path $backupRoot $relativePath

  if (-not (Test-Path $source)) {
    throw "Arquivo da correção não encontrado: $relativePath"
  }

  if (Test-Path $target) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
    Copy-Item $target $backup -Force
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
  Copy-Item $source $target -Force
}

Remove-Item (Join-Path $ProjectRoot "apps/api/dist") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $ProjectRoot "apps/web/.next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Correção v2.2.7 aplicada com sucesso." -ForegroundColor Green
Write-Host "Backup: $backupRoot"
Write-Host "Não é necessário executar npm install nem recriar o banco."
Write-Host "Execute: npm run dev"
