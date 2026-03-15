param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath,

  [Parameter(Mandatory = $true)]
  [string]$Version,

  [string]$PlayStoreUrl = "",

  [string]$PackageName = "agency.michelstravel.senior",

  [string]$MinAndroid = "8.0+"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ApkPath)) {
  throw "APK not found: $ApkPath"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$downloadsDir = Join-Path $repoRoot "client\public\downloads"
$manifestPath = Join-Path $repoRoot "client\public\app-release.json"

New-Item -ItemType Directory -Force -Path $downloadsDir | Out-Null

$latestFileName = "michels-travel-senior-latest.apk"
$latestTarget = Join-Path $downloadsDir $latestFileName

Copy-Item -LiteralPath $ApkPath -Destination $latestTarget -Force

$fileInfo = Get-Item -LiteralPath $latestTarget
$sizeLabel = "{0:N1} MB" -f ($fileInfo.Length / 1MB)
$sha256 = (Get-FileHash -LiteralPath $latestTarget -Algorithm SHA256).Hash.ToLowerInvariant()
$releasedAt = (Get-Date).ToUniversalTime().ToString("o")

$manifest = [ordered]@{
  senior = [ordered]@{
    appName = "Michels Travel Senior"
    installPagePath = "/apps/michels-travel-senior"
    android = [ordered]@{
      status = "ready"
      version = $Version
      directDownloadUrl = "/downloads/${latestFileName}?v=$Version"
      archivedDownloadUrl = $null
      playStoreUrl = $(if ($PlayStoreUrl) { $PlayStoreUrl } else { $null })
      packageName = $PackageName
      minAndroid = $MinAndroid
      sizeLabel = $sizeLabel
      releasedAt = $releasedAt
      sha256 = $sha256
      installNotes = [ordered]@{
        pt = "Baixe o APK no Android e conclua a instalacao no seu celular."
        en = "Download the APK on Android and finish the installation on your phone."
        es = "Descargue el APK en Android y termine la instalacion en su telefono."
      }
    }
  }
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Android release published to website assets."
Write-Host "Latest APK: $latestTarget"
Write-Host "Manifest: $manifestPath"
