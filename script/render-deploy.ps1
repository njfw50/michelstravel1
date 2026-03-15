param(
  [string]$ServiceId = "",
  [string]$ApiKey = "",
  [int]$PollIntervalSeconds = 10,
  [int]$TimeoutMinutes = 20,
  [switch]$NoWait
)

$ErrorActionPreference = "Stop"

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
  throw "RENDER_API_KEY is not set. Configure it before deploying."
}

if (-not $ServiceId) {
  throw "RENDER_SERVICE_ID is not set. Configure it before deploying."
}

$headers = @{
  Authorization = "Bearer $ApiKey"
  Accept = "application/json"
  "Content-Type" = "application/json"
}

function Invoke-RenderRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [ValidateSet("Get", "Post")]
    [string]$Method = "Get",

    [int]$Retries = 3,

    [int]$RetryDelaySeconds = 5
  )

  for ($attempt = 1; $attempt -le $Retries; $attempt += 1) {
    try {
      return Invoke-RestMethod -Headers $headers -Uri $Uri -Method $Method
    }
    catch {
      if ($attempt -ge $Retries) {
        throw
      }

      Write-Host "Render request failed (attempt $attempt/$Retries). Retrying..."
      Start-Sleep -Seconds $RetryDelaySeconds
    }
  }
}

$serviceUrl = "https://api.render.com/v1/services/$ServiceId"
$deploy = Invoke-RenderRequest -Uri "$serviceUrl/deploys" -Method Post

Write-Host "Render deploy created: $($deploy.id)"
Write-Host "Commit: $($deploy.commit.id)"
Write-Host "Status: $($deploy.status)"

if ($NoWait) {
  return
}

$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$failedStatuses = @("build_failed", "update_failed", "pre_deploy_failed", "canceled")

while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $PollIntervalSeconds

  try {
    $deployItems = Invoke-RenderRequest -Uri "$serviceUrl/deploys?limit=20" -Method Get
  }
  catch {
    Write-Host "Render status check failed. Waiting for the next poll..."
    continue
  }

  $currentDeploy = $deployItems |
    ForEach-Object { $_.deploy } |
    Where-Object { $_.id -eq $deploy.id } |
    Select-Object -First 1

  if (-not $currentDeploy) {
    Write-Host "Render deploy not visible yet. Waiting..."
    continue
  }

  Write-Host "Render status: $($currentDeploy.status)"

  if ($currentDeploy.status -eq "live") {
    Write-Host "Render deploy is live."
    return
  }

  if ($failedStatuses -contains $currentDeploy.status) {
    throw "Render deploy failed with status '$($currentDeploy.status)'."
  }
}

throw "Render deploy did not reach 'live' within $TimeoutMinutes minutes."
