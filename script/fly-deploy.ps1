# script/fly-deploy.ps1
# Deploy automatizado para o Fly.io
# Uso: npm run fly:deploy
# Ou diretamente: powershell -ExecutionPolicy Bypass -File .\script\fly-deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Michels Travel — Deploy para Fly.io" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar se flyctl está instalado
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ flyctl não encontrado. Instalando..." -ForegroundColor Yellow
    iwr https://fly.io/install.ps1 -useb | iex
    $env:PATH += ";$env:USERPROFILE\.fly\bin"
}

# Verificar login
Write-Host "`n🔐 Verificando autenticação..." -ForegroundColor Yellow
$authStatus = fly auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Não autenticado. Abrindo login no navegador..." -ForegroundColor Yellow
    fly auth login
}

Write-Host "✅ Autenticado como: $authStatus" -ForegroundColor Green

# Build e deploy
Write-Host "`n📦 Iniciando deploy..." -ForegroundColor Yellow
fly deploy --remote-only

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "🌐 App: https://michelstravel.fly.dev" -ForegroundColor Cyan
    Write-Host "🌐 Domínio: https://www.michelstravel.agency" -ForegroundColor Cyan
    fly status
} else {
    Write-Host "`n❌ Deploy falhou. Verifique os logs:" -ForegroundColor Red
    fly logs
    exit 1
}
