// apps/vscode-extension/src/extension.ts
import * as vscode from 'vscode';
import {
    ProjectService,
    BrickService,
    BrickConstructorService,
    StatisticsService,
    StructureGenerationService,
    FileContentService,
    CompactionService
} from '@jabbarroot/core';

import { VscodeFileSystemAdapter } from './adapters/vscodeFileSystem.adapter';
import { IgnoreService } from './services/ignore.service';
import { FileSystemStorageAdapter } from './adapters/fileSystemStorage.adapter';
import { ProjectTreeDataProvider } from './providers/projectTreeDataProvider';
import { ProjectViewTreeItem, BrickTreeItem } from './providers/projectTreeItem.factory';
import { getProjectRootPath } from './utils/workspace';

// Command imports
import { registerCreateProjectCommand } from './commands/createProject.command';
import { registerCreateBrickCommand } from './commands/createBrick.command';
import { registerRemoveFileFromBrickCommand } from './commands/removeFileFromBrick.command';
import { registerAddPathToBrickCommand } from './commands/addPathToBrick.command';
import { registerActivateBrickCommand } from './commands/activateBrick.command';
import { registerDeactivateBrickCommand } from './commands/deactivateBrick.command';
import { registerCompileBrickCommand } from './commands/compileBrick.command';
import { registerAddSelectionToActiveBrickCommand } from './commands/addSelectionToActiveBrick.command';
import { registerSetAsDefaultTargetBrickCommand } from './commands/setAsDefaultTargetBrick.command';

export async function activate(context: vscode.ExtensionContext) {
    // Vérification du dossier de travail
    const projectRootPath = getProjectRootPath();
    if (!projectRootPath) {
        vscode.window.showWarningMessage('jabbarroot: Veuillez ouvrir un dossier pour activer l\'extension.');
        return;
    }

    try {
        // Initialisation des adapters
        const fsAdapter = new VscodeFileSystemAdapter();
        const mainStorage = new FileSystemStorageAdapter(
            fsAdapter,
            projectRootPath,
            '.jabbarroot_data/storage_v2'
        );

        // Initialisation des services de base
        const projectService = new ProjectService(mainStorage);
        const brickService = new BrickService(mainStorage);
        
        // Initialisation des services de construction
        const structureGenerationService = new StructureGenerationService(fsAdapter);
        const compactionService = new CompactionService();
        const fileContentService = new FileContentService(fsAdapter, compactionService);
        
        const brickConstructorService = new BrickConstructorService(
            structureGenerationService,
            fileContentService,
            compactionService
        );

        const statisticsService = new StatisticsService(
            fileContentService,
            compactionService,
            brickConstructorService
        );

        // Initialisation des services spécifiques à VSCode
        const ignoreService = new IgnoreService(fsAdapter);

        // Initialisation de la vue hiérarchique
        const projectTreeProvider = new ProjectTreeDataProvider(
            projectService,
            brickService,
            context.globalState
        );

        // Création de la vue arborescente
        const treeView = vscode.window.createTreeView('jabbarroot.contextView', {
            treeDataProvider: projectTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);

        // Initialisation du contextKey
        await vscode.commands.executeCommand('setContext', 'jabbarroot:selectedBrickIsActive', false);

        // Listener pour mettre à jour le contextKey lors du changement de sélection
        treeView.onDidChangeSelection(async (e: vscode.TreeViewSelectionChangeEvent<ProjectViewTreeItem>) => {
            let brickIsActive = false;
            if (e.selection && e.selection.length > 0) {
                const selectedItem = e.selection[0];
                if (selectedItem instanceof BrickTreeItem) {
                    brickIsActive = selectedItem.brick.isActiveForProjectCompilation;
                }
            }
            await vscode.commands.executeCommand(
                'setContext',
                'jabbarroot:selectedBrickIsActive',
                brickIsActive
            );
        });

        // Enregistrement des commandes
        const refreshProjectViewCommand = vscode.commands.registerCommand(
            'jabbarroot.refreshProjectView',
            () => projectTreeProvider.refresh()
        );

        const createProjectCommand = registerCreateProjectCommand(projectService, projectTreeProvider);
        const createBrickCommand = registerCreateBrickCommand(
            projectService,
            brickService,
            projectTreeProvider
        );
        
        const removeFileFromBrickCommand = registerRemoveFileFromBrickCommand(
            brickService,
            projectTreeProvider
        );

        const addPathToBrickCommand = registerAddPathToBrickCommand(
            projectService,
            brickService,
            projectTreeProvider,
            ignoreService
        );

        const compileBrickCommand = registerCompileBrickCommand(
            brickConstructorService,
            statisticsService,
            projectService,
            ignoreService,
            projectTreeProvider
        );
        
        const activateBrickCommand = registerActivateBrickCommand(brickService, projectTreeProvider);
        const deactivateBrickCommand = registerDeactivateBrickCommand(brickService, projectTreeProvider);

        const setAsDefaultTargetBrickCommand = registerSetAsDefaultTargetBrickCommand(brickService);
        const addSelectionToActiveBrickCommand = registerAddSelectionToActiveBrickCommand(projectService, brickService, ignoreService);

        // Enregistrement des abonnements
        const subscriptions = [
            refreshProjectViewCommand,
            createProjectCommand,
            createBrickCommand,
            removeFileFromBrickCommand,
            addPathToBrickCommand,
            compileBrickCommand,
            activateBrickCommand,
            deactivateBrickCommand,
            setAsDefaultTargetBrickCommand,
            addSelectionToActiveBrickCommand,
        ];

        // Ajout de tous les abonnements au contexte
        subscriptions.forEach(subscription => {
            context.subscriptions.push(subscription);
        });
        
        // Notification de fin d'initialisation
        vscode.window.showInformationMessage('JabbarRoot: Extension activée avec succès !');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to activate JabbarRoot extension: ${errorMessage}`);
    }
}

/**
 * Fonction appelée lors de la désactivation de l'extension
 */
export function deactivate() {
    // Nettoyage des ressources si nécessaire
}