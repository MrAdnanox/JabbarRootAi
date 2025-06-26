// apps/vscode-extension/src/commands/removeFileFromBrick.command.ts
import * as vscode from 'vscode';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

interface FileSelectionItem extends vscode.QuickPickItem {
    filePath: string;
}

/**
 * Enregistre la commande pour retirer des fichiers d'une brique
 * @param brickService - Service de gestion des briques
 * @param treeDataProvider - Fournisseur de données pour l'arborescence
 * @returns Un disposable pour libérer les ressources
 */
export function registerRemoveFileFromBrickCommand(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.removeFileFromBrick', async (brickItem?: BrickTreeItem) => {
        try {
            validateBrickItem(brickItem);
            
            const brick = brickItem!.brick;
            validateBrickFiles(brick.files_scope, brick.name);

            const selectedItems = await promptFileSelection(brick.files_scope, brick.name);
            if (!selectedItems?.length) return;

            await processFileRemoval(
                brickService,
                treeDataProvider,
                brick,
                selectedItems
            );
        } catch (error) {
            handleError(error);
        }
    });
}

/**
 * Valide que l'élément de brique est valide
 */
function validateBrickItem(brickItem: BrickTreeItem | undefined): asserts brickItem is BrickTreeItem {
    if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
        throw new Error('Veuillez sélectionner une brique pour en retirer des fichiers.');
    }
}

/**
 * Valide que la brique contient des fichiers
 */
function validateBrickFiles(files: string[] | undefined, brickName: string): void {
    if (!files || files.length === 0) {
        throw new Error(`La brique "${brickName}" ne contient aucun fichier à retirer.`);
    }
}

/**
 * Affiche la sélection de fichiers et retourne les éléments sélectionnés
 */
async function promptFileSelection(
    files: string[],
    brickName: string
): Promise<FileSelectionItem[] | undefined> {
    const filesToChooseFrom = files.map(filePath => ({
        label: filePath,
        description: '',
        filePath
    }));

    return vscode.window.showQuickPick(filesToChooseFrom, {
        canPickMany: true,
        placeHolder: `Sélectionnez les fichiers à retirer de la brique "${brickName}"`,
        title: `Retirer des fichiers de la brique: ${brickName}`
    });
}

/**
 * Traite la suppression des fichiers de la brique
 */
async function processFileRemoval(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider,
    brick: { id: string; name: string; files_scope: string[] },
    selectedItems: FileSelectionItem[]
): Promise<void> {
    const pathsToRemove = selectedItems.map(item => item.filePath);
    const newFilesScope = brick.files_scope.filter(path => !pathsToRemove.includes(path));

    const updatedBrick = await brickService.updateBrick(brick.id, { 
        files_scope: newFilesScope 
    });

    if (!updatedBrick) {
        throw new Error(`Impossible de mettre à jour la brique "${brick.name}".`);
    }

    vscode.window.showInformationMessage(
        `${pathsToRemove.length} fichier(s) retiré(s) de la brique "${brick.name}".`
    );
    treeDataProvider.refresh();
}

/**
 * Gère les erreurs et affiche les messages appropriés
 */
function handleError(error: unknown): void {
    console.error('Erreur lors du retrait de fichiers de la brique:', error);
    
    const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur inconnue est survenue';
        
    vscode.window.showErrorMessage(`Échec du retrait de fichiers: ${errorMessage}`);
}
