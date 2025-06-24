import * as vscode from 'vscode';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';

/**
 * Enregistre la commande pour supprimer un chemin d'un contexte existant.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerRemovePathFromContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbaRoot.removePathFromContext', async (contextItem: any) => { // TODO: Importer le bon type pour ContextItem
    if (!contextItem) {
      vscode.window.showWarningMessage('JabbarRoot: Select a context from the sidebar to remove a path from it.');
      return;
    }

    // Vérifier s'il y a des chemins à supprimer
    if (contextItem.context.files_scope.length === 0) {
      vscode.window.showInformationMessage(`The context "${contextItem.context.name}" doesn't contain any paths.`);
      return;
    }

    // Afficher une liste déroulante des chemins à supprimer
    const selectedPath = await vscode.window.showQuickPick(
      contextItem.context.files_scope,
      {
        placeHolder: 'Select a path to remove from the context',
        canPickMany: false
      }
    );

    if (!selectedPath) {
      return; // L'utilisateur a annulé la sélection
    }

    try {
      // Mettre à jour le contexte en retirant le chemin sélectionné
      const updatedPaths = contextItem.context.files_scope.filter((path: string) => path !== selectedPath);
      
      await contextService.updateContext(contextItem.context.id, {
        files_scope: updatedPaths
      });
      
      // Rafraîchir la vue
      contextTreeProvider.refresh();
      
      vscode.window.showInformationMessage(`Removed "${selectedPath}" from context "${contextItem.context.name}"`);
    } catch (error) {
      console.error('Error removing path from context:', error);
      vscode.window.showErrorMessage(
        `Failed to remove path from context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
