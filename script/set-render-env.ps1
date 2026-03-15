param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [string]$ServiceId = "srv-d6p1ugua2pns73f4ubqg"
)

$ErrorActionPreference = "Stop"

[Environment]::SetEnvironmentVariable("RENDER_API_KEY", $ApiKey, "User")
[Environment]::SetEnvironmentVariable("RENDER_SERVICE_ID", $ServiceId, "User")

$env:RENDER_API_KEY = $ApiKey
$env:RENDER_SERVICE_ID = $ServiceId

Write-Host "Render automation variables configured for the current user."
Write-Host "Service: $ServiceId"
Write-Host "Open a new terminal later if you want the variables loaded automatically."
