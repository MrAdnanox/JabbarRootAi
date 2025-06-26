// apps/vscode-extension/src/commands/createProject.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProjectOptions, JabbarProject } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider'; // Pour rafraîchir
import { getProjectRootPath } from '../utils/workspace'; // Pour proposer un chemin par défaut

export function registerCreateProjectCommand(
    projectService: ProjectService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.createProject', async () => {
        const currentWorkspacePath = getProjectRootPath();

        const name = await vscode.window.showInputBox({
            prompt: 'Entrez le nom du nouveau projet jabbarroot',
            validateInput: (value) => (value && value.trim().length > 0 ? null : 'Le nom ne peut pas être vide.'),
        });
        if (!name || !name.trim()) return;

        const rootPathUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: 'Sélectionnez le dossier racine du projet',
            openLabel: 'Sélectionner comme racine du projet',
            defaultUri: currentWorkspacePath ? vscode.Uri.file(currentWorkspacePath) : undefined,
        });
        if (!rootPathUri || rootPathUri.length === 0) return;
        const projectRootPath = rootPathUri[0].fsPath;

        // Options par défaut pour un nouveau projet (pourraient être demandées à l'utilisateur plus tard)
        const defaultProjectOptions: JabbarProjectOptions = {
            compilationCompressionLevel: 'standard',
            compilationIncludeProjectTree: true,
            defaultBrickCompressionLevel: 'standard',
            defaultBrickIncludeProjectTree: false, // Les briques n'incluent pas l'arbre par défaut
            // projectIgnoreFiles: [], // Initialement vide
            // projectIgnorePatterns: [], // Initialement vide
        };

        try {
            const newProject = await projectService.createProject(name.trim(), projectRootPath, defaultProjectOptions);
            vscode.window.showInformationMessage(`Projet jabbarroot "${newProject.name}" créé avec succès.`);
            treeDataProvider.refresh();
        } catch (error) {
            console.error('Erreur lors de la création du projet:', error);
            vscode.window.showErrorMessage(`Échec de la création du projet: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}