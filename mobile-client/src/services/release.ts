import { APP_VERSION } from "../config/appInfo";
import { API_BASE, api } from "../lib/api";

type ReleaseInfo = {
  status?: "coming_soon" | "ready";
  version?: string | null;
  directDownloadUrl?: string | null;
  updateRequired?: boolean;
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function normalizeUrl(url: string | null | undefined) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

function extractSeniorRelease(data: unknown): ReleaseInfo {
  if (!isObject(data) || !isObject(data.senior) || !isObject(data.senior.android)) {
    return {};
  }

  return data.senior.android as ReleaseInfo;
}

export async function getMobileReleaseState() {
  const response = await api.get("/api/app-release", { timeout: 8000 });
  const release = extractSeniorRelease(response.data);
  const latestVersion = release.version ?? null;
  const updateAvailable =
    release.status === "ready" &&
    Boolean(latestVersion) &&
    compareVersions(latestVersion || APP_VERSION, APP_VERSION) > 0;

  return {
    currentVersion: APP_VERSION,
    latestVersion,
    updateAvailable,
    updateRequired: Boolean(updateAvailable && release.updateRequired),
    updateUrl: normalizeUrl(release.directDownloadUrl),
  };
}
