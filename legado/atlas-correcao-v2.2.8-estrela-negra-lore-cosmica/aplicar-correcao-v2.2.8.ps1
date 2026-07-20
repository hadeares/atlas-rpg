$ErrorActionPreference = 'Stop'

$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Location).Path
$ProjectPackage = Join-Path $ProjectRoot 'package.json'

if (-not (Test-Path $ProjectPackage)) {
  throw 'Execute este script na raiz do projeto Atlas das Cinzas.'
}

$package = Get-Content $ProjectPackage -Raw | ConvertFrom-Json
if ($package.name -ne 'atlas-das-cinzas') {
  throw 'A pasta atual não parece ser o projeto Atlas das Cinzas.'
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $ProjectRoot "backups\correcao-v2.2.8-$timestamp"

$files = @(
  'package.json',
  'package-lock.json',
  'apps/api/package.json',
  'apps/api/src/campaigns/campaigns.service.ts',
  'apps/api/src/campaigns/generation/campaign-bible-generator.ts',
  'apps/api/src/creatures/creatures.service.ts',
  'apps/api/src/creatures/generation/original-creature-generator.ts',
  'apps/api/src/database/entities/creature-template.entity.ts',
  'apps/api/src/encounters/dto/generate-encounter.dto.ts',
  'apps/api/src/encounters/encounters.service.ts',
  'apps/api/src/encounters/generation/encounter-generator.ts',
  'apps/api/src/hexes/generation/hex-generator.ts',
  'apps/api/src/hexes/generation/lore-generator.ts',
  'apps/api/src/hexes/hexes.service.ts',
  'apps/web/package.json',
  'apps/web/app/globals.css',
  'apps/web/components/campaign-view.tsx',
  'apps/web/components/encounters-panel.tsx',
  'apps/web/lib/types.ts'
)

foreach ($relativePath in $files) {
  $source = Join-Path $PatchRoot $relativePath
  $destination = Join-Path $ProjectRoot $relativePath

  if (-not (Test-Path $source)) {
    throw "Arquivo ausente no patch: $relativePath"
  }

  if (Test-Path $destination) {
    $backup = Join-Path $backupRoot $relativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
    Copy-Item $destination $backup -Force
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item $source $destination -Force
}

Remove-Item (Join-Path $ProjectRoot 'apps/api/dist') -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $ProjectRoot 'apps/web/.next') -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host 'Atlas das Cinzas atualizado para v2.2.8.' -ForegroundColor Green
Write-Host "Backup criado em: $backupRoot" -ForegroundColor Cyan
Write-Host 'Os arquivos .env e o banco não foram alterados.' -ForegroundColor Yellow
Write-Host 'Execute: npm run dev' -ForegroundColor White
