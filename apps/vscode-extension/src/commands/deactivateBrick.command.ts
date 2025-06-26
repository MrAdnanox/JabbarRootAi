// apps/vscode-extension/src/commands/deactivateBrick.command.ts
import * as vscode from 'vscode';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

export function registerDeactivateBrickCommand(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.deactivateBrick', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showWarningMessage('Veuillez sélectionner une brique active pour la désactiver.');
            return;
        }
        const brick = brickItem.brick;

        if (!brick.isActiveForProjectCompilation) { // Déjà inactive
            // vscode.window.showInformationMessage(`La brique "${brick.name}" est déjà inactive.`);
            return;
        }

        try {
            const updatedBrick = await brickService.updateBrick(brick.id, { isActiveForProjectCompilation: false });
            if (updatedBrick) {
                vscode.window.showInformationMessage(`Brique "${brick.name}" désactivée pour la compilation du projet.`);
                await vscode.commands.executeCommand('setContext', 'jabbarroot:selectedBrickIsActive', false);
                treeDataProvider.refresh();
            } else {
                vscode.window.showErrorMessage(`Impossible de désactiver la brique "${brick.name}".`);
            }
        } catch (error) {
            console.error(`Erreur lors de la désactivation de la brique "${brick.name}":`, error);
            vscode.window.showErrorMessage(`Échec de la désactivation: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}