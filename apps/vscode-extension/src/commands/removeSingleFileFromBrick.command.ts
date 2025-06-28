// apps/vscode-extension/src/commands/removeSingleFileFromBrick.command.ts
import * as vscode from 'vscode';
import { FileTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickService } from '@jabbarroot/core';

export function registerRemoveSingleFileFromBrickCommand(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.removeSingleFileFromBrick', async (fileItem?: FileTreeItem) => {
        if (!fileItem || !(fileItem instanceof FileTreeItem)) {
            vscode.window.showErrorMessage('Commande invalide. Veuillez sélectionner un fichier dans une brique.');
            return;
        }

        const brickId = fileItem.brickId;
        const filePathToRemove = fileItem.label;

        try {
            const brick = await brickService.getBrick(brickId);
            if (!brick) {
                throw new Error(`Brique avec l'ID ${brickId} introuvable.`);
            }

            const newFilesScope = brick.files_scope.filter(path => path !== filePathToRemove);

            await brickService.updateBrick(brickId, { files_scope: newFilesScope });

            treeDataProvider.refresh();

        } catch (error) {
            console.error(`Erreur lors du retrait du fichier ${filePathToRemove}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Échec du retrait du fichier : ${errorMessage}`);
        }
    });
}