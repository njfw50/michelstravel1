import {
  DEFAULT_APP_RELEASE_MANIFEST,
  mergeReleaseManifest,
  type AppReleaseManifest,
} from "@shared/mobile-release";

async function fetchManifestFrom(url: string): Promise<AppReleaseManifest | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return mergeReleaseManifest((await response.json()) as unknown);
  } catch {
    return null;
  }
}

export { DEFAULT_APP_RELEASE_MANIFEST };
export type { AppReleaseManifest };

export async function fetchAppReleaseManifest(): Promise<AppReleaseManifest> {
  const apiManifest = await fetchManifestFrom("/api/app-release");
  if (apiManifest) {
    return apiManifest;
  }

  const staticManifest = await fetchManifestFrom("/app-release.json");
  return staticManifest ?? DEFAULT_APP_RELEASE_MANIFEST;
}

export function hasSeniorAndroidRelease(manifest: AppReleaseManifest) {
  const android = manifest.senior.android;
  return android.status === "ready" && Boolean(android.playStoreUrl || android.directDownloadUrl);
}

export function getSeniorAndroidPrimaryUrl(manifest: AppReleaseManifest) {
  return manifest.senior.android.playStoreUrl || manifest.senior.android.directDownloadUrl || manifest.senior.installPagePath;
}

export function hasAdminAndroidRelease(manifest: AppReleaseManifest) {
  const android = manifest.admin.android;
  return android.status === "ready" && Boolean(android.playStoreUrl || android.directDownloadUrl);
}

export function getAdminAndroidPrimaryUrl(manifest: AppReleaseManifest) {
  return manifest.admin.android.playStoreUrl || manifest.admin.android.directDownloadUrl || manifest.admin.installPagePath;
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
