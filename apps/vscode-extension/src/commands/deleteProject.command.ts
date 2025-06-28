// apps/vscode-extension/src/commands/deleteProject.command.ts
import * as vscode from 'vscode';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickService, ProjectService } from '@jabbarroot/core';

export function registerDeleteProjectCommand(
    projectService: ProjectService,
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.deleteProject', async (projectItem?: ProjectTreeItem) => {
        if (!projectItem || !(projectItem instanceof ProjectTreeItem)) {
            vscode.window.showErrorMessage('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }

        const project = projectItem.project;

        // 1. Demander une confirmation explicite et sévère
        const confirmation = await vscode.window.showWarningMessage(
            `Supprimer le projet "${project.name}" supprimera aussi ses ${project.brickContextIds.length} brique(s). Cette action est irréversible.`,
            { modal: true },
            'Supprimer Définitivement'
        );

        if (confirmation !== 'Supprimer Définitivement') {
            return; // Annulation par l'utilisateur
        }

        try {
            // 2. Suppression en cascade des briques associées
            // C'est crucial pour ne pas laisser de données orphelines.
            for (const brickId of project.brickContextIds) {
                await brickService.deleteBrick(brickId);
            }

            // 3. Suppression du projet lui-même
            await projectService.deleteProject(project.id);

            // 4. Feedback et rafraîchissement
            vscode.window.showInformationMessage(`Projet "${project.name}" et ses briques ont été supprimés.`);
            treeDataProvider.refresh();

        } catch (error) {
            console.error(`Erreur lors de la suppression du projet ${project.id}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Échec de la suppression du projet : ${errorMessage}`);
        }
    });
}