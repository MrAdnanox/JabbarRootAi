// apps/vscode-extension/src/commands/removeFileFromBrick.command.ts
import * as vscode from 'vscode';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

interface FileSelectionItem extends vscode.QuickPickItem {
    filePath: string;
}

export function registerRemoveFileFromBrickCommand(
    brickService: BrickService,
    treeDataProvider: ProjectTreeDataProvider
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.removeFileFromBrick', async (brickItem?: BrickTreeItem) => {
        // Vérifier si un élément de brique valide est sélectionné
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showErrorMessage('Veuillez sélectionner une brique pour en retirer des fichiers.');
            return;
        }

        const brick = brickItem.brick;

        // Vérifier s'il y a des fichiers dans la brique
        if (!brick.files_scope || brick.files_scope.length === 0) {
            vscode.window.showInformationMessage(`La brique "${brick.name}" ne contient aucun fichier à retirer.`);
            return;
        }

        // Créer une instance de QuickPick
        const quickPick = vscode.window.createQuickPick<FileSelectionItem>();
        quickPick.title = `Retirer des fichiers de la brique: ${brick.name}`;
        quickPick.placeholder = 'Choisissez les fichiers à retirer ou utilisez les boutons';
        quickPick.canSelectMany = true; // Note: canPickMany n'existe pas, utiliser canSelectMany

        // Définir les items
        const items = brick.files_scope.map(filePath => ({
            label: filePath,
            filePath: filePath,
            picked: true // Tous les items sont cochés par défaut
        }));
        quickPick.items = items;
        quickPick.selectedItems = items; // Assure que la sélection visuelle correspond

        // Définir les boutons personnalisés
        const selectAllButton: vscode.QuickInputButton = {
            iconPath: new vscode.ThemeIcon('checklist'),
            tooltip: 'Tout sélectionner'
        };
        const deselectAllButton: vscode.QuickInputButton = {
            iconPath: new vscode.ThemeIcon('clear-all'),
            tooltip: 'Tout désélectionner'
        };
        quickPick.buttons = [selectAllButton, deselectAllButton];

        // Gérer les clics sur les boutons
        quickPick.onDidTriggerButton(button => {
            if (button === selectAllButton) {
                quickPick.selectedItems = [...quickPick.items];
            } else if (button === deselectAllButton) {
                quickPick.selectedItems = [];
            }
        });

        // Gérer l'acceptation (quand l'utilisateur appuie sur Entrée)
        quickPick.onDidAccept(async () => {
            const selectedItems = quickPick.selectedItems;
            quickPick.hide(); // Fermer la vue

            if (selectedItems.length === brick.files_scope.length) {
                // L'utilisateur n'a rien retiré, on ne fait rien
                return;
            }
            
            const pathsToKeep = new Set(selectedItems.map(item => item.filePath));
            const newFilesScope = brick.files_scope.filter(path => pathsToKeep.has(path));

            try {
                await brickService.updateBrick(brick.id, { files_scope: newFilesScope });
                const removedCount = brick.files_scope.length - newFilesScope.length;
                vscode.window.showInformationMessage(
                    `${removedCount} fichier(s) retiré(s) de la brique "${brick.name}".`
                );
                treeDataProvider.refresh();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
                vscode.window.showErrorMessage(`Échec du retrait de fichiers: ${errorMessage}`);
            } finally {
                quickPick.dispose(); // Nettoyer les ressources
            }
        });

        // Gérer la fermeture (quand l'utilisateur appuie sur Echap)
        quickPick.onDidHide(() => quickPick.dispose());

        quickPick.show();
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
