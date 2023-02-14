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

    this.refreshStatusBar();

    const showMoreInformationCommand = vscode.commands.registerCommand(
      "learn-keyboard-shortcuts.showMoreInformation",
      () => this.showMoreInformation()
    );

    const selectShortcut = vscode.commands.registerCommand(
      "learn-keyboard-shortcuts.selectShortcut",
      () => this.selectShortcut()
    );

    // When the index changes update the displayed shortcut and save to global state
    this.shortCutIndexEvent.event((index: number) => {
      this.currentIndex = index;
      this.currentShortcut = this.getCurrentShortcut();
      this.refreshStatusBar();
      context.globalState.update(CURRENT_INDEX_KEY, this.currentIndex);
    });

    this._disposable.push(showMoreInformationCommand);
    this._disposable.push(this.statusBarItem);
    this._disposable.push(this.shortCutIndexEvent);
    this._disposable.push(selectShortcut);
  }

  private async showMoreInformation() {
    const result = await vscode.window.showInformationMessage(
      `${this.currentShortcut.keys}: ${this.currentShortcut.text}`,
      "Choose Shortcut",
      "Previous",
      "Next"
    );

    if (result === "Choose Shortcut") {
      this.selectShortcut();
    }

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
    statusBarItem.command = "learn-keyboard-shortcuts.showMoreInformation";
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
    let updatedIndex = this.currentIndex;
    if (this.currentIndex + 1 < this.allShortcuts.length) {
      updatedIndex++;
    } else {
      updatedIndex = 0;
    }

    this.shortCutIndexEvent.fire(updatedIndex);
  }

  private setPreviousShortcut() {
    let updatedIndex = this.currentIndex;
    if (this.currentIndex - 1 >= 0) {
      updatedIndex--;
    } else {
      updatedIndex = this.allShortcuts.length - 1;
    }

    this.shortCutIndexEvent.fire(updatedIndex);
  }

  private async selectShortcut() {
    const shortcuts = this.getAllShortcuts();
    const shortcutKeys = shortcuts.map((shortcut) => shortcut.keys);

    const shortCutCategoryMap: Record<string, IShortCut[]> = {};
    shortcuts.forEach((shortcut) => {
      if (!shortCutCategoryMap[shortcut.category]) {
        shortCutCategoryMap[shortcut.category] = [];
      }
      shortCutCategoryMap[shortcut.category].push(shortcut);
    });

    const quickPickItems: vscode.QuickPickItem[] = [];
    Object.keys(shortCutCategoryMap).forEach((category) => {
      const shortcuts = shortCutCategoryMap[category];

      // Push category first
      quickPickItems.push({
        label: category,
        kind: vscode.QuickPickItemKind.Separator,
      });

      // Then push all shortcuts for that category
      quickPickItems.push(
        ...shortcuts.map((entry) => {
          return {
            label: entry.keys,
            description: entry.text,
            picked: entry.keys === this.currentShortcut.keys,
          } as vscode.QuickPickItem;
        })
      );
    });

    const selectedShortcut = await vscode.window.showQuickPick(quickPickItems);

    if (selectedShortcut) {
      const index = shortcutKeys.indexOf(selectedShortcut.label);
      this.currentIndex = index;
      this.shortCutIndexEvent.fire(this.currentIndex);
    }
  }

  private getAllShortcuts(): IShortCut[] {
    return shortcuts;
  }

  dispose() {
    this._disposable.forEach((disposable) => disposable.dispose());
  }
}
