# Deploy Automation

This project now has a local Windows workflow for `check -> build -> commit -> push -> Render deploy`.

## 1. Configure Render once

Use your Render API key and service id in local user environment variables.

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\set-render-env.ps1 -ApiKey YOUR_RENDER_API_KEY -ServiceId srv-d6p1ugua2pns73f4ubqg
```

This does **not** commit the token into the repository.

## 2. Publish a normal site update

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\ship-site.ps1 -CommitMessage "feat: your update"
```

The script will:

1. Run `npm run check`
2. Run `npm run build`
3. `git add -A`
4. `git commit -m ...`
5. `git push origin main`
6. Trigger a Render deploy and wait until it becomes `live`

## 3. Publish a site update that includes a new Android APK

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\ship-site.ps1 -CommitMessage "feat: publish android apk" -AndroidApkPath C:\path\to\michels-travel-senior.apk -AndroidVersion 1.0.1
```

This also runs [publish-android-release.ps1](C:/Users/njfw2/michelstravel1/script/publish-android-release.ps1) before the normal Git and Render flow.

## 4. Optional flags

```powershell
-SkipCheck
-SkipBuild
-SkipDeploy
```

## 5. Direct Render deploy only

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\render-deploy.ps1
```
