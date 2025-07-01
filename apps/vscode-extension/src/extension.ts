// apps/vscode-extension/src/extension.ts
import * as vscode from 'vscode';
import { ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService, FileContentService, CompactionService } from '@jabbarroot/core';

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
import { registerRemoveSingleFileFromBrickCommand } from './commands/removeSingleFileFromBrick.command';
import { registerAddPathToBrickCommand } from './commands/addPathToBrick.command';
import { registerActivateBrickCommand } from './commands/activateBrick.command';
import { registerDeactivateBrickCommand } from './commands/deactivateBrick.command';
import { registerCompileBrickCommand } from './commands/compileBrick.command';
import { registerAddSelectionToActiveBrickCommand } from './commands/addSelectionToActiveBrick.command';
import { registerSetAsDefaultTargetBrickCommand } from './commands/setAsDefaultTargetBrick.command';
import { registerEditBrickOptionsCommand } from './commands/editBrickOptions.command';
import { registerDeleteBrickCommand } from './commands/deleteBrick.command';
import { registerDeleteProjectCommand } from './commands/deleteProject.command';
import { registerEditProjectOptionsCommand } from './commands/editProjectOptions.command';
import { registerCompileProjectCommand } from './commands/compileProject.command';
import { registerGenerateReadmeCommand } from './commands/doc/generateReadme.command';
import { registerGenerateTestsCommand } from './commands/test/generateTests.command';
import { registerStructureAnalyzerCommand } from './commands/brick/structureAnalyzer.command';
// Import des services depuis le Cœur Cognitif
import { 
  AnalyzerService,
  DocumentationService,
  UnitTestGeneratorService 
} from '@jabbarroot/prompt-factory';


// Fonction utilitaire de log
const log = (message: string, data?: any) => {
  console.log(`JabbLog [Extension]: ${message}`, data || '');
};

export async function activate(context: vscode.ExtensionContext) {
  log('Début de l\'activation de l\'extension');
  
  // Vérification du dossier de travail
  log('Vérification du dossier de travail...');
  const projectRootPath = getProjectRootPath();
  if (!projectRootPath) {
      const msg = 'Aucun dossier de travail détecté. Veuillez ouvrir un dossier pour activer l\'extension.';
      log('Erreur: ' + msg);
      vscode.window.showWarningMessage('jabbarroot: ' + msg);
      return;
    }

    try {
    log('Initialisation des services...');
        // Initialisation des adapters
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const storageAdapter = new FileSystemStorageAdapter(
            fileSystemAdapter,
            projectRootPath,
            '.jabbarroot_data/storage_v2'
        );

        // Initialisation des services de base
        const projectService = new ProjectService(storageAdapter);
        const brickService = new BrickService(storageAdapter);
        
        // Initialisation des services de construction
        const structureGenerationService = new StructureGenerationService(fileSystemAdapter);
        const compactionService = new CompactionService();
        const fileContentService = new FileContentService(fileSystemAdapter, compactionService);
        
        const brickConstructorService = new BrickConstructorService(structureGenerationService, fileContentService, compactionService);

        const statisticsService = new StatisticsService(fileContentService, compactionService, brickConstructorService);

        // Initialisation des services spécifiques à VSCode
        const ignoreService = new IgnoreService(fileSystemAdapter);
        
        // Initialisation des services du Cœur Cognitif
        const documentationService = new DocumentationService(
          brickService,
          fileContentService,
          fileSystemAdapter // Injection de l'adaptateur VSCode
        );
        
        // Initialisation du service de génération de tests unitaires
        const unitTestGeneratorService = new UnitTestGeneratorService(
          brickService, 
          fileContentService,
          fileSystemAdapter // Injection de l'adaptateur VSCode
        );
        
        // Initialisation de l'analyseur de structure
        const analyzerService = new AnalyzerService(
          fileSystemAdapter,
          projectService,
          brickService
        );

        // Initialisation de la vue hiérarchique
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);

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
        const createBrickCommand = registerCreateBrickCommand(projectService, brickService, projectTreeProvider);
        
        const removeFileFromBrickCommand = registerRemoveFileFromBrickCommand(brickService, projectTreeProvider);

        const removeSingleFileFromBrickCommand = registerRemoveSingleFileFromBrickCommand(brickService, projectTreeProvider);

        const addPathToBrickCommand = registerAddPathToBrickCommand(projectService, brickService, projectTreeProvider, ignoreService);

        const deleteProjectCommand = registerDeleteProjectCommand(projectService, brickService, projectTreeProvider);

        const editProjectOptionsCommand = registerEditProjectOptionsCommand(context, projectService);

        const compileProjectCommand = registerCompileProjectCommand(projectService, brickService, statisticsService, ignoreService);
        
        // Enregistrement de la commande d'analyse de structure
        const structureAnalyzerCommand = registerStructureAnalyzerCommand(
          analyzerService,
          structureGenerationService,
          ignoreService,
          projectService // Injection du service de projet
        );

        const compileBrickCommand = registerCompileBrickCommand(brickConstructorService, statisticsService, projectService, ignoreService, projectTreeProvider);
        
        const activateBrickCommand = registerActivateBrickCommand(brickService, projectTreeProvider);
        const deactivateBrickCommand = registerDeactivateBrickCommand(brickService, projectTreeProvider);

        const setAsDefaultTargetBrickCommand = registerSetAsDefaultTargetBrickCommand(brickService);
        const addSelectionToActiveBrickCommand = registerAddSelectionToActiveBrickCommand(projectService, brickService, ignoreService);
        const editBrickOptionsCommand = registerEditBrickOptionsCommand(context, projectService, brickService);
        const deleteBrickCommand = registerDeleteBrickCommand(brickService, projectService, projectTreeProvider);
        
        log('Enregistrement de la commande generateReadme...');
        let generateReadmeCommand: vscode.Disposable;
        try {
            generateReadmeCommand = registerGenerateReadmeCommand(projectService, documentationService);
            log('Commande generateReadme enregistrée avec succès');
            log('Détails de la commande:', {
                id: 'jabbarroot.doc.generateReadme',
                title: 'JabbarDoc: Générer le README du projet'
            });
        } catch (error) {
            log('ERREUR lors de l\'enregistrement de la commande generateReadme:', error);
            throw error; // Propager l'erreur pour qu'elle soit visible dans la console
        }

        log('Enregistrement de la commande generateTests...');
        let generateTestsCommand: vscode.Disposable;
        try {
            generateTestsCommand = registerGenerateTestsCommand(projectService, unitTestGeneratorService);
            log('Commande generateTests enregistrée avec succès');
            log('Détails de la commande:', {
                id: 'jabbarroot.test.generateTests',
                title: 'JabbarTest: Générer les tests unitaires'
            });
        } catch (error) {
            log('ERREUR lors de l\'enregistrement de la commande generateTests:', error);
            throw error; // Propager l'erreur pour qu'elle soit visible dans la console
        }

        // Enregistrement des abonnements
        log('Enregistrement des abonnements...');
        context.subscriptions.push(
            treeView,
            createProjectCommand,
            createBrickCommand,
            removeFileFromBrickCommand,
            removeSingleFileFromBrickCommand,
            addPathToBrickCommand,
            activateBrickCommand,
            deactivateBrickCommand,
            compileBrickCommand,
            setAsDefaultTargetBrickCommand,
            addSelectionToActiveBrickCommand,
            editBrickOptionsCommand,
            deleteBrickCommand,
            deleteProjectCommand,
            editProjectOptionsCommand,
            compileProjectCommand,
            refreshProjectViewCommand,
            generateReadmeCommand,
            generateTestsCommand,
            structureAnalyzerCommand
        );

        // Ajout de tous les abonnements au contexte
        log('Ajout des abonnements au contexte...');
        context.subscriptions.push(
            vscode.workspace.onDidChangeWorkspaceFolders(() => projectTreeProvider.refresh()),
            vscode.workspace.onDidSaveTextDocument(() => projectTreeProvider.refresh())
        );
        log(`Extension activée avec succès. ${context.subscriptions.length} abonnements enregistrés.`);
        
        // Notification de fin d'initialisation
        const successMsg = 'JabbarRoot: Extension activée avec succès !';
        log(successMsg);
        vscode.window.showInformationMessage(successMsg);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        const errorMsg = `Échec de l'activation de l'extension JabbarRoot: ${errorMessage}`;
        log(`ERREUR: ${errorMsg}`, error);
        vscode.window.showErrorMessage(`JabbLog: ${errorMsg}`);
    }
}

/**
 * Fonction appelée lors de la désactivation de l'extension
 */
export function deactivate() {
    log("Désactivation de l'extension JabbarRoot");
    // Nettoyage des ressources si nécessaire
}