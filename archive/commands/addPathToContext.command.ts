import * as vscode from 'vscode';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';
import { getProjectRootPath } from '../utils/workspace';

/**
 * Enregistre la commande pour ajouter un chemin à un contexte existant.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerAddPathToContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.addPathToContext', async (contextItem: any) => { // TODO: Importer le bon type pour ContextItem
    if (!contextItem) {
      vscode.window.showWarningMessage('jabbarroot: Select a context from the sidebar to add a path to it.');
      return;
    }

    const projectRootPath = getProjectRootPath();
    if (!projectRootPath) {
      vscode.window.showErrorMessage('jabbarroot: No workspace folder is open.');
      return;
    }

    // Obtenir le chemin du fichier actif
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('jabbarroot: No active editor. Please open a file first.');
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;
    const relativePath = vscode.workspace.asRelativePath(filePath, false);

    // Vérifier si le chemin est déjà dans le contexte
    if (contextItem.context.files_scope.includes(relativePath)) {
      vscode.window.showInformationMessage(`The file "${relativePath}" is already in the context.`);
      return;
    }

    try {
      // Mettre à jour le contexte avec le nouveau chemin
      await contextService.updateContext(contextItem.context.id, {
        files_scope: [...contextItem.context.files_scope, relativePath]
      });
      
      // Rafraîchir la vue
      contextTreeProvider.refresh();
      
      vscode.window.showInformationMessage(`Added "${relativePath}" to context "${contextItem.context.name}"`);
    } catch (error) {
      console.error('Error adding path to context:', error);
      vscode.window.showErrorMessage(
        `Failed to add path to context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
