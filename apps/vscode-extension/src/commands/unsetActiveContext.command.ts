import * as vscode from 'vscode';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';
import { ACTIVE_CONTEXT_ID_KEY } from '../constants';

/**
 * Enregistre la commande pour désactiver le contexte actif.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @param globalState L'état global de l'extension pour stocker le contexte actif.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerUnsetActiveContextCommand(
  contextTreeProvider: ContextTreeDataProvider,
  globalState: vscode.Memento
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbaRoot.unsetActiveContext', async () => {
    // Vérifier s'il y a un contexte actif
    const currentActiveContextId = globalState.get<string>(ACTIVE_CONTEXT_ID_KEY);
    if (!currentActiveContextId) {
      vscode.window.showInformationMessage('No active context to unset.');
      return;
    }

    try {
      // Demander confirmation à l'utilisateur
      const confirm = await vscode.window.showInformationMessage(
        'Are you sure you want to unset the active context?',
        { modal: true },
        'Unset Active Context'
      );

      if (confirm === 'Unset Active Context') {
        // Supprimer le contexte actif
        await globalState.update(ACTIVE_CONTEXT_ID_KEY, undefined);
        
        // Rafraîchir la vue pour mettre à jour l'affichage
        contextTreeProvider.refresh();
        
        vscode.window.showInformationMessage('Active context has been unset.');
      }
    } catch (error) {
      console.error('Error unsetting active context:', error);
      vscode.window.showErrorMessage(
        `Failed to unset active context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
