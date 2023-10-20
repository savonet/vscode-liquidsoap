"use strict";

import * as vscode from "vscode";
import * as prettier from "prettier/standalone";
import * as prettierPluginLiquidsoap from "liquidsoap-prettier";

export function activate(context: vscode.ExtensionContext) {
  const channel: vscode.OutputChannel = vscode.window.createOutputChannel(
    "Liquidsoap Extension",
  );

  vscode.languages.registerDocumentFormattingEditProvider("liquidsoap", {
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
    ): Promise<vscode.TextEdit[]> {
      const fullRange = new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount - 1).range.end,
      );

      channel.appendLine(`Formatting source file: ${document.uri}`);

      const startTime = new Date();
      try {
        const formattedCode = await prettier.format(document.getText(), {
          parser: "liquidsoap",
          plugins: [prettierPluginLiquidsoap],
        });

        const endTime = new Date();
        const runtimeMs = endTime.getTime() - startTime.getTime();
        channel.appendLine(`Done formatting (${runtimeMs}ms)`);

        return [vscode.TextEdit.replace(fullRange, formattedCode)];
      } catch (err) {
        channel.appendLine(`Error while formatting file: ${err}`);
        return [];
      }
    },
  });
}
