"use strict";

import * as vscode from "vscode";
import * as prettier from "prettier/standalone";
import * as prettierPluginLiquidsoap from "liquidsoap-prettier";

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("liquidsoap", {
    async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
      const fullRange = new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount - 1).range.end,
      );

      const formattedCode = await prettier.format(document.getText(), {
        parser: "liquidsoap",
        plugins: [prettierPluginLiquidsoap],
      });

      return [vscode.TextEdit.replace(fullRange, formattedCode)];
    },
  });
}
