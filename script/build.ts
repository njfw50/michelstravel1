import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { createHash } from "crypto";
import { access, rm, readFile, stat, writeFile } from "fs/promises";

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableViteTempLockError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("vite:esbuild-transpile") &&
    message.includes("being used by another process")
  );
}

async function buildClientWithRetry(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await viteBuild();
      return;
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableViteTempLockError(error)) {
        throw error;
      }

      console.warn(
        `[build] Vite hit a locked temp file on attempt ${attempt}/${maxAttempts}. Retrying...`,
      );
      await sleep(1000);
    }
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  await syncMobileReleaseAssets();

  console.log("building client...");
  await buildClientWithRetry();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "dist/index.mjs",
    banner: {
      js: 'import { createRequire } from "module"; import { fileURLToPath as __fileURLToPath } from "url"; import { dirname as __pathDirname } from "path"; const require = createRequire(import.meta.url); const __filename = __fileURLToPath(import.meta.url); const __dirname = __pathDirname(__filename);',
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  await writeFile("dist/index.cjs", 'import("./index.mjs");\n');
}

async function syncMobileReleaseAssets() {
  const apkPath = "client/public/downloads/michels-travel-latest.apk";
  const aliasApkPath = "client/public/downloads/michels-travel-senior-latest.apk";
  const metadataPath = "client/public/downloads/michels-travel-latest.metadata.json";
  const manifestPath = "client/public/app-release.json";
  const packagePath = "mobile-client/package.json";
  const gradlePath = "mobile-client/android/app/build.gradle";

  try {
    await access(apkPath);
  } catch {
    return;
  }

  const [apkBuffer, apkStats, mobilePackageRaw, gradleRaw] = await Promise.all([
    readFile(apkPath),
    stat(apkPath),
    readFile(packagePath, "utf-8"),
    readFile(gradlePath, "utf-8"),
  ]);

  const mobilePackage = JSON.parse(mobilePackageRaw) as { version?: string };
  const packageNameMatch = gradleRaw.match(/applicationId\s+"([^"]+)"/);
  const version = mobilePackage.version || "1.3.0";
  const packageName = packageNameMatch?.[1] || "agency.michelstravel.app";
  const sha256 = createHash("sha256").update(apkBuffer).digest("hex");
  const sizeLabel = `${(apkStats.size / (1024 * 1024)).toFixed(1)} MB`;
  const releasedAt = new Date().toISOString();

  const metadata = {
    appName: "Michels Travel",
    installPagePath: "/apps/michels-travel",
    version,
    packageName,
    minAndroid: "8.0+",
    installNotes: {
      pt: "Baixe o APK no Android e conclua a instalacao no seu celular.",
      en: "Download the APK on Android and finish the installation on your phone.",
      es: "Descargue el APK en Android y termine la instalacion en su telefono.",
    },
  };

  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  const existingManifest = JSON.parse(await readFile(manifestPath, "utf-8")) as Record<string, any>;
  existingManifest.senior = {
    appName: "Michels Travel",
    installPagePath: "/apps/michels-travel",
    android: {
      ...(existingManifest.senior?.android || {}),
      status: "ready",
      version,
      directDownloadUrl: `/downloads/michels-travel-latest.apk?v=${encodeURIComponent(version)}`,
      archivedDownloadUrl: existingManifest.senior?.android?.archivedDownloadUrl || null,
      playStoreUrl: existingManifest.senior?.android?.playStoreUrl || null,
      packageName,
      minAndroid: "8.0+",
      sizeLabel,
      releasedAt,
      sha256,
      installNotes: metadata.installNotes,
    },
  };

  await writeFile(manifestPath, `${JSON.stringify(existingManifest, null, 2)}\n`);

  try {
    await writeFile(aliasApkPath, apkBuffer);
  } catch {
    // Ignore alias write failures locally; the primary APK is enough for release publication.
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
