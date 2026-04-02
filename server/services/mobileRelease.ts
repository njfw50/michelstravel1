import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";

import type { SiteSetting } from "@shared/schema";
import {
  DEFAULT_APP_RELEASE_MANIFEST,
  mergeReleaseManifest,
  type AppReleaseManifest,
  type MobileReleaseChannel,
} from "@shared/mobile-release";

type ReleaseChannelKey = keyof AppReleaseManifest;

type ReleaseArtifactMetadata = {
  version?: string | null;
  packageName?: string | null;
  minAndroid?: string | null;
  appName?: string | null;
  installPagePath?: string | null;
  installNotes?: MobileReleaseChannel["android"]["installNotes"];
  updateRequired?: boolean;
};

type ReleaseArtifact = {
  fileName: string;
  relativeDownloadUrl: string;
  sizeBytes: number;
  sizeLabel: string;
  sha256: string;
  metadata: ReleaseArtifactMetadata;
};

type GitHubCommitInfo = {
  shortHash: string;
  fullHash: string;
  url: string;
  message: string;
  authoredAt: string | null;
};

const RELEASE_ARTIFACTS: Record<ReleaseChannelKey, { fileName: string; metadataFileName: string }> = {
  senior: {
    fileName: "michels-travel-latest.apk",
    metadataFileName: "michels-travel-latest.metadata.json",
  },
  admin: {
    fileName: "michels-travel-admin-latest.apk",
    metadataFileName: "michels-travel-admin-latest.metadata.json",
  },
};

