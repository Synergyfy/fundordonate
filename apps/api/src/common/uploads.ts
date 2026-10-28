import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Walks up to the workspace root (`.git` or `pnpm-workspace.yaml`) so uploads
 * land in a predictable `<repo>/uploads` folder regardless of whether the API
 * was started from the repo root or from `apps/api`.
 */
function workspaceRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (
      existsSync(join(dir, "pnpm-workspace.yaml")) ||
      existsSync(join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

/**
 * Where uploaded campaign media lives. Override with `UPLOAD_DIR`; defaults to
 * `<workspace>/uploads`, which `main.ts` also serves at `/uploads/`.
 */
export function uploadsRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured || join(workspaceRoot(process.cwd()), "uploads");
}

/**
 * Staging area for in-flight uploads. Multer writes the raw body here, the
 * pipeline scans/transforms from the file, and it is deleted afterwards — so a
 * 50MB upload never sits in the Node heap.
 */
export function uploadsTempDir(): string {
  const configured = process.env.UPLOAD_TMP_DIR?.trim();
  // Deliberately outside the statically-served uploads folder.
  return configured || join(workspaceRoot(process.cwd()), ".uploads-tmp");
}
