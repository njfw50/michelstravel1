import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { createHash } from "crypto";
import { access, rm, readFile, stat, writeFile } from "fs/promises";

console.log("[BUILD] Initializing pipeline...");

const allowlist = [
  "@google/generative-ai", "axios", "connect-pg-simple", "cors", "date-fns",
  "drizzle-orm", "drizzle-zod", "express", "express-rate-limit",
  "express-session", "jsonwebtoken", "memorystore", "multer", "nanoid",
  "nodemailer", "openai", "passport", "passport-local", "pg", "stripe",
  "uuid", "ws", "xlsx", "zod", "zod-validation-error",
];

async function run() {
  try {
    console.log("[BUILD] Step 1: Cleaning dist...");
    await rm("dist", { recursive: true, force: true });

    console.log("[BUILD] Step 2: Building Frontend (Vite)...");
    try {
      // Disable sourcemaps to save memory on Render
      await viteBuild({
        build: {
          sourcemap: false,
          minify: 'esbuild',
          rollupOptions: {
            maxParallelFileOps: 2, // Reduce parallel operations to save memory
          }
        }
      });
      console.log("[BUILD] Frontend completed successfully.");
    } catch (viteErr) {
      console.error("[BUILD] ERROR in Step 2 (Frontend/Vite):", viteErr);
      throw viteErr;
    }

    console.log("[BUILD] Step 3: Building Backend (Esbuild)...");
    try {
      const pkg = JSON.parse(await readFile("package.json", "utf-8"));
      const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
      const externals = allDeps.filter(dep => !allowlist.includes(dep));

      await esbuild({
        entryPoints: ["server/index.ts"],
        platform: "node",
        bundle: true,
        format: "esm",
        outfile: "dist/index.mjs",
        banner: {
          js: 'import { createRequire } from "module"; import { fileURLToPath as __fileURLToPath } from "url"; import { dirname as __pathDirname } from "path"; const require = createRequire(import.meta.url); const __filename = __fileURLToPath(import.meta.url); const __dirname = __pathDirname(__filename);',
        },
        define: { "process.env.NODE_ENV": '"production"' },
        minify: true,
        treeShaking: true,
        logLevel: "error",
        logLimit: 20,
        external: externals,
      });

      await writeFile("dist/index.cjs", 'import("./index.mjs");\n');
      console.log("[BUILD] Backend completed successfully.");
      console.log("[BUILD] SUCCESS: Deployable artifacts ready in ./dist");
    } catch (esErr) {
      console.error("[BUILD] ERROR in Step 3 (Backend/Esbuild):", esErr);
      throw esErr;
    }
  } catch (err) {
    console.error("[BUILD] FATAL PIPELINE ERROR:", err);
    process.exit(1);
  }
}

run();
