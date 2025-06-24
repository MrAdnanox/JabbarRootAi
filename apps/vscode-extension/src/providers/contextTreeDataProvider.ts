// apps/vscode-extension/src/providers/contextTreeDataProvider.ts
import * as vscode from 'vscode';
import { ContextItem, ContextTreeItem, StatItem } from './context.tree-item-factory';
import { ContextService, ProgrammableContext, StatisticsService } from '@jabbarroot/core';
import { getProjectRootPath } from '../utils/workspace';
import { IgnoreService } from '../services/ignore.service';
import { ACTIVE_CONTEXT_ID_KEY } from '../constants';

/**
 * Fournisseur de données pour la vue arborescente des contextes JabbarRoot.
 * S'appuie sur le ContextService pour récupérer les données et les statistiques.
 */
export class ContextTreeDataProvider implements vscode.TreeDataProvider<ContextTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private readonly contextService: ContextService,
    private readonly statisticsService: StatisticsService,
    private readonly ignoreService: IgnoreService,
    private readonly extensionState: vscode.Memento    
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContextTreeItem): Promise<ContextTreeItem[]> {
    const projectRootPath = getProjectRootPath();
    if (!projectRootPath) {
      const infoItem = new vscode.TreeItem('Ouvrez un dossier pour gérer les contextes.');
      infoItem.iconPath = new vscode.ThemeIcon('info');
      return [infoItem as ContextTreeItem];
    }

    if (element) {
      if (element instanceof ContextItem) {
        return [
          new StatItem('Chars (Original)', element.stats.originalChars.toLocaleString(), 'symbol-string'),
          new StatItem('Chars (Final)', element.stats.compressedChars.toLocaleString(), 'symbol-key'),
          new StatItem('Tokens (Approx)', `~${element.stats.compressedTokensApprox.toLocaleString()}`, 'chip'),
          new StatItem('Économie', `${element.stats.savedTokensApprox.toLocaleString()} tokens (${element.stats.reductionPercent}%)`, 'flame'),
        ];
      }
      return [];
    } else {
      const contexts = await this.contextService.getAllContexts();
      if (contexts.length === 0) {
        const infoItem = new vscode.TreeItem("Aucun contexte. Créez-en un avec l'icône '+' ci-dessus.");
        infoItem.iconPath = new vscode.ThemeIcon('add');
        return [infoItem as ContextTreeItem];
      }

      const shouldIgnore = await this.ignoreService.createIgnorePredicate(projectRootPath);
      const structureGenOptions = { shouldIgnore, maxDepth: 7 };

      const activeContextId = this.extensionState.get<string>(ACTIVE_CONTEXT_ID_KEY);

      const contextItemsPromises = contexts.map(async (context: ProgrammableContext) => {
        const stats = await this.statisticsService.calculateStats(
          context,
          context.files_scope,
          projectRootPath,
          structureGenOptions
        );
        const isActive = context.id === activeContextId;
        return new ContextItem(context, stats, isActive); // On passe un nouvel argument
      });

      return Promise.all(contextItemsPromises);
    }
  }
}