import * as shortcuts from "./utils/shortcuts.json";
import * as vscode from "vscode";

interface IShortCut {
  readonly keys: string;
  readonly text: string;
  readonly category: string;
}

export class KeyboardHelperExtension implements vscode.Disposable {
  private currentIndex = 0;
  private allShortcuts: IShortCut[] = [];
  private _disposable: vscode.Disposable[] = [];

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.allShortcuts = this.getAllShortcuts();

    const current = this.getCurrentShortcut();
    const statusBarItem = this.createAndShowStatusBarItem(current);
    this._disposable.push(statusBarItem);
  }

  private createAndShowStatusBarItem(
    shortCut: IShortCut
  ): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    // statusBarItem.command = "devprod.research.launchResearch";
    statusBarItem.text = shortCut.keys;
    statusBarItem.tooltip = shortCut.text;
    statusBarItem.show();
    return statusBarItem;
  }

  private getCurrentShortcut(): IShortCut {
    return this.allShortcuts[this.currentIndex];
  }

  private getAllShortcuts(): IShortCut[] {
    return shortcuts;
  }

  dispose() {
    this._disposable.forEach((disposable) => disposable.dispose());
  }
}
