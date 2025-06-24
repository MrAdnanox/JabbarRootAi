// apps/vscode-extension/src/commands/createContext.command.ts
import * as vscode from 'vscode';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';

/**
 * Enregistre la commande pour créer un nouveau contexte.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerCreateContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
    const contextName = await vscode.window.showInputBox({
      prompt: 'Enter the name for the new context',
      validateInput: (value) => {
        return value && value.trim().length > 0 ? null : 'Name cannot be empty.';
      },
    });

    if (contextName) {
      try {
        await contextService.createContext(contextName.trim());
        contextTreeProvider.refresh(); // Rafraîchir la vue après création
        vscode.window.showInformationMessage(`Context "${contextName.trim()}" created successfully.`);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create context: ${error.message}`);
      }
    }
  });
}