#!/usr/bin/env node

/**
 * Test runner for liquidsoap syntax highlighting
 * Tokenizes .liq files and generates HTML reports
 */

const fs = require("fs");
const path = require("path");
const vsctm = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");

const GRAMMAR_PATH = path.join(
  __dirname,
  "..",
  "syntaxes",
  "liquidsoap.tmLanguage.json"
);
const STDLIB_DIR = path.join(__dirname, "stdlib");
const OUTPUT_DIR = path.join(__dirname, "output");
const ONIG_WASM_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "vscode-oniguruma",
  "release",
  "onig.wasm"
);

// Scope to CSS class mapping
const SCOPE_COLORS = {
  "keyword.control": { color: "#C586C0", name: "keyword" },
  "keyword.operator": { color: "#D4D4D4", name: "operator" },
  "keyword.other": { color: "#569CD6", name: "keyword-other" },
  "entity.name.function": { color: "#DCDCAA", name: "function" },
  "entity.name.method": { color: "#DCDCAA", name: "method" },
  "storage.type": { color: "#4EC9B0", name: "type" },
  "storage.modifier": { color: "#569CD6", name: "modifier" },
  "constant.language": { color: "#569CD6", name: "constant" },
  "constant.numeric": { color: "#B5CEA8", name: "number" },
  "constant.character": { color: "#D7BA7D", name: "escape" },
  "constant.time": { color: "#B5CEA8", name: "time" },
  "string.quoted": { color: "#CE9178", name: "string" },
  "string.regexp": { color: "#D16969", name: "regexp" },
  "string.interpolation": { color: "#569CD6", name: "interpolation" },
  "comment.line": { color: "#6A9955", name: "comment" },
  "comment.block": { color: "#6A9955", name: "comment" },
  "comment.doc": { color: "#608B4E", name: "doc-comment" },
  "variable.parameter": { color: "#9CDCFE", name: "parameter" },
  "variable.language": { color: "#9CDCFE", name: "variable-lang" },
  "variable.encoder": { color: "#4FC1FF", name: "encoder" },
  variable: { color: "#9CDCFE", name: "variable" },
  "meta.function-call": { color: "#DCDCAA", name: "function-call" },
  "meta.type-annotation": { color: "#4EC9B0", name: "type-annotation" },
  "punctuation.comma": { color: "#D4D4D4", name: "punctuation" },
};

function getScopeStyle(scopes) {
  for (const [scopePrefix, style] of Object.entries(SCOPE_COLORS)) {
    for (const scope of scopes) {
      if (scope.includes(scopePrefix)) {
        return style;
      }
    }
  }
  return { color: "#D4D4D4", name: "default" };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function initGrammar() {
  const wasmBin = fs.readFileSync(ONIG_WASM_PATH).buffer;
  await oniguruma.loadWASM(wasmBin);

  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
      createOnigString: (str) => new oniguruma.OnigString(str),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === "source.liquidsoap") {
        const grammarContent = fs.readFileSync(GRAMMAR_PATH, "utf8");
        return vsctm.parseRawGrammar(grammarContent, GRAMMAR_PATH);
      }
      return null;
    },
  });

  return registry.loadGrammar("source.liquidsoap");
}

function tokenizeFile(grammar, content) {
  const lines = content.split("\n");
  const result = [];
  let ruleStack = vsctm.INITIAL;
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = grammar.tokenizeLine(line, ruleStack);
    const tokens = [];

    for (const token of lineTokens.tokens) {
      const text = line.substring(token.startIndex, token.endIndex);
      const scopes = token.scopes;
      tokens.push({ text, scopes, startIndex: token.startIndex });

      // Check for potential issues
      if (
        scopes.length === 1 &&
        scopes[0] === "source.liquidsoap" &&
        text.trim().length > 0
      ) {
        // Check for known constructs that should be highlighted
        const unmatched = checkUnmatchedConstruct(text.trim());
        if (unmatched) {
          issues.push({
            line: i + 1,
            text: text.trim(),
            issue: unmatched,
          });
        }
      }
    }

    result.push({ line: line, lineNumber: i + 1, tokens });
    ruleStack = lineTokens.ruleStack;
  }

  return { lines: result, issues };
}

