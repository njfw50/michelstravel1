// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const appVariant = process.env.APP_VARIANT === "admin" ? "admin" : "senior";
const seniorProjectId = "3083bad9-35a2-4ee3-b97b-ef5f554dccd7";
const adminProjectId = process.env.EAS_PROJECT_ID_ADMIN || seniorProjectId;

const variantConfig = appVariant === "admin"
  ? {
      appName: "Michels Travel Admin",
      appSlug: "michels-travel-admin",
      scheme: "michelstraveladmin",
      iosBundleId: "agency.michelstravel.admin",
      androidPackage: "agency.michelstravel.admin",
      projectId: adminProjectId,
      version: process.env.APP_VERSION || "1.0.0",
    }
  : {
      appName: "Michels Travel Senior",
      appSlug: "michels-travel-senior",
      scheme: "michelstravelsenior",
      iosBundleId: "agency.michelstravel.senior",
      androidPackage: "agency.michelstravel.senior",
      projectId: seniorProjectId,
      version: process.env.APP_VERSION || "1.1.0",
    };

const config: ExpoConfig = {
  name: variantConfig.appName,
  slug: variantConfig.appSlug,
  version: variantConfig.version,
  extra: {
    eas: {
      projectId: variantConfig.projectId,
    },
    appVariant,
    appDisplayName: variantConfig.appName,
    appScheme: variantConfig.scheme,
  },
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: variantConfig.scheme,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: variantConfig.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#273B97",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: variantConfig.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: variantConfig.scheme,
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
        backgroundColor: "#F3F7FF",
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
