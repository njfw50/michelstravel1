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
  const android = isObject(senior.android) ? senior.android : {};

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
        status: android.status === "ready" ? "ready" : "coming_soon",
        version:
          typeof android.version === "string"
            ? android.version
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.version,
        directDownloadUrl:
          typeof android.directDownloadUrl === "string"
            ? android.directDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.directDownloadUrl,
        archivedDownloadUrl:
          typeof android.archivedDownloadUrl === "string"
            ? android.archivedDownloadUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.archivedDownloadUrl,
        playStoreUrl:
          typeof android.playStoreUrl === "string"
            ? android.playStoreUrl
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.playStoreUrl,
        packageName:
          typeof android.packageName === "string"
            ? android.packageName
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.packageName,
        minAndroid:
          typeof android.minAndroid === "string"
            ? android.minAndroid
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.minAndroid,
        sizeLabel:
          typeof android.sizeLabel === "string"
            ? android.sizeLabel
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.sizeLabel,
        releasedAt:
          typeof android.releasedAt === "string"
            ? android.releasedAt
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.releasedAt,
        sha256:
          typeof android.sha256 === "string"
            ? android.sha256
            : DEFAULT_APP_RELEASE_MANIFEST.senior.android.sha256,
        installNotes: isObject(android.installNotes)
          ? {
              pt:
                typeof android.installNotes.pt === "string"
                  ? android.installNotes.pt
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.pt,
              en:
                typeof android.installNotes.en === "string"
                  ? android.installNotes.en
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.en,
              es:
                typeof android.installNotes.es === "string"
                  ? android.installNotes.es
                  : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes.es,
            }
          : DEFAULT_APP_RELEASE_MANIFEST.senior.android.installNotes,
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
