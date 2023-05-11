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
  private statusBarItem: vscode.MarkdownString;


  public constructor(private readonly context: vscode.ExtensionContext) {
    this.allShortcuts = this.getAllShortcuts();
    this.currentIndex = this.context.globalState.get(CURRENT_INDEX_KEY, 0);
    this.currentShortcut = this.getCurrentShortcut();
    this.statusBarItem = this.createAndShowStatusBarItem();
  
    this.addStatusBarItem();
  
    const showMoreInformationCommand = vscode.commands.registerCommand(
      "learn-keyboard-shortcuts.showMoreInformation",
      () => this.selectShortcut()
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
    this._disposable.push(selectShortcut);
    this._disposable.push(this.shortCutIndexEvent);
  }  

  private showShortcutInfo(shortcut: IShortCut) {
    const markdownString = new vscode.MarkdownString();
    markdownString.appendMarkdown(`**${shortcut.keys}**: ${shortcut.text}`);
    this.statusBarItem.value = markdownString;
  }
  
  private onDidChangeTextEditorSelection(event: vscode.TextEditorSelectionChangeEvent) {
    const selection = event.selections[0];
    const editor = vscode.window.activeTextEditor;
    const line = editor.document.lineAt(selection.active.line);
  
    // Check if the selection is within a certain range (e.g., one line)
    if (selection.isEmpty && selection.active.character === line.range.end.character) {
      const shortcut = this.getShortcutForAction(line.text.trim());
      if (shortcut) {
        this.showShortcutInfo(shortcut);
        return;
      }
    }
  
    // If there is no relevant shortcut, clear the status bar item
    this.statusBarItem.value = "";
  }

  private addStatusBarItem() {
    vscode.window.onDidChangeTextEditorSelection(this.onDidChangeTextEditorSelection, this, this._disposable);
    vscode.window.onDidChangeActiveTextEditor(() => this.statusBarItem.value = "", this, this._disposable);
    vscode.window.onDidChangeTextEditorVisibleRanges(() => this.statusBarItem.value = "", this, this._disposable);
    this.statusBarItem.show();
  }
  
  private getShortcutForAction(action: string): IShortCut {
    return this.allShortcuts.find((shortcut) => {
      const regex = new RegExp(`\\b${shortcut.keys}\\b`, "i");
      return regex.test(action);
    });
  }
  

  private createAndShowStatusBarItem(): vscode.MarkdownString {
    const markdownString = new vscode.MarkdownString();
    markdownString.isTrusted = true;
    return markdownString;
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
