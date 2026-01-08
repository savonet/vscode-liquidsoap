#!/usr/bin/env node

/**
 * Fetches liquidsoap standard library files from GitHub for testing
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const GITHUB_API = "https://api.github.com";
const REPO_OWNER = "savonet";
const REPO_NAME = "liquidsoap";
const LIBS_PATH = "src/libs";
const OUTPUT_DIR = path.join(__dirname, "stdlib");

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "vscode-liquidsoap-test-suite",
        Accept: "application/vnd.github.v3+json",
      },
    };

    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(
              new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`)
            );
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "vscode-liquidsoap-test-suite" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchRaw(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      })
      .on("error", reject);
  });
}

async function getDirectoryContents(dirPath) {
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${dirPath}`;
  return fetchJson(url);
}

async function downloadFile(file, outputPath) {
  console.log(`  Downloading: ${file.name}`);
  const content = await fetchRaw(file.download_url);
  fs.writeFileSync(outputPath, content, "utf8");
}

async function processDirectory(dirPath, outputDir) {
  const contents = await getDirectoryContents(dirPath);

  for (const item of contents) {
    const itemOutputPath = path.join(outputDir, item.name);

    if (item.type === "dir") {
      fs.mkdirSync(itemOutputPath, { recursive: true });
      await processDirectory(item.path, itemOutputPath);
    } else if (item.name.endsWith(".liq")) {
      await downloadFile(item, itemOutputPath);
    }
  }
}

async function main() {
  console.log("Fetching liquidsoap standard library files...\n");

  // Clean and create output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  try {
    await processDirectory(LIBS_PATH, OUTPUT_DIR);
    console.log("\nDone! Files saved to:", OUTPUT_DIR);

    // Count files
    const countFiles = (dir) => {
      let count = 0;
      for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          count += countFiles(fullPath);
        } else if (item.endsWith(".liq")) {
          count++;
        }
      }
      return count;
    };
    console.log(`Total .liq files: ${countFiles(OUTPUT_DIR)}`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
