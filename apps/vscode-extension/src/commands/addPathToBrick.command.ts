// apps/vscode-extension/src/commands/addPathToBrick.command.ts
import * as vscode from 'vscode';
import { BrickService, ProjectService, BrickContext, JabbarProject } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { IgnoreService } from '../services/ignore.service';

export function registerAddPathToBrickCommand(
    projectService: ProjectService, // Nécessaire pour obtenir le projectRootPath
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider,
    ignoreService: IgnoreService
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.addPathToBrick', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showWarningMessage('Veuillez sélectionner une brique pour y ajouter un chemin.');
            return;
        }
        const brick = brickItem.brick;

        const parentProject = await projectService.getProject(brick.projectId);
        if (!parentProject) {
            vscode.window.showErrorMessage(`Projet parent (ID: ${brick.projectId}) de la brique introuvable.`);
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('Aucun éditeur actif. Veuillez ouvrir un fichier.');
            return;
        }
        const filePathAbsolute = activeEditor.document.uri.fsPath;
        // Chemin relatif au projectRootPath du projet parent de la brique
        const relativePath = vscode.workspace.asRelativePath(filePathAbsolute, false); // false pour relatif au workspaceFolder qui doit être projectRootPath
        
        // Vérification des règles d'ignore
        const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, brick);
        if (ignorePredicate(relativePath)) {
            vscode.window.showInformationMessage(`Chemin "${relativePath}" ignoré par les règles d'exclusion.`);
            return;
        }

        if (brick.files_scope.includes(relativePath)) {
            vscode.window.showInformationMessage(`Chemin "${relativePath}" déjà présent dans la brique "${brick.name}".`);
            return;
        }

        try {
            const updatedFilesScope = [...brick.files_scope, relativePath];
            await brickService.updateBrick(brick.id, { files_scope: updatedFilesScope });

            vscode.window.showInformationMessage(`Chemin "${relativePath}" ajouté à la brique "${brick.name}".`);
            treeDataProvider.refresh(); // Ou juste rafraîchir l'item modifié et ses enfants si possible
        } catch (error) {
            console.error('Erreur lors de l\'ajout du chemin à la brique:', error);
            vscode.window.showErrorMessage(`Échec de l'ajout du chemin: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}