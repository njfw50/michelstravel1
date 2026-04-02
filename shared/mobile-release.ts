export type SupportedReleaseLanguage = "pt" | "en" | "es";

export type AndroidReleaseInfo = {
  status: "coming_soon" | "ready";
  version: string | null;
  directDownloadUrl: string | null;
  archivedDownloadUrl: string | null;
  playStoreUrl: string | null;
  packageName: string;
  minAndroid: string;
  sizeLabel: string | null;
  releasedAt: string | null;
  sha256: string | null;
  commitHash?: string | null;
  commitUrl?: string | null;
  commitMessage?: string | null;
  updateRequired?: boolean;
  installNotes: Record<SupportedReleaseLanguage, string>;
};

export type MobileReleaseChannel = {
  appName: string;
  installPagePath: string;
  android: AndroidReleaseInfo;
};

export type AppReleaseManifest = {
  senior: MobileReleaseChannel;
  admin: MobileReleaseChannel;
};

const defaultNotes = {
  senior: {
    pt: "Quando o app Android estiver publicado, o botao de download aparece aqui automaticamente.",
    en: "When the Android app is published, the download button will appear here automatically.",
    es: "Cuando la app de Android este publicada, el boton de descarga aparecera aqui automaticamente.",
  },
  admin: {
    pt: "Quando o app Admin for publicado, o botao de instalacao aparece aqui automaticamente.",
    en: "When the Admin app is published, the install button will appear here automatically.",
    es: "Cuando la app Admin sea publicada, el boton de instalacion aparecera aqui automaticamente.",
  },
} satisfies Record<"senior" | "admin", Record<SupportedReleaseLanguage, string>>;

export const DEFAULT_APP_RELEASE_MANIFEST: AppReleaseManifest = {
  senior: {
    appName: "Michels Travel",
    installPagePath: "/apps/michels-travel",
    android: {
      status: "coming_soon",
      version: null,
      directDownloadUrl: null,
      archivedDownloadUrl: null,
      playStoreUrl: null,
      packageName: "agency.michelstravel.app",
      minAndroid: "8.0+",
      sizeLabel: null,
      releasedAt: null,
      sha256: null,
      commitHash: null,
      commitUrl: null,
      commitMessage: null,
      updateRequired: false,
      installNotes: defaultNotes.senior,
    },
  },
  admin: {
    appName: "Michels Travel Admin",
    installPagePath: "/apps/michels-travel-admin",
    android: {
      status: "coming_soon",
      version: null,
      directDownloadUrl: null,
      archivedDownloadUrl: null,
      playStoreUrl: null,
      packageName: "agency.michelstravel.admin",
      minAndroid: "8.0+",
      sizeLabel: null,
      releasedAt: null,
      sha256: null,
      commitHash: null,
      commitUrl: null,
      commitMessage: null,
      updateRequired: false,
      installNotes: defaultNotes.admin,
    },
  },
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function mergeInstallNotes(
  value: unknown,
  fallback: Record<SupportedReleaseLanguage, string>,
): Record<SupportedReleaseLanguage, string> {
  if (!isObject(value)) {
    return fallback;
  }

  return {
    pt: typeof value.pt === "string" ? value.pt : fallback.pt,
    en: typeof value.en === "string" ? value.en : fallback.en,
    es: typeof value.es === "string" ? value.es : fallback.es,
  };
}

function mergeChannel(channel: unknown, fallback: MobileReleaseChannel): MobileReleaseChannel {
  const channelValue = isObject(channel) ? channel : {};
  const androidValue = isObject(channelValue.android) ? channelValue.android : {};

  return {
    appName: typeof channelValue.appName === "string" ? channelValue.appName : fallback.appName,
    installPagePath:
      typeof channelValue.installPagePath === "string"
        ? channelValue.installPagePath
        : fallback.installPagePath,
    android: {
      ...fallback.android,
      status: androidValue.status === "ready" ? "ready" : "coming_soon",
      version: typeof androidValue.version === "string" ? androidValue.version : fallback.android.version,
      directDownloadUrl:
        typeof androidValue.directDownloadUrl === "string"
          ? androidValue.directDownloadUrl
          : fallback.android.directDownloadUrl,
      archivedDownloadUrl:
        typeof androidValue.archivedDownloadUrl === "string"
          ? androidValue.archivedDownloadUrl
          : fallback.android.archivedDownloadUrl,
      playStoreUrl:
        typeof androidValue.playStoreUrl === "string"
          ? androidValue.playStoreUrl
          : fallback.android.playStoreUrl,
      packageName:
        typeof androidValue.packageName === "string"
          ? androidValue.packageName
          : fallback.android.packageName,
      minAndroid:
        typeof androidValue.minAndroid === "string"
          ? androidValue.minAndroid
          : fallback.android.minAndroid,
      sizeLabel:
        typeof androidValue.sizeLabel === "string" ? androidValue.sizeLabel : fallback.android.sizeLabel,
      releasedAt:
        typeof androidValue.releasedAt === "string" ? androidValue.releasedAt : fallback.android.releasedAt,
      sha256: typeof androidValue.sha256 === "string" ? androidValue.sha256 : fallback.android.sha256,
      commitHash:
        typeof androidValue.commitHash === "string" ? androidValue.commitHash : fallback.android.commitHash,
      commitUrl: typeof androidValue.commitUrl === "string" ? androidValue.commitUrl : fallback.android.commitUrl,
      commitMessage:
        typeof androidValue.commitMessage === "string"
          ? androidValue.commitMessage
          : fallback.android.commitMessage,
      updateRequired:
        typeof androidValue.updateRequired === "boolean"
          ? androidValue.updateRequired
          : fallback.android.updateRequired,
      installNotes: mergeInstallNotes(androidValue.installNotes, fallback.android.installNotes),
    },
  };
}

export function mergeReleaseManifest(data: unknown): AppReleaseManifest {
  if (!isObject(data)) {
    return DEFAULT_APP_RELEASE_MANIFEST;
  }

  return {
    senior: mergeChannel(data.senior, DEFAULT_APP_RELEASE_MANIFEST.senior),
    admin: mergeChannel(data.admin, DEFAULT_APP_RELEASE_MANIFEST.admin),
  };
}
