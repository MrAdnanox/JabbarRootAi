// apps/vscode-extension/src/commands/createBrick.command.ts
import * as vscode from 'vscode';
import { ProjectService, BrickService, BrickContextOptions, BrickContext, JabbarProject } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory'; // Pour le type de l'argument

export function registerCreateBrickCommand(
    projectService: ProjectService,
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.createBrickInProject', async (projectItem?: ProjectTreeItem) => {
        if (!projectItem || !(projectItem instanceof ProjectTreeItem)) {
            vscode.window.showWarningMessage('Veuillez sélectionner un projet pour y ajouter une brique.');
            // Idéalement, cette commande ne serait appelée que depuis un ProjectTreeItem,
            // donc cet avertissement est une sécurité.
            return;
        }
        const parentProject = projectItem.project;

        const brickName = await vscode.window.showInputBox({
            prompt: `Entrez le nom de la nouvelle brique pour le projet "${parentProject.name}"`,
            validateInput: (value) => (value && value.trim().length > 0 ? null : 'Le nom ne peut pas être vide.'),
        });
        if (!brickName || !brickName.trim()) return;

        // Options par défaut pour une nouvelle brique (héritées ou valeurs de base)
        const defaultBrickOptions: BrickContextOptions = {
            // Pas de compilationCompressionLevel ni compilationIncludeProjectTree ici,
            // car ils hériteront des 'defaultBrick...' du projet si non définis.
            // On pourrait les demander à l'utilisateur si on veut permettre une surcharge immédiate.
            special_sections: {},
            // brickIgnoreFiles: [],
            // brickIgnorePatterns: [],
        };
        const isActive = true; // Par défaut, une nouvelle brique est active pour la compilation du projet

        try {
            const newBrick = await brickService.createBrick(
                parentProject.id,
                brickName.trim(),
                defaultBrickOptions,
                isActive
            );

            // Lier la brique au projet
            await projectService.addBrickIdToProject(parentProject.id, newBrick.id);

            vscode.window.showInformationMessage(`Brique "${newBrick.name}" créée avec succès dans le projet "${parentProject.name}".`);
            treeDataProvider.refresh();
        } catch (error) {
            console.error('Erreur lors de la création de la brique:', error);
            vscode.window.showErrorMessage(`Échec de la création de la brique: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}