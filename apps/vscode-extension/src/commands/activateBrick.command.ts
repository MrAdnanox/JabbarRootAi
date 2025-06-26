// apps/vscode-extension/src/commands/activateBrick.command.ts
import * as vscode from 'vscode';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

export function registerActivateBrickCommand(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.activateBrick', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            // Normalement, cette commande ne devrait être visible/appelable que si une brique est sélectionnée
            // et qu'elle est inactive, donc ce cas est une sécurité supplémentaire.
            vscode.window.showWarningMessage('Veuillez sélectionner une brique inactive pour l\'activer.');
            return;
        }
        const brick = brickItem.brick;

        if (brick.isActiveForProjectCompilation) { // Déjà active
            // vscode.window.showInformationMessage(`La brique "${brick.name}" est déjà active.`);
            return;
        }

        try {
            const updatedBrick = await brickService.updateBrick(brick.id, { isActiveForProjectCompilation: true });
            if (updatedBrick) {
                vscode.window.showInformationMessage(`Brique "${brick.name}" activée pour la compilation du projet.`);
                await vscode.commands.executeCommand('setContext', 'jabbarroot:selectedBrickIsActive', true);
                treeDataProvider.refresh();
            } else {
                vscode.window.showErrorMessage(`Impossible d'activer la brique "${brick.name}".`);
            }
        } catch (error) {
            console.error(`Erreur lors de l'activation de la brique "${brick.name}":`, error);
            vscode.window.showErrorMessage(`Échec de l'activation: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}