// packages/vscode-extension/src/adapters/vscodeConfiguration.adapter.ts

import * as vscode from 'vscode';
import { IConfiguration } from '@jabbarroot/core';

/**
 * Implémentation de IConfiguration utilisant l'API de VSCode.
 */
export class VscodeConfigurationAdapter implements IConfiguration {
  private get config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('jabbarroot');
  }

  public getBool(key: string, defaultValue: boolean): boolean {
    return this.config.get<boolean>(key, defaultValue);
  }
}