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
  installNotes: Record<SupportedReleaseLanguage, string>;
};

export type AppReleaseManifest = {
  senior: {
    appName: string;
    installPagePath: string;
    android: AndroidReleaseInfo;
  };
  admin: {
    appName: string;
    installPagePath: string;
    android: AndroidReleaseInfo;
  };
};

export const DEFAULT_APP_RELEASE_MANIFEST: AppReleaseManifest = {
  senior: {
    appName: "Michels Travel Senior",
    installPagePath: "/apps/michels-travel-senior",
    android: {
      status: "coming_soon",
      version: null,
      directDownloadUrl: null,
      archivedDownloadUrl: null,
      playStoreUrl: null,
      packageName: "agency.michelstravel.senior",
      minAndroid: "8.0+",
      sizeLabel: null,
      releasedAt: null,
      sha256: null,
      installNotes: {
        pt: "Quando o APK Android estiver publicado, o botao de download aparece aqui automaticamente.",
        en: "When the Android APK is published, the download button will appear here automatically.",
        es: "Cuando el APK de Android este publicado, el boton de descarga aparecera aqui automaticamente.",
      },
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
      installNotes: {
        pt: "Quando o app Admin for publicado, o botao de instalacao aparece aqui automaticamente.",
        en: "When the Admin app is published, the install button will appear here automatically.",
        es: "Cuando la app Admin sea publicada, el boton de instalacion aparecera aqui automaticamente.",
      },
    },
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function fetchAppReleaseManifest(): Promise<AppReleaseManifest> {
  try {
    const response = await fetch("/app-release.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_APP_RELEASE_MANIFEST;
    }

    const data = (await response.json()) as unknown;
    return mergeReleaseManifest(data);
  } catch {
    return DEFAULT_APP_RELEASE_MANIFEST;
  }
}

function mergeReleaseManifest(data: unknown): AppReleaseManifest {
  if (!isObject(data)) {
    return DEFAULT_APP_RELEASE_MANIFEST;
  }

  const senior = isObject(data.senior) ? data.senior : {};
  const seniorAndroid = isObject(senior.android) ? senior.android : {};
  const admin = isObject(data.admin) ? data.admin : {};
  const adminAndroid = isObject(admin.android) ? admin.android : {};

  return {
    senior: {
      appName:
        typeof senior.appName === "string"
          ? senior.appName
          : DEFAULT_APP_RELEASE_MANIFEST.senior.appName,
      installPagePath:
        typeof senior.installPagePath === "string"
          ? senior.installPagePath
          : DEFAULT_APP_RELEASE_MANIFEST.senior.installPagePath,
      android: {
        ...DEFAULT_APP_RELEASE_MANIFEST.senior.android,
        status: seniorAndroid.status === "ready" ? "ready" : "coming_soon",
        version:
          typeof seniorAndroid.version === "string"
            ? seniorAndroid.version
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.version,
        directDownloadUrl:
          typeof seniorAndroid.directDownloadUrl === "string"
            ? seniorAndroid.directDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.directDownloadUrl,
        archivedDownloadUrl:
          typeof seniorAndroid.archivedDownloadUrl === "string"
            ? seniorAndroid.archivedDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.archivedDownloadUrl,
        playStoreUrl:
          typeof seniorAndroid.playStoreUrl === "string"
            ? seniorAndroid.playStoreUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.playStoreUrl,
        packageName:
          typeof seniorAndroid.packageName === "string"
            ? seniorAndroid.packageName
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.packageName,
        minAndroid:
          typeof seniorAndroid.minAndroid === "string"
            ? seniorAndroid.minAndroid
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.minAndroid,
        sizeLabel:
          typeof seniorAndroid.sizeLabel === "string"
            ? seniorAndroid.sizeLabel
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.sizeLabel,
        releasedAt:
          typeof seniorAndroid.releasedAt === "string"
            ? seniorAndroid.releasedAt
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.releasedAt,
        sha256:
          typeof seniorAndroid.sha256 === "string"
            ? seniorAndroid.sha256
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.sha256,
        installNotes: isObject(seniorAndroid.installNotes)
          ? {
              pt:
                typeof seniorAndroid.installNotes.pt === "string"
                  ? seniorAndroid.installNotes.pt
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.pt,
              en:
                typeof seniorAndroid.installNotes.en === "string"
                  ? seniorAndroid.installNotes.en
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.en,
              es:
                typeof seniorAndroid.installNotes.es === "string"
                  ? seniorAndroid.installNotes.es
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.es,
            }
          : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes,
      },
    },
    admin: {
      appName:
        typeof admin.appName === "string"
          ? admin.appName
          : DEFAULT_APP_RELEASE_MANIFEST.admin.appName,
      installPagePath:
        typeof admin.installPagePath === "string"
          ? admin.installPagePath
          : DEFAULT_APP_RELEASE_MANIFEST.admin.installPagePath,
      android: {
        ...DEFAULT_APP_RELEASE_MANIFEST.admin.android,
        status: adminAndroid.status === "ready" ? "ready" : "coming_soon",
        version:
          typeof adminAndroid.version === "string"
            ? adminAndroid.version
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.version,
        directDownloadUrl:
          typeof adminAndroid.directDownloadUrl === "string"
            ? adminAndroid.directDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.directDownloadUrl,
        archivedDownloadUrl:
          typeof adminAndroid.archivedDownloadUrl === "string"
            ? adminAndroid.archivedDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.archivedDownloadUrl,
        playStoreUrl:
          typeof adminAndroid.playStoreUrl === "string"
            ? adminAndroid.playStoreUrl
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.playStoreUrl,
        packageName:
          typeof adminAndroid.packageName === "string"
            ? adminAndroid.packageName
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.packageName,
        minAndroid:
          typeof adminAndroid.minAndroid === "string"
            ? adminAndroid.minAndroid
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.minAndroid,
        sizeLabel:
          typeof adminAndroid.sizeLabel === "string"
            ? adminAndroid.sizeLabel
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.sizeLabel,
        releasedAt:
          typeof adminAndroid.releasedAt === "string"
            ? adminAndroid.releasedAt
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.releasedAt,
        sha256:
          typeof adminAndroid.sha256 === "string"
            ? adminAndroid.sha256
            : DEFAULT_APP_RELEASE_MANIFEST.admin.android.sha256,
        installNotes: isObject(adminAndroid.installNotes)
          ? {
              pt:
                typeof adminAndroid.installNotes.pt === "string"
                  ? adminAndroid.installNotes.pt
                  : DEFAULT_APP_RELEASE_MANIFEST.admin.android.installNotes.pt,
              en:
                typeof adminAndroid.installNotes.en === "string"
                  ? adminAndroid.installNotes.en
                  : DEFAULT_APP_RELEASE_MANIFEST.admin.android.installNotes.en,
              es:
                typeof adminAndroid.installNotes.es === "string"
                  ? adminAndroid.installNotes.es
                  : DEFAULT_APP_RELEASE_MANIFEST.admin.android.installNotes.es,
            }
          : DEFAULT_APP_RELEASE_MANIFEST.admin.android.installNotes,
      },
    },
  };
}

export function hasSeniorAndroidRelease(manifest: AppReleaseManifest) {
  const android = manifest.senior.android;
  return (
    android.status === "ready" &&
    Boolean(android.playStoreUrl || android.directDownloadUrl)
  );
}

export function getSeniorAndroidPrimaryUrl(manifest: AppReleaseManifest) {
  return (
    manifest.senior.android.playStoreUrl ||
    manifest.senior.android.directDownloadUrl ||
    manifest.senior.installPagePath
  );
}

export function hasAdminAndroidRelease(manifest: AppReleaseManifest) {
  const android = manifest.admin.android;
  return (
    android.status === "ready" &&
    Boolean(android.playStoreUrl || android.directDownloadUrl)
  );
}

export function getAdminAndroidPrimaryUrl(manifest: AppReleaseManifest) {
  return (
    manifest.admin.android.playStoreUrl ||
    manifest.admin.android.directDownloadUrl ||
    manifest.admin.installPagePath
  );
}

export function formatReleaseDate(value: string | null, locale: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
