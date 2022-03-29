import * as shortcuts from "./utils/shortcuts.json";
import * as vscode from "vscode";

interface IShortCut {
  readonly keys: string;
  readonly text: string;
  readonly category: string;
}

export class KeyboardHelperExtension implements vscode.Disposable {
  private currentIndex = 0;
  private currentShortcut: IShortCut;
  private allShortcuts: IShortCut[] = [];
  private _disposable: vscode.Disposable[] = [];
  private statusBarItem: vscode.StatusBarItem;

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.allShortcuts = this.getAllShortcuts();

    this.currentShortcut = this.getCurrentShortcut();
    this.statusBarItem = this.createAndShowStatusBarItem(this.currentShortcut);

    const showMoreInformationCommand = vscode.commands.registerCommand(
      "keyboard-shortcuts.showMoreInformation",
      () => this.showMoreInformation()
    );
    this._disposable.push(showMoreInformationCommand);
    this._disposable.push(this.statusBarItem);
  }

  private async showMoreInformation() {
    const result = await vscode.window.showInformationMessage(
      `[${this.currentShortcut.category}]${this.currentShortcut.text}`,
      "Previous",
      "Next"
    );

    if (result === "Previous") {
      this.setPreviousShortcut();
    }

    if (result === "Next") {
      this.setNextShortcut();
    }
  }

  private createAndShowStatusBarItem(
    shortCut: IShortCut
  ): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.command = "keyboard-shortcuts.showMoreInformation";
    statusBarItem.text = shortCut.keys;
    statusBarItem.tooltip = shortCut.text;
    statusBarItem.show();
    return statusBarItem;
  }

  private refreshStatusBar() {
    this.statusBarItem.text = this.currentShortcut.keys;
    this.statusBarItem.tooltip = this.currentShortcut.text;
  }

  private getCurrentShortcut(): IShortCut {
    return this.allShortcuts[this.currentIndex];
  }

  private setNextShortcut() {
    if (this.currentIndex + 1 < this.allShortcuts.length) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.currentShortcut = this.getCurrentShortcut();
    this.refreshStatusBar();
  }

  private setPreviousShortcut() {
    if (this.currentIndex - 1 >= 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.allShortcuts.length - 1;
    }
    this.currentShortcut = this.getCurrentShortcut();
    this.refreshStatusBar();
  }

  private getAllShortcuts(): IShortCut[] {
    return shortcuts;
  }

  dispose() {
    this._disposable.forEach((disposable) => disposable.dispose());
  }
}
