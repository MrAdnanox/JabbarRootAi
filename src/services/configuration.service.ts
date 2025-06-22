// src/services/configuration.service.ts

import * as vscode from 'vscode';

export type StatName = 'showSize' | 'showTokens' | 'showReduction' | 'showMotivation';

export class ConfigurationService {
  private get config() {
    return vscode.workspace.getConfiguration('jabbaRoot');
  }

  public isProjectTreeEnabled(): boolean {
    return this.config.get<boolean>('compilation.includeProjectTree', true);
  }

  public isStatisticsViewEnabled(): boolean {
    return this.config.get<boolean>('view.statistics.enabled', true);
  }

  public shouldShowStat(statName: StatName): boolean {
    // Assure que le master switch est respecté
    if (!this.isStatisticsViewEnabled()) {
        return false;
    }
    return this.config.get<boolean>(`view.statistics.${statName}`, true);
  }
}