function checkUnmatchedConstruct(text) {
  // Keywords that should be highlighted but might be missed
  const keywords = [
    "open",
    "finally",
    "yields",
    "null",
    "mod",
    "%include",
    "@flag",
    "@docof",
  ];

  for (const kw of keywords) {
    if (text === kw || text.startsWith(kw + " ") || text.startsWith(kw + "(")) {
      return `Keyword '${kw}' not highlighted`;
    }
  }

  // Check for dereference operator
  if (/^![a-z_]/.test(text)) {
    return "Dereference operator '!' not highlighted";
  }

  return null;
}

function generateLineHtml(lineData) {
  const { line, lineNumber, tokens } = lineData;
  let html = `<tr><td class="line-number">${lineNumber}</td><td class="code">`;

  if (tokens.length === 0 || line.length === 0) {
    html += "&nbsp;";
  } else {
    for (const token of tokens) {
      const style = getScopeStyle(token.scopes);
      const escapedText = escapeHtml(token.text);
      const scopeTitle = token.scopes.join(" → ");
      html += `<span class="token ${style.name}" style="color: ${style.color}" title="${escapeHtml(scopeTitle)}">${escapedText}</span>`;
    }
  }

  html += "</td></tr>\n";
  return html;
}

function generateFileHtml(filename, tokenResult) {
  const { lines, issues } = tokenResult;

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(filename)} - Syntax Highlight Test</title>
  <style>
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #1E1E1E;
      color: #D4D4D4;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #569CD6;
      font-size: 18px;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    }
    .file-info {
      color: #808080;
      font-size: 12px;
      margin-bottom: 20px;
    }
    .issues {
      background: #3E2A2A;
      border: 1px solid #7D4040;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 20px;
    }
    .issues h3 {
      color: #F48771;
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    .issues ul {
      margin: 0;
      padding-left: 20px;
    }
    .issues li {
      color: #D4D4D4;
      font-size: 12px;
      margin: 4px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    td {
      padding: 0;
      vertical-align: top;
    }
    .line-number {
      color: #858585;
      text-align: right;
      padding-right: 16px;
      width: 40px;
      user-select: none;
      border-right: 1px solid #333;
    }
    .code {
      padding-left: 16px;
      white-space: pre;
    }
    .token {
      cursor: default;
    }
    tr:hover {
      background: #2A2A2A;
    }
    .legend {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #252526;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 10px;
      font-size: 11px;
      max-width: 200px;
    }
    .legend h4 {
      margin: 0 0 8px 0;
      color: #808080;
    }
    .legend-item {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(filename)}</h1>
  <div class="file-info">${lines.length} lines</div>
`;

  if (issues.length > 0) {
    html += `
  <div class="issues">
    <h3>⚠️ Potential Highlighting Issues (${issues.length})</h3>
    <ul>
`;
    for (const issue of issues.slice(0, 20)) {
      html += `      <li>Line ${issue.line}: "${escapeHtml(issue.text)}" - ${escapeHtml(issue.issue)}</li>\n`;
    }
    if (issues.length > 20) {
      html += `      <li>... and ${issues.length - 20} more</li>\n`;
    }
    html += `    </ul>
  </div>
`;
  }

  html += `
  <div class="legend">
    <h4>Scope Colors</h4>
`;
  for (const [scope, style] of Object.entries(SCOPE_COLORS).slice(0, 10)) {
    html += `    <div class="legend-item"><span style="color: ${style.color}">■</span> ${scope}</div>\n`;
  }
  html += `  </div>

  <table>
`;

  for (const lineData of lines) {
    html += generateLineHtml(lineData);
  }

  html += `
  </table>
</body>
</html>
`;

  return html;
}

function generateIndexHtml(files) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Liquidsoap Grammar Test Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1E1E1E;
      color: #D4D4D4;
      margin: 0;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #569CD6;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    }
    .summary {
      background: #252526;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .summary h2 {
      margin-top: 0;
      color: #4EC9B0;
    }
    .stat {
      display: inline-block;
      margin-right: 30px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #DCDCAA;
    }
    .stat-label {
      font-size: 12px;
      color: #808080;
    }
    .file-list {
      list-style: none;
      padding: 0;
    }
    .file-list li {
      margin: 4px 0;
    }
    .file-list a {
      color: #9CDCFE;
      text-decoration: none;
    }
    .file-list a:hover {
      text-decoration: underline;
    }
    .has-issues {
      color: #F48771 !important;
    }
    .issue-count {
      color: #808080;
      font-size: 12px;
    }
    .section {
      margin-top: 30px;
    }
    .section h3 {
      color: #4EC9B0;
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
    }
  </style>
</head>
<body>
  <h1>Liquidsoap Grammar Test Results</h1>

  <div class="summary">
    <h2>Summary</h2>
    <div class="stat">
      <div class="stat-value">${files.length}</div>
      <div class="stat-label">Files Tested</div>
    </div>
    <div class="stat">
      <div class="stat-value">${files.filter((f) => f.issues > 0).length}</div>
      <div class="stat-label">Files with Issues</div>
    </div>
    <div class="stat">
      <div class="stat-value">${files.reduce((sum, f) => sum + f.issues, 0)}</div>
      <div class="stat-label">Total Issues</div>
    </div>
  </div>

  <div class="section">
    <h3>Files with Issues</h3>
    <ul class="file-list">
`;

  const filesWithIssues = files.filter((f) => f.issues > 0);
  if (filesWithIssues.length === 0) {
    html += `      <li>No issues found!</li>\n`;
  } else {
    for (const file of filesWithIssues) {
      html += `      <li><a href="${escapeHtml(file.htmlPath)}" class="has-issues">${escapeHtml(file.name)}</a> <span class="issue-count">(${file.issues} issues)</span></li>\n`;
    }
  }

  html += `
    </ul>
  </div>

  <div class="section">
    <h3>All Files</h3>
    <ul class="file-list">
`;

  for (const file of files) {
    const issueClass = file.issues > 0 ? ' class="has-issues"' : "";
    const issueCount =
      file.issues > 0
        ? ` <span class="issue-count">(${file.issues} issues)</span>`
        : "";
    html += `      <li><a href="${escapeHtml(file.htmlPath)}"${issueClass}>${escapeHtml(file.name)}</a>${issueCount}</li>\n`;
  }

  html += `
    </ul>
  </div>
</body>
</html>
`;

  return html;
}

function getAllLiqFiles(dir, basePath = "") {
  const files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllLiqFiles(fullPath, relativePath));
    } else if (item.endsWith(".liq")) {
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

async function main() {
  console.log("Initializing grammar...");
  const grammar = await initGrammar();

  if (!fs.existsSync(STDLIB_DIR)) {
    console.error(
      "Error: stdlib directory not found. Run 'node fetch-stdlib.js' first."
    );
    process.exit(1);
  }

  // Clean and create output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const liqFiles = getAllLiqFiles(STDLIB_DIR);
  console.log(`\nProcessing ${liqFiles.length} files...\n`);

  const fileResults = [];

  for (const { fullPath, relativePath } of liqFiles) {
    const content = fs.readFileSync(fullPath, "utf8");
    const tokenResult = tokenizeFile(grammar, content);

    // Create output directory structure
    const outputPath = path.join(
      OUTPUT_DIR,
      relativePath.replace(".liq", ".html")
    );
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });

    // Generate and write HTML
    const html = generateFileHtml(relativePath, tokenResult);
    fs.writeFileSync(outputPath, html, "utf8");

    const issueCount = tokenResult.issues.length;
    const status = issueCount > 0 ? `⚠️  ${issueCount} issues` : "✓";
    console.log(`  ${status.padEnd(15)} ${relativePath}`);

    fileResults.push({
      name: relativePath,
      htmlPath: relativePath.replace(".liq", ".html"),
      issues: issueCount,
    });
  }

  // Generate index
  const indexHtml = generateIndexHtml(fileResults);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${OUTPUT_DIR}/index.html`);
  console.log(
    `Files with issues: ${fileResults.filter((f) => f.issues > 0).length}/${fileResults.length}`
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
