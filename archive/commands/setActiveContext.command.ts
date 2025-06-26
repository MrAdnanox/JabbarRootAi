import * as vscode from 'vscode';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';
import { ACTIVE_CONTEXT_ID_KEY } from '../constants';

/**
 * Enregistre la commande pour définir un contexte comme actif.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @param globalState L'état global de l'extension pour stocker le contexte actif.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerSetActiveContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider,
  globalState: vscode.Memento
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.setActiveContext', async (contextItem: any) => { // TODO: Importer le bon type pour ContextItem
    if (!contextItem) {
      vscode.window.showWarningMessage('jabbarroot: Select a context from the sidebar to set it as active.');
      return;
    }

    try {
      // Vérifier si le contexte est déjà actif
      const currentActiveContextId = globalState.get<string>(ACTIVE_CONTEXT_ID_KEY);
      if (currentActiveContextId === contextItem.context.id) {
        vscode.window.showInformationMessage(`Context "${contextItem.context.name}" is already active.`);
        return;
      }

      // Demander confirmation à l'utilisateur
      const confirm = await vscode.window.showInformationMessage(
        `Set "${contextItem.context.name}" as the active context?`,
        { modal: true },
        'Set as Active'
      );

      if (confirm === 'Set as Active') {
        // Mettre à jour le contexte actif dans l'état global
        await globalState.update(ACTIVE_CONTEXT_ID_KEY, contextItem.context.id);
        
        // Rafraîchir la vue pour mettre à jour l'affichage
        contextTreeProvider.refresh();
        
        vscode.window.showInformationMessage(`"${contextItem.context.name}" is now the active context.`);
      }
    } catch (error) {
      console.error('Error setting active context:', error);
      vscode.window.showErrorMessage(
        `Failed to set active context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
