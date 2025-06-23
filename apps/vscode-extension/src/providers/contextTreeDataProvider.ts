// packages/vscode-extension/src/providers/contextTreeDataProvider.ts

import * as vscode from 'vscode';
import { ContextItem, ContextTreeItem } from './context.tree-item-factory';
// NOTE: Tous les anciens imports de service sont supprimés.

/**
 * Version TEMPORAIRE du TreeDataProvider pour faire passer le build.
 * La logique de récupération des contextes et des statistiques est désactivée.
 */
export class ContextTreeDataProvider implements vscode.TreeDataProvider<ContextTreeItem> {
  
  private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  // Le constructeur est simplifié pour l'instant
  constructor() {
    // vscode.workspace.onDidChangeConfiguration(e => {
    //   if (e.affectsConfiguration('jabbaRoot')) {
    //     this.refresh();
    //   }
    // });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextTreeItem): vscode.TreeItem {
    return element;
  }

  // Renvoie une liste vide pour l'instant pour éviter les erreurs.
  async getChildren(element?: ContextTreeItem): Promise<ContextTreeItem[]> {
    if (!element) {
        // Renvoie un item "bidon" pour montrer que ça marche
        const dummyItem = new vscode.TreeItem("Contextes (migration en cours...)");
        dummyItem.iconPath = new vscode.ThemeIcon('wrench');
        return [dummyItem as ContextTreeItem];
    }
    return [];
  }
}