// src/providers/context.tree-item-factory.ts

import * as vscode from 'vscode';
import { ProgrammableContext } from '../models/programmableContext';
import { ContextStats } from '../models/contextStats';

// Création de types pour les items afin de les différencier.
export type ContextTreeItem = ContextItem | StatItem;

export class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly context: ProgrammableContext,
    public readonly stats: ContextStats
  ) {
    super(context.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${stats.compressedTokensApprox} tokens | -${stats.reductionPercent}%`;
    this.tooltip = new vscode.MarkdownString(
      `**${context.name}**\n\n` +
      `- Fichiers: ${context.files_scope.length}\n` +
      `- Créé le: ${new Date(context.metadata.createdAt).toLocaleDateString()}\n\n` +
      `*Cliquez pour voir les statistiques détaillées.*`
    );
    this.iconPath = new vscode.ThemeIcon('symbol-object');
    this.contextValue = 'jabbaRootContext';
  }
}

export class StatItem extends vscode.TreeItem {
  constructor(label: string, description: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.contextValue = 'jabbaRootContextStat'; // Valeur distincte pour les enfants
  }
}