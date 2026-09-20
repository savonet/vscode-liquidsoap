// Bundles the desktop extension, which starts the language server, and the web
// one, which can only format.
import * as esbuild from "esbuild";

const production = !process.argv.includes("--watch");

const common = {
  bundle: true,
  format: "cjs",
  external: ["vscode"],
  minify: production,
  sourcemap: !production,
  logLevel: "info",
};

const builds = [
  { ...common, entryPoints: ["src/extension.ts"], outfile: "dist/extension.js", platform: "node", target: "node20" },
  {
    ...common,
    entryPoints: ["src/browser.ts"],
    outfile: "dist/browser.js",
    platform: "browser",
    target: "es2022",
    // The package's main entry is built for Node; its web build is not.
    alias: { "liquidsoap-prettier": "liquidsoap-prettier/dist/web.mjs" },
  },
];

if (production) await Promise.all(builds.map((build) => esbuild.build(build)));
else
  await Promise.all(
    builds.map(async (build) => (await esbuild.context(build)).watch()),
  );
