param(
  [Parameter(Mandatory = $true)]
  [string]$CommitMessage,

  [string]$Branch = "main",

  [string]$AndroidApkPath = "",

  [string]$AndroidVersion = "",

  [switch]$SkipCheck,

  [switch]$SkipBuild,

  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,

    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host "==> $Label"
  & $Action
}

Push-Location $repoRoot

try {
  if ($AndroidApkPath -or $AndroidVersion) {
    if (-not $AndroidApkPath -or -not $AndroidVersion) {
      throw "Use AndroidApkPath and AndroidVersion together."
    }

    Invoke-Step -Label "Publishing Android APK into website assets" -Action {
      powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\publish-android-release.ps1" -ApkPath $AndroidApkPath -Version $AndroidVersion
    }
  }

  if (-not $SkipCheck) {
    Invoke-Step -Label "Running npm run check" -Action {
      npm run check
      if ($LASTEXITCODE -ne 0) {
        throw "npm run check failed."
      }
    }
  }

  if (-not $SkipBuild) {
    Invoke-Step -Label "Running npm run build" -Action {
      npm run build
      if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed."
      }
    }
  }

  $status = git status --porcelain
  if (-not $status) {
    Write-Host "No local changes to commit."
  } else {
    Invoke-Step -Label "Staging files" -Action {
      git add -A
      if ($LASTEXITCODE -ne 0) {
        throw "git add failed."
      }
    }

    Invoke-Step -Label "Creating commit" -Action {
      git commit -m $CommitMessage
      if ($LASTEXITCODE -ne 0) {
        throw "git commit failed."
      }
    }

    Invoke-Step -Label "Pushing to origin/$Branch" -Action {
      git push origin $Branch
      if ($LASTEXITCODE -ne 0) {
        throw "git push failed."
      }
    }
  }

  if (-not $SkipDeploy) {
    Invoke-Step -Label "Triggering Render deploy" -Action {
      powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\render-deploy.ps1"
    }
  }
}
finally {
  Pop-Location
}
