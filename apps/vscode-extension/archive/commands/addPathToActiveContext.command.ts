import * as vscode from 'vscode';
import * as path from 'path';
import { ContextService } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';
import { ACTIVE_CONTEXT_ID_KEY } from '../constants';

/**
 * Enregistre la commande pour ajouter le chemin du fichier actif au contexte actif.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @param globalState L'état global de l'extension pour récupérer le contexte actif.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerAddPathToActiveContextCommand(
  contextService: ContextService,
  contextTreeProvider: ContextTreeDataProvider,
  globalState: vscode.Memento
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.addPathToActiveContext', async () => {
    // Vérifier si un éditeur est actif
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('jabbarroot: No active editor.');
      return;
    }

    // Vérifier si un dossier de travail est ouvert
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('jabbarroot: No workspace folder is open.');
      return;
    }

    // Vérifier s'il y a un contexte actif
    const activeContextId = globalState.get<string>(ACTIVE_CONTEXT_ID_KEY);
    if (!activeContextId) {
      vscode.window.showWarningMessage('jabbarroot: No active context. Please set an active context first.');
      return;
    }

    try {
      // Obtenir le contexte actif
      const contexts = await contextService.getAllContexts();
      const activeContext = contexts.find(ctx => ctx.id === activeContextId);
      
      if (!activeContext) {
        vscode.window.showErrorMessage('jabbarroot: Active context not found.');
        return;
      }

      // Obtenir le chemin relatif du fichier par rapport au dossier de travail
      const filePath = activeEditor.document.uri.fsPath;
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const relativePath = path.relative(workspaceRoot, filePath);

      // Vérifier si le chemin est déjà dans le contexte
      if (activeContext.files_scope.includes(relativePath)) {
        vscode.window.showInformationMessage(`"${relativePath}" is already in the active context "${activeContext.name}".`);
        return;
      }

      // Ajouter le chemin au contexte
      const updatedFilesScope = [...activeContext.files_scope, relativePath];
      
      await contextService.updateContext(activeContextId, {
        files_scope: updatedFilesScope
      });
      
      // Rafraîchir la vue
      contextTreeProvider.refresh();
      
      vscode.window.showInformationMessage(`Added "${relativePath}" to active context "${activeContext.name}"`);
    } catch (error) {
      console.error('Error adding path to active context:', error);
      vscode.window.showErrorMessage(
        `Failed to add path to active context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
