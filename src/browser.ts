import * as vscode from "vscode";
import { registerFormatter } from "./formatting";

// The language server needs Node, which the web extension host does not give.
export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("Liquidsoap");
  context.subscriptions.push(channel, registerFormatter(channel));
}
