// apps/vscode-extension/src/commands/createProject.command.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectService, JabbarProjectOptions, JabbarProject, SystemBrickManager } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider'; // Pour rafraîchir
import { getProjectRootPath } from '../utils/workspace'; // Pour proposer un chemin par défaut

export function registerCreateProjectCommand(
    projectService: ProjectService,
    treeDataProvider: ProjectTreeDataProvider,
    systemBrickManager: SystemBrickManager,
    context: vscode.ExtensionContext
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
            // 1. Créer le projet
            const newProject = await projectService.createProject(name.trim(), projectRootPath, defaultProjectOptions);
            
            // 2. Créer l'arborescence pour les briques système
            const systemBricksPath = path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'bricks');
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(systemBricksPath));
            
            // 3. Copier le manifeste système
            const manifestPath = path.join(context.extensionPath, '.jabbarroot', '.jabbarroot_data', 'system', 'bricks', 'manifest.json');
            const targetManifestPath = path.join(systemBricksPath, 'manifest.json');
            
            try {
                await vscode.workspace.fs.copy(
                    vscode.Uri.file(manifestPath),
                    vscode.Uri.file(targetManifestPath),
                    { overwrite: true }
                );
            } catch (copyError) {
                console.warn('Impossible de copier le manifeste système, utilisation du fichier par défaut:', copyError);
                // Créer un manifeste par défaut si la copie échoue
                const defaultManifest = {
                    version: "1.0",
                    bricks: []
                };
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(targetManifestPath),
                    Buffer.from(JSON.stringify(defaultManifest, null, 2))
                );
            }
            
            // 4. Initialiser les briques système
            await systemBrickManager.ensureSystemBricksExist(newProject);
            
            vscode.window.showInformationMessage(`Projet jabbarroot "${newProject.name}" créé avec succès.`);
            treeDataProvider.refresh();
        } catch (error) {
            console.error('Erreur lors de la création du projet:', error);
            vscode.window.showErrorMessage(`Échec de la création du projet: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}