import * as shortcuts from "./utils/shortcuts.json";
import * as vscode from "vscode";

import { KeyboardHelperExtension } from "./KeyboardHelperExtension";

export function activate(context: vscode.ExtensionContext) {
  const extension = new KeyboardHelperExtension(context);
  context.subscriptions.push(extension);
}

// this method is called when your extension is deactivated
export function deactivate() {}
