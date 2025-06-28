// apps/vscode-extension/src/commands/deleteBrick.command.ts
import * as vscode from 'vscode';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickService, ProjectService } from '@jabbarroot/core';

export function registerDeleteBrickCommand(
    brickService: BrickService,
    projectService: ProjectService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.deleteBrick', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showErrorMessage('Veuillez lancer cette commande depuis la vue JabbarRoot sur une brique.');
            return;
        }

        const brick = brickItem.brick;

        // 1. Demander confirmation (action destructive)
        const confirmation = await vscode.window.showWarningMessage(
            `Êtes-vous sûr de vouloir supprimer définitivement la brique "${brick.name}" ?`,
            { modal: true }, // 'modal: true' bloque l'UI en attendant la réponse, c'est important.
            'Supprimer' // Le bouton de confirmation
        );

        if (confirmation !== 'Supprimer') {
            // L'utilisateur a annulé
            return;
        }

        try {
            // 2. Orchestrer la suppression (transaction logique)
            // Étape a : Supprimer la brique elle-même
            await brickService.deleteBrick(brick.id);
            
            // Étape b : Retirer la référence de la brique dans le projet parent
            await projectService.removeBrickIdFromProject(brick.projectId, brick.id);

            // 3. Fournir un feedback et rafraîchir
            vscode.window.showInformationMessage(`Brique "${brick.name}" supprimée avec succès.`);
            treeDataProvider.refresh();

        } catch (error) {
            console.error(`Erreur lors de la suppression de la brique ${brick.id}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Échec de la suppression de la brique : ${errorMessage}`);
        }
    });
}