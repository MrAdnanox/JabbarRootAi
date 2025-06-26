/*
// src/providers/context.tree-item-factory.ts

import * as vscode from 'vscode';
import { ProgrammableContext } from '@jabbarroot/core';
import { ContextStats } from '@jabbarroot/core';

// Création de types pour les items afin de les différencier.
export type ContextTreeItem = ContextItem | StatItem;

export class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly context: ProgrammableContext,
    public readonly stats: ContextStats,
    public readonly isActive: boolean
  ) {
    super(context.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.label = isActive ? `${context.name}` : context.name;
    this.description = isActive ? `(active) ${stats.compressedTokensApprox} tokens` : `${stats.compressedTokensApprox} tokens | -${stats.reductionPercent}%`;
    this.tooltip = new vscode.MarkdownString(
      `**${context.name}**\n\n` +
      `- Fichiers: ${context.files_scope.length}\n` +
      `- Créé le: ${new Date(context.metadata.createdAt).toLocaleDateString()}\n\n` +
      `*Cliquez pour voir les statistiques détaillées.*`
    );
    this.iconPath = isActive ? new vscode.ThemeIcon('zap') : new vscode.ThemeIcon('symbol-object');
    this.contextValue = 'jabbarrootContext';
  }
}

export class StatItem extends vscode.TreeItem {
  constructor(label: string, description: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.contextValue = 'jabbarrootContextStat'; // Valeur distincte pour les enfants
  }
}
   */