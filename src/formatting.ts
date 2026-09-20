import * as prettier from "prettier/standalone";
import * as prettierPluginLiquidsoap from "liquidsoap-prettier";
import * as vscode from "vscode";

/** Formats with liquidsoap-prettier, where the language server cannot run. */
export const registerFormatter = (
  channel: vscode.OutputChannel,
): vscode.Disposable =>
  vscode.languages.registerDocumentFormattingEditProvider("liquidsoap", {
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
    ): Promise<vscode.TextEdit[]> {
      const fullRange = new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount - 1).range.end,
      );
      try {
        const formatted = await prettier.format(document.getText(), {
          parser: "liquidsoap",
          plugins: [prettierPluginLiquidsoap],
        });
        return [vscode.TextEdit.replace(fullRange, formatted)];
      } catch (error) {
        channel.appendLine(`Error while formatting ${document.uri}: ${error}`);
        return [];
      }
    },
  });
