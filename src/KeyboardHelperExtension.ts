import * as shortcuts from "./utils/shortcuts.json";
import * as vscode from "vscode";

const CURRENT_INDEX_KEY = "current_index_key";
interface IShortCut {
  readonly keys: string;
  readonly text: string;
  readonly category: string;
}

export class KeyboardHelperExtension implements vscode.Disposable {
  private shortCutIndexEvent = new vscode.EventEmitter<number>();

  private currentIndex = 0;
  private currentShortcut: IShortCut;
  private allShortcuts: IShortCut[] = [];

  private _disposable: vscode.Disposable[] = [];
  private statusBarItem: vscode.StatusBarItem;

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.allShortcuts = this.getAllShortcuts();
    this.currentIndex = this.context.globalState.get(CURRENT_INDEX_KEY, 0);
    this.currentShortcut = this.getCurrentShortcut();
    this.statusBarItem = this.createAndShowStatusBarItem();

    console.log("currentIndex", this.currentIndex);
    console.log("saved", this.context.globalState.get(CURRENT_INDEX_KEY, 0));

    this.refreshStatusBar();

    const showMoreInformationCommand = vscode.commands.registerCommand(
      "keyboard-shortcuts.showMoreInformation",
      () => this.showMoreInformation()
    );

    // When the index changes update the displayed shortcut and save to global state
    this.shortCutIndexEvent.event(() => {
      console.log("saving", this.currentIndex);
      context.globalState.update(CURRENT_INDEX_KEY, this.currentIndex);
      this.currentShortcut = this.getCurrentShortcut();
      this.refreshStatusBar();
    });

    this._disposable.push(showMoreInformationCommand);
    this._disposable.push(this.statusBarItem);
    this._disposable.push(this.shortCutIndexEvent);
  }

  private async showMoreInformation() {
    const result = await vscode.window.showInformationMessage(
      `[${this.currentShortcut.category}] ${this.currentShortcut.text}`,
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

  private createAndShowStatusBarItem(): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      0
    );
    statusBarItem.command = "keyboard-shortcuts.showMoreInformation";
    statusBarItem.show();
    return statusBarItem;
  }

  private refreshStatusBar() {
    this.statusBarItem.text = this.currentShortcut.keys;
    this.statusBarItem.tooltip = new vscode.MarkdownString(
      `**${this.currentShortcut.keys}**\n\n${this.currentShortcut.text}`
    );
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

    this.shortCutIndexEvent.fire(this.currentIndex);
  }

  private setPreviousShortcut() {
    if (this.currentIndex - 1 >= 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.allShortcuts.length - 1;
    }

    this.shortCutIndexEvent.fire(this.currentIndex);
  }

  private getAllShortcuts(): IShortCut[] {
    return shortcuts;
  }

  dispose() {
    this._disposable.forEach((disposable) => disposable.dispose());
  }
}