async function resolvePublicFilePath(fileName: string) {
  for (const baseDir of [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "client", "public"),
  ]) {
    const candidate = path.join(baseDir, fileName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getPublicDownloadsDirCandidates() {
  return [
    path.resolve(process.cwd(), "dist", "public", "downloads"),
    path.resolve(process.cwd(), "client", "public", "downloads"),
  ];
}

async function resolveExistingPath(fileName: string) {
  for (const downloadsDir of getPublicDownloadsDirCandidates()) {
    const candidate = path.join(downloadsDir, fileName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function readJsonFileIfExists<T>(filePath: string | null): Promise<T | null> {
  if (!filePath) {
    return null;
  }

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getStoredAppReleaseManifest(settings?: SiteSetting | undefined): AppReleaseManifest {
  return mergeReleaseManifest({
    senior: settings?.mobileConsumerRelease ?? undefined,
    admin: settings?.mobileAdminRelease ?? undefined,
  });
}

async function getStaticAppReleaseManifest() {
  const manifestPath = await resolvePublicFilePath("app-release.json");
  const staticManifest = await readJsonFileIfExists<AppReleaseManifest>(manifestPath);
  return mergeReleaseManifest(staticManifest);
}

export async function getPublicAppReleaseManifest(settings?: SiteSetting | undefined) {
  const staticManifest = await getStaticAppReleaseManifest();

  return mergeReleaseManifest({
    senior: settings?.mobileConsumerRelease ?? staticManifest.senior,
    admin: settings?.mobileAdminRelease ?? staticManifest.admin,
  });
}

export async function getReleaseArtifact(channel: ReleaseChannelKey): Promise<ReleaseArtifact | null> {
  const artifactConfig = RELEASE_ARTIFACTS[channel];
  const apkPath = await resolveExistingPath(artifactConfig.fileName);

  if (!apkPath) {
    return null;
  }

  const metadataPath = await resolveExistingPath(artifactConfig.metadataFileName);
  const metadata = (await readJsonFileIfExists<ReleaseArtifactMetadata>(metadataPath)) ?? {};
  const buffer = await fs.readFile(apkPath);
  const stat = await fs.stat(apkPath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  return {
    fileName: artifactConfig.fileName,
    relativeDownloadUrl: `/downloads/${artifactConfig.fileName}`,
    sizeBytes: stat.size,
    sizeLabel: formatFileSize(stat.size),
    sha256,
    metadata,
  };
}

function getGitHubRepoInfo() {
  return {
    owner: process.env.GITHUB_REPO_OWNER || "njfw50",
    repo: process.env.GITHUB_REPO_NAME || "michelstravel1",
    token: process.env.GITHUB_TOKEN || null,
  };
}

export async function verifyGitHubCommit(shortHash: string): Promise<GitHubCommitInfo> {
  const normalized = shortHash.trim();
  if (!/^[0-9a-f]{7,40}$/i.test(normalized)) {
    throw new Error("Use um commit hash valido com 7 a 40 caracteres hexadecimais.");
  }

  const repo = getGitHubRepoInfo();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "MichelsTravel-Mobile-Release",
  };

  if (repo.token) {
    headers.Authorization = `Bearer ${repo.token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits/${normalized}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error("Nao foi possivel validar esse commit no GitHub.");
  }

  const data = (await response.json()) as {
    sha: string;
    html_url: string;
    commit?: {
      message?: string;
      author?: { date?: string };
    };
  };

  return {
    shortHash: data.sha.slice(0, 7),
    fullHash: data.sha,
    url: data.html_url,
    message: data.commit?.message?.split("\n")[0] || "Commit verificado",
    authoredAt: data.commit?.author?.date || null,
  };
}

export async function buildPublishedChannelRelease(
  channel: ReleaseChannelKey,
  existingChannel?: MobileReleaseChannel | null,
): Promise<MobileReleaseChannel> {
  const fallback = existingChannel ?? DEFAULT_APP_RELEASE_MANIFEST[channel];
  const artifact = await getReleaseArtifact(channel);

  if (!artifact) {
    return fallback;
  }

  return mergeReleaseManifest({
    [channel]: {
      ...fallback,
      appName: artifact.metadata.appName || fallback.appName,
      installPagePath: artifact.metadata.installPagePath || fallback.installPagePath,
      android: {
        ...fallback.android,
        status: "ready",
        version: artifact.metadata.version || fallback.android.version,
        directDownloadUrl: artifact.relativeDownloadUrl,
        packageName: artifact.metadata.packageName || fallback.android.packageName,
        minAndroid: artifact.metadata.minAndroid || fallback.android.minAndroid,
        sizeLabel: artifact.sizeLabel,
        sha256: artifact.sha256,
        updateRequired:
          typeof artifact.metadata.updateRequired === "boolean"
            ? artifact.metadata.updateRequired
            : fallback.android.updateRequired,
        installNotes: artifact.metadata.installNotes || fallback.android.installNotes,
      },
    },
  })[channel];
}

export async function publishChannelRelease(
  channel: ReleaseChannelKey,
  commitHash: string,
  settings?: SiteSetting | undefined,
): Promise<MobileReleaseChannel> {
  const commit = await verifyGitHubCommit(commitHash);
  const artifact = await getReleaseArtifact(channel);

  if (!artifact) {
    throw new Error("O APK atual nao foi encontrado no deploy. Publique o binario primeiro.");
  }

  const existingManifest = getStoredAppReleaseManifest(settings);
  const current = existingManifest[channel];
  const version = artifact.metadata.version || current.android.version;

  if (!version) {
    throw new Error("Nao foi possivel determinar a versao do APK atual.");
  }

  return mergeReleaseManifest({
    [channel]: {
      ...current,
      appName: artifact.metadata.appName || current.appName,
      installPagePath: artifact.metadata.installPagePath || current.installPagePath,
      android: {
        ...current.android,
        status: "ready",
        version,
        directDownloadUrl: `${artifact.relativeDownloadUrl}?v=${encodeURIComponent(version)}&commit=${commit.shortHash}`,
        packageName: artifact.metadata.packageName || current.android.packageName,
        minAndroid: artifact.metadata.minAndroid || current.android.minAndroid,
        sizeLabel: artifact.sizeLabel,
        releasedAt: new Date().toISOString(),
        sha256: artifact.sha256,
        commitHash: commit.shortHash,
        commitUrl: commit.url,
        commitMessage: commit.message,
        updateRequired:
          typeof artifact.metadata.updateRequired === "boolean"
            ? artifact.metadata.updateRequired
            : current.android.updateRequired,
        installNotes: artifact.metadata.installNotes || current.android.installNotes,
      },
    },
  })[channel];
}

export async function getMobileReleaseStatus(channel: ReleaseChannelKey, settings?: SiteSetting | undefined) {
  const manifest = await getPublicAppReleaseManifest(settings);
  const artifact = await getReleaseArtifact(channel);

  return {
    channel,
    published: manifest[channel],
    artifact: artifact
      ? {
          fileName: artifact.fileName,
          directDownloadUrl: artifact.relativeDownloadUrl,
          version: artifact.metadata.version || null,
          packageName: artifact.metadata.packageName || null,
          minAndroid: artifact.metadata.minAndroid || null,
          sizeLabel: artifact.sizeLabel,
          sha256: artifact.sha256,
          updateRequired: artifact.metadata.updateRequired ?? false,
        }
      : null,
  };
}
