// Installs the language server into dist/server, where the extension starts it.
// Until liquidsoap-language-server is published on npm, the build comes from
// the prerelease its CI keeps up to date.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const into = path.join(root, "dist", "server");
const tarball =
  process.env.LIQUIDSOAP_LANGUAGE_SERVER ||
  "https://github.com/savonet/liquidsoap-language-server/releases/download/main-build/liquidsoap-language-server.tgz";

// Installed rather than unpacked: the server's own dependencies come with it.
fs.rmSync(into, { recursive: true, force: true });
fs.mkdirSync(into, { recursive: true });
execFileSync(
  "npm",
  ["install", "--prefix", into, "--omit=dev", "--no-package-lock", "--silent", tarball],
  { stdio: "inherit" },
);
console.log(`fetch-server: installed into ${into}`);
