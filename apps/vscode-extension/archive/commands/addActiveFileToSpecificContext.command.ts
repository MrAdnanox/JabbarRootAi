// apps/vscode-extension/src/commands/addActiveFileToSpecificContext.command.ts
import * as vscode from 'vscode';
import { ContextService, ProgrammableContext } from '@jabbarroot/core';
import { ContextTreeDataProvider } from '../providers/contextTreeDataProvider';
import { getProjectRootPath } from '../utils/workspace';
import { ContextItem } from '../providers/context.tree-item-factory';

/**
 * Enregistre la commande pour ajouter le fichier actif de l'éditeur à un contexte spécifique.
 * Cette commande est destinée à être appelée depuis le menu contextuel d'un ContextItem.
 * @param contextService Le service de gestion des contextes.
 * @param contextTreeProvider Le fournisseur de données de la vue arborescente des contextes.
 * @returns Un objet vscode.Disposable qui peut être ajouté aux subscriptions.
 */
export function registerAddActiveFileToSpecificContextCommand(
    contextService: ContextService,
    contextTreeProvider: ContextTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.addActiveFileToSpecificContext', async (contextItem?: ContextItem) => {
        if (!contextItem || !(contextItem instanceof ContextItem) || !contextItem.context) {
            vscode.window.showWarningMessage('jabbarroot: No valid context selected from the jabbarroot view.');
            console.warn('addActiveFileToSpecificContext: Invalid or missing contextItem argument.', contextItem);
            return;
        }

        const projectRootPath = getProjectRootPath();
        if (!projectRootPath) {
            // Ce cas devrait être rare si la vue est active, mais c'est une bonne garde.
            vscode.window.showErrorMessage('jabbarroot: No workspace folder is open.');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('jabbarroot: No active editor. Please open a file first to add it.');
            return;
        }

        const filePath = activeEditor.document.uri.fsPath;
        const relativePath = vscode.workspace.asRelativePath(filePath, false); // false pour relatif au workspaceFolder

        // Utilisation directe du context object passé dans contextItem
        const targetContext = contextItem.context;

        if (targetContext.files_scope.includes(relativePath)) {
            vscode.window.showInformationMessage(`The file "${relativePath}" is already in the context "${targetContext.name}".`);
            return;
        }

        try {
            const updatedFilesScope = [...targetContext.files_scope, relativePath];
            await contextService.updateContext(targetContext.id, {
                files_scope: updatedFilesScope
            });

            contextTreeProvider.refresh(); // Rafraîchit toute la vue
            vscode.window.showInformationMessage(`Added "${relativePath}" to context "${targetContext.name}".`);
        } catch (error) {
            console.error(`Error adding path to context "${targetContext.name}":`, error);
            vscode.window.showErrorMessage(
                `Failed to add path to context "${targetContext.name}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    });
}
