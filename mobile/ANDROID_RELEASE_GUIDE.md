# Michels Travel Senior - Android Release Guide

This app is prepared for Expo EAS cloud builds, so you do not need a local Android SDK or Java installation to generate the first Android release.

## 1. Install mobile dependencies

```powershell
cd C:\Users\njfw2\michelstravel1\mobile
pnpm install
```

## 2. Add your mobile env file

Copy `.env.example` to `.env` and keep at least:

```text
EXPO_PUBLIC_API_URL=https://www.michelstravel.agency
EXPO_PUBLIC_API_BASE_URL=https://www.michelstravel.agency
```

## 3. Login to Expo EAS

```powershell
cd C:\Users\njfw2\michelstravel1\mobile
npx eas-cli login
```

## 4. Generate the first Android APK

This profile creates an installable APK for direct download from the site:

```powershell
cd C:\Users\njfw2\michelstravel1\mobile
npx eas-cli build --platform android --profile preview
```

## 5. Publish the APK into the website

After Expo gives you the APK, download it to your computer and run:

```powershell
cd C:\Users\njfw2\michelstravel1
powershell -ExecutionPolicy Bypass -File .\script\publish-android-release.ps1 -ApkPath C:\path\to\michels-travel-senior.apk -Version 1.0.0
```

This does three things:

1. Copies the APK into `client/public/downloads`
2. Updates `client/public/app-release.json`
3. Turns on the Android install button on the website

## 6. Deploy the website

Deploy the site normally. After the deploy:

- the app promo blocks stay on the site
- the new public page `/apps/michels-travel-senior` becomes active
- Android users can tap the download button and install the APK from the phone

## 7. Production store build

When you are ready for Google Play, generate an AAB:

```powershell
cd C:\Users\njfw2\michelstravel1\mobile
npx eas-cli build --platform android --profile production
```

Then submit to Google Play:

```powershell
cd C:\Users\njfw2\michelstravel1\mobile
npx eas-cli submit --platform android --profile production
```
