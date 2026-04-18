export {};
const processWithEnvLoader = process as typeof process & {
  loadEnvFile?: (path?: string) => void;
};

try {
  processWithEnvLoader.loadEnvFile?.(".env");
} catch {
  // Local development can rely on shell-provided variables when .env is absent.
}

await import("./index");
