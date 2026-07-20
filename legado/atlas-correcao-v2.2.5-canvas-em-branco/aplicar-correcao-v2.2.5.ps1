$ErrorActionPreference = "Stop"

$patchDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $patchDir
$sourceFile = Join-Path $patchDir "files\apps\web\components\hex-map.tsx"
$targetFile = Join-Path $projectDir "apps\web\components\hex-map.tsx"

if (-not (Test-Path (Join-Path $projectDir "package.json"))) {
  throw "Execute o instalador com a pasta atlas-correcao-v2.2.5-canvas-em-branco dentro da raiz do projeto."
}

if (-not (Test-Path $sourceFile)) {
  throw "Arquivo da correção não encontrado: $sourceFile"
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $projectDir "backup-v2.2.5-$timestamp"
New-Item -ItemType Directory -Path (Join-Path $backupDir "apps\web\components") -Force | Out-Null

if (Test-Path $targetFile) {
  Copy-Item $targetFile (Join-Path $backupDir "apps\web\components\hex-map.tsx") -Force
}

Copy-Item $sourceFile $targetFile -Force
Remove-Item (Join-Path $projectDir "apps\web\.next") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Correção v2.2.5 aplicada." -ForegroundColor Green
Write-Host "Backup: $backupDir"
Write-Host "Agora execute: npm run dev"
