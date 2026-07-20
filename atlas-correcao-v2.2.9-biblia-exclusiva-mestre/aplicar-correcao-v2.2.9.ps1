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

$requiredBaseFile = Join-Path $ProjectRoot 'apps/api/src/campaigns/generation/campaign-bible-generator.ts'
if (-not (Test-Path $requiredBaseFile)) {
  throw 'A Bíblia da campanha não foi encontrada. Aplique primeiro a correção v2.2.8.'
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $ProjectRoot "backups\correcao-v2.2.9-$timestamp"

$files = @(
  'apps/api/src/campaigns/campaigns.service.ts',
  'apps/api/src/campaigns/generation/campaign-bible-generator.ts',
  'apps/web/components/campaign-view.tsx'
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
Write-Host 'Correção v2.2.9 aplicada: Bíblia exclusiva do mestre.' -ForegroundColor Green
Write-Host "Backup criado em: $backupRoot" -ForegroundColor Cyan
Write-Host 'Banco, arquivos .env e dependências não foram alterados.' -ForegroundColor Yellow
Write-Host 'Execute: npm run dev' -ForegroundColor White
