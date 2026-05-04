
$baseUrl = "http://localhost:5000/api/admin/customers"
$secret = "STRESS_INTEGRITY_2026"
$iterations = 20

Write-Host "🚀 INICIANDO BOMBARDEIO DE ESTRESSE CRM (DATA-FILE MODE)" -ForegroundColor Cyan

# 1. Criar alvo via arquivo
$createJson = '{"fullName": "Power Stress Subject", "email": "power_stress_' + (Get-Date -UFormat "%s") + '@test.com"}'
$createJson | Out-File -FilePath "create_target.json" -Encoding utf8
$createRes = curl.exe -s -X POST $baseUrl -H "Content-Type: application/json" -H "x-stress-test-secret: $secret" -d "@create_target.json"
Write-Host "🎯 Alvo Criado: $createRes"

# Extrair ID
if ($createRes -match '"id":"([^"]+)"') {
    $targetId = $matches[1]
    Write-Host "🎯 ID Detectado: $targetId" -ForegroundColor Green
} else {
    Write-Host "❌ Falha ao obter ID. Resposta: $createRes" -ForegroundColor Red
    Remove-Item "create_target.json"
    exit
}

# 2. Concorrência
Write-Host "2. Iniciando 20 updates concorrentes..."
1..$iterations | ForEach-Object -Parallel {
    $id = $using:targetId
    $sec = $using:secret
    $url = "$using:baseUrl/$id"
    $updateFile = "update_$_.json"
    '{"notes": "Update via PowerShell ' + $_ + '"}' | Out-File -FilePath $updateFile -Encoding utf8
    curl.exe -s -X PATCH $url -H "Content-Type: application/json" -H "x-stress-test-secret: $sec" -d "@$updateFile" | Out-Null
    Write-Host "⚡ Update $_ enviado"
    Remove-Item $updateFile
} -ThrottleLimit 5

Remove-Item "create_target.json"
Write-Host "🏁 TESTE DE ESTRESSE FINALIZADO COM SUCESSO." -ForegroundColor Cyan
