// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const env = {
  appName: "Michels Travel Senior",
  appSlug: "michels-travel-senior",
  logoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/sxjmsWGHSCWtmjYWkIRO5A/sandbox/ysYqjPEQNiyfuAJPKWKpdN-img-1_1771483725000_na1fn_ZmxpZ2h0LWh1Yi1sb2dv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvc3hqbXNXR0hTQ1d0bWpZV2tJUk81QS9zYW5kYm94L3lzWXFqUEVRTml5ZnVBSlBLV0twZE4taW1nLTFfMTc3MTQ4MzcyNTAwMF9uYTFmbl9abXhwWjJoMExXaDFZaTFzYjJkdi5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=XacmTwSxrhsLdRQrXqNCUbc--9a0bOxJ022dzl6OvjtR7K~H1GDPcR3Lt1ibKmniBUBC3Cx8q3ira3SJmmlCWPDxQbERsYDCReOCW5AJqYQuEFXUdtpAzRBAIjMt3~nFcqhhaL9qpeaK6pJCqbGEzIAJfUJ7uDXWHDiiobL08mX8TURFFQX9Vh28Z19-olOMzTpY1bZ0nTaw7ZCaSZ58U4vR7WN6aqtp80Eg3-qTbxgVO86JDHWRvTUuuAUFZeqnv3ao6geo7rwBvZXYIYbEv7AHGkEpEKj-5fTGVnNHSlYKpzS2JvXtVHiIoke2yIRiaGW~WONwxFQStBVukiI00g__",
  scheme: "michelstravelsenior",
  iosBundleId: "agency.michelstravel.senior",
  androidPackage: "agency.michelstravel.senior",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
