// src/providers/contextTreeDataProvider.ts
import * as vscode from 'vscode';
import { IContextService } from '../services/contextService';
import { ProgrammableContext } from '../models/programmableContext';
import * as path from 'path';

export class ContextTreeItem extends vscode.TreeItem {
    constructor(
        public readonly context: ProgrammableContext,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(context.name, collapsibleState);
        this.tooltip = `ID: ${context.id}\nCréé le: ${new Date(context.metadata.createdAt).toLocaleString()}`;
        this.description = `${context.files_scope.length} fichier(s)`;
        this.id = context.id;
        this.contextValue = 'jabbaRootContext';

        // CORRECTION: path.join retourne un string. Il faut le convertir en vscode.Uri.
        const iconBasePath = path.join(__filename, '..', '..', '..', 'resources');
        this.iconPath = {
            light: vscode.Uri.file(path.join(iconBasePath, 'light', 'JabbarRoot-icon.png')),
            dark: vscode.Uri.file(path.join(iconBasePath, 'dark', 'JabbarRoot-icon.png'))
        };
    }
}

// Le reste de la classe reste inchangé.
export class ContextTreeDataProvider implements vscode.TreeDataProvider<ContextTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private contextService: IContextService) {
        this.contextService.onDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContextTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ContextTreeItem): Thenable<ContextTreeItem[]> {
        if (!element) {
            const contexts = this.contextService.getContexts();
            const sortedContexts = contexts.sort((a, b) => a.name.localeCompare(b.name));
            return Promise.resolve(sortedContexts.map(c => new ContextTreeItem(c)));
        }
        return Promise.resolve([]);
    }
}