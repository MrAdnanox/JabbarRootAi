// src/providers/contextTreeDataProvider.ts

import * as vscode from 'vscode';
import { ContextService } from '../services/contextService';
import { StatisticsService } from '../services/statistics/statistics.service';
import { ContextItem, StatItem, ContextTreeItem } from './context.tree-item-factory';

export class ContextTreeDataProvider implements vscode.TreeDataProvider<ContextTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private contextService: ContextService,
    private statisticsService: StatisticsService
  ) {
    this.contextService.onDidChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContextTreeItem): Promise<ContextTreeItem[]> {
    if (!element) {
      // Niveau racine : charger les contextes et calculer les stats
      const contexts = this.contextService.getContexts();
      const itemPromises = contexts.map(async (context) => {
        const stats = await this.statisticsService.calculateStats(context);
        return new ContextItem(context, stats);
      });
      return Promise.all(itemPromises);
    }

    if (element instanceof ContextItem) {
      // Niveau enfant : afficher les stats détaillées du parent
      const stats = element.stats;
      return [
        new StatItem('Taille', `${stats.originalChars} ➔ ${stats.compressedChars} chars`, 'symbol-ruler'),
        new StatItem('Jetons (est.)', `${stats.originalTokensApprox} ➔ ${stats.compressedTokensApprox} tokens`, 'symbol-key'),
        new StatItem('Réduction', `${stats.reductionPercent}% (${stats.savedTokensApprox} tokens économisés)`, 'flame'),
        new StatItem('Efficacité', stats.motivation, 'rocket'),
      ];
    }

    return [];
  }
}