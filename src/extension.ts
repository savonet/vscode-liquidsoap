import * as path from "node:path";
import * as vscode from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { registerFormatter } from "./formatting";

let client: LanguageClient | undefined;

// The analysis module needs the WebAssembly features of Node 22; an older
// extension host runs the server with the node it can find instead.
const runsServer = () => Number(process.versions.node.split(".")[0]) >= 22;

const serverOptions = (module: string, env: NodeJS.ProcessEnv): ServerOptions =>
  runsServer()
    ? { module, transport: TransportKind.ipc, options: { env } }
    : {
        command: "node",
        args: [module, "--stdio"],
        transport: TransportKind.stdio,
        options: { env },
      };

const start = async (
  context: vscode.ExtensionContext,
  channel: vscode.LogOutputChannel,
) => {
  const settings = vscode.workspace.getConfiguration("liquidsoap");
  const module = context.asAbsolutePath(
    path.join(
      "dist",
      "server",
      "node_modules",
      "liquidsoap-language-server",
      "dist",
      "server.js",
    ),
  );
  const liquidsoap = settings.get<string>("path");
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "liquidsoap" }],
    outputChannel: channel,
  };
  client = new LanguageClient(
    "liquidsoap",
    "Liquidsoap",
    serverOptions(module, { ...process.env, ...(liquidsoap ? { LIQUIDSOAP: liquidsoap } : {}) }),
    clientOptions,
  );
  await client.start();
  context.subscriptions.push(client);
};

export async function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("Liquidsoap", { log: true });
  context.subscriptions.push(channel);
  if (!vscode.workspace.getConfiguration("liquidsoap").get<boolean>("languageServer.enabled")) {
    context.subscriptions.push(registerFormatter(channel));
    return;
  }
  try {
    await start(context, channel);
  } catch (error) {
    client = undefined;
    channel.appendLine(`Could not start the language server: ${error}`);
    vscode.window.showWarningMessage(
      "The Liquidsoap language server could not start; formatting is still available. See the Liquidsoap output for details.",
    );
    context.subscriptions.push(registerFormatter(channel));
  }
}

export async function deactivate() {
  await client?.stop();
}
