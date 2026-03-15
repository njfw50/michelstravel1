param(
  [string]$Subject = "mailto:noreply@michelstravel.agency",
  [string]$ApiKey = "",
  [string]$ServiceId = "",
  [switch]$ForceRotate
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $ApiKey) {
  $ApiKey = $env:RENDER_API_KEY
}

if (-not $ApiKey) {
  $ApiKey = [Environment]::GetEnvironmentVariable("RENDER_API_KEY", "User")
}

if (-not $ServiceId) {
  $ServiceId = $env:RENDER_SERVICE_ID
}

if (-not $ServiceId) {
  $ServiceId = [Environment]::GetEnvironmentVariable("RENDER_SERVICE_ID", "User")
}

if (-not $ApiKey) {
  throw "RENDER_API_KEY is not configured."
}

if (-not $ServiceId) {
  throw "RENDER_SERVICE_ID is not configured."
}

$existingPublic = [Environment]::GetEnvironmentVariable("OWNER_PUSH_PUBLIC_KEY", "User")
$existingPrivate = [Environment]::GetEnvironmentVariable("OWNER_PUSH_PRIVATE_KEY", "User")
$existingSubject = [Environment]::GetEnvironmentVariable("OWNER_PUSH_SUBJECT", "User")

$publicKey = $existingPublic
$privateKey = $existingPrivate
$subjectValue = if ($existingSubject) { $existingSubject } else { $Subject }

if ($ForceRotate -or -not $publicKey -or -not $privateKey) {
  Push-Location $repoRoot
  try {
    $json = node -e "const webpush=require('web-push'); process.stdout.write(JSON.stringify(webpush.generateVAPIDKeys()));"
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to generate VAPID keys."
    }

    $keys = $json | ConvertFrom-Json
    $publicKey = $keys.publicKey
    $privateKey = $keys.privateKey
  }
  finally {
    Pop-Location
  }
}

[Environment]::SetEnvironmentVariable("OWNER_PUSH_PUBLIC_KEY", $publicKey, "User")
[Environment]::SetEnvironmentVariable("OWNER_PUSH_PRIVATE_KEY", $privateKey, "User")
[Environment]::SetEnvironmentVariable("OWNER_PUSH_SUBJECT", $subjectValue, "User")

$env:OWNER_PUSH_PUBLIC_KEY = $publicKey
$env:OWNER_PUSH_PRIVATE_KEY = $privateKey
$env:OWNER_PUSH_SUBJECT = $subjectValue

$headers = @{
  Authorization = "Bearer $ApiKey"
  Accept = "application/json"
  "Content-Type" = "application/json"
}

function Set-RenderEnvVar {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $body = @{ value = $Value } | ConvertTo-Json
  Invoke-RestMethod `
    -Method Put `
    -Uri "https://api.render.com/v1/services/$ServiceId/env-vars/$Name" `
    -Headers $headers `
    -Body $body | Out-Null
}

Set-RenderEnvVar -Name "OWNER_PUSH_PUBLIC_KEY" -Value $publicKey
Set-RenderEnvVar -Name "OWNER_PUSH_PRIVATE_KEY" -Value $privateKey
Set-RenderEnvVar -Name "OWNER_PUSH_SUBJECT" -Value $subjectValue

Write-Host "Owner push keys configured locally and on Render."
Write-Host "Service: $ServiceId"
Write-Host "Subject: $subjectValue"
