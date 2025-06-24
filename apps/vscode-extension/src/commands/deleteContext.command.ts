import * as vscode from 'vscode';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';

/**
 * Enregistre la commande pour supprimer un contexte existant.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerDeleteContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbaRoot.deleteContext', async (contextItem: any) => { // TODO: Importer le bon type pour ContextItem
    if (!contextItem) {
      vscode.window.showWarningMessage('JabbarRoot: Select a context to delete from the sidebar.');
      return;
    }

    const confirmation = await vscode.window.showWarningMessage(
      `JabbarRoot: Are you sure you want to delete the context "${contextItem.context.name}"?`,
      { modal: true },
      'Delete'
    );

    if (confirmation === 'Delete') {
      try {
        await contextService.deleteContext(contextItem.context.id);
        contextTreeProvider.refresh(); // Rafraîchir la vue après suppression
        vscode.window.showInformationMessage(`JabbarRoot: Context "${contextItem.context.name}" deleted.`);
      } catch (error) {
        console.error('Error deleting context:', error);
        vscode.window.showErrorMessage(
          `Failed to delete context: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  });
}
