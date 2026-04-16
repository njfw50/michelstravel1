# Deploy Automation

This project now has a local Windows workflow for `check -> build -> commit -> push -> Render deploy`.

## 1. Configure Render once

Use your Render API key and service id in local user environment variables.

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\set-render-env.ps1 -ApiKey YOUR_RENDER_API_KEY -ServiceId srv-d6p1ugua2pns73f4ubqg
```

This does **not** commit the token into the repository.

## 1b. Configure Owner Desk push keys once

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\setup-owner-push.ps1
```

This generates VAPID keys locally if needed, stores them in your user environment and pushes the same values to Render.

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

## 6. Infrastructure Safeguards (Law 16)

To prevent deployment failures on Render/Linux, always adhere to these rules:

- **Build Tool Parity**: If a tool is required by `script/build.ts` (e.g., `esbuild`, `vite`, `tsx`), it MUST be in the `dependencies` object, not `devDependencies`.
- **Cross-Platform Paths**: Never use `import.meta.dirname` in configuration files. Use `fileURLToPath(import.meta.url)` to ensure compatibility with all Node 20+ environments.
- **Vite Environment**: Use `import.meta.env.PROD` instead of `process.env.NODE_ENV` in client-side code to comply with Vite's strict bundling rules.
- **Render Startup**: Ensure `cross-env` is available in `dependencies` for the `npm start` command.
