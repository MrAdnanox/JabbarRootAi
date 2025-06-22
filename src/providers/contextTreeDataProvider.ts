// src/providers/contextTreeDataProvider.ts (version corrigée)

import * as vscode from 'vscode';
import { ContextService } from '../services/contextService';
import { StatisticsService } from '../services/statistics/statistics.service';
import { ContextItem, StatItem, ContextTreeItem } from './context.tree-item-factory';
import { ConfigurationService } from '../services/configuration.service';

export class ContextTreeDataProvider implements vscode.TreeDataProvider<ContextTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private contextService: ContextService,
    private statisticsService: StatisticsService,
    private configurationService: ConfigurationService
  ) {
    this.contextService.onDidChange(() => this.refresh());
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('jabbaRoot')) {
            this.refresh();
        }
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContextTreeItem): Promise<ContextTreeItem[]> {
    // CORRECTION : Rétablissement de la structure if / else if
    
    if (!element) {
      // --- NIVEAU RACINE ---
      const contexts = this.contextService.getContexts();
      const itemPromises = contexts.map(async (context) => {
        const stats = await this.statisticsService.calculateStats(context);
        const item = new ContextItem(context, stats);

        if (!this.configurationService.isStatisticsViewEnabled()) {
          item.collapsibleState = vscode.TreeItemCollapsibleState.None;
          item.description = `${context.files_scope.length} fichier(s)`;
        }
        return item;
      }); // Parenthèse fermante du map()
      return Promise.all(itemPromises);
    }
    
    if (element instanceof ContextItem) {
      // --- NIVEAU ENFANT ---
      const stats = element.stats;
      const statItems: StatItem[] = [];

      if (this.configurationService.shouldShowStat('showSize')) {
        statItems.push(new StatItem('Taille', `${stats.originalChars} ➔ ${stats.compressedChars} chars`, 'symbol-ruler'));
      }
      if (this.configurationService.shouldShowStat('showTokens')) {
        statItems.push(new StatItem('Jetons (est.)', `${stats.originalTokensApprox} ➔ ${stats.compressedTokensApprox} tokens`, 'symbol-key'));
      }
      if (this.configurationService.shouldShowStat('showReduction')) {
        statItems.push(new StatItem('Réduction', `${stats.reductionPercent}% (${stats.savedTokensApprox} tokens économisés)`, 'flame'));
      }
      if (this.configurationService.shouldShowStat('showMotivation')) {
        statItems.push(new StatItem('Efficacité', stats.motivation, 'rocket'));
      }
      return statItems;
    }

    return []; // Cas par défaut : pas d'enfants
  }
}