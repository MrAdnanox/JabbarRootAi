// apps/vscode-extension/src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService, FileContentService, CompactionService, SystemBrickManager, JabbarProject } from '@jabbarroot/core';

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
  UnitTestGeneratorService,
  GenericWorkflowEngine,
  PromptTemplateService,
  ArtefactService,
  // WorkflowContext est défini localement
} from '@jabbarroot/prompt-factory';
import { AgentDefinition } from '@jabbarroot/prompt-factory/dist/types/agent.types';

// Définition locale de l'interface WorkflowContext
interface WorkflowContext {
    fileSystem: any; // IFileSystem
    systemBrickManager: SystemBrickManager;
    artefactService: ArtefactService;
    fileContentService: FileContentService;
    promptTemplateService: PromptTemplateService;
    projectService: ProjectService;
    brickService: BrickService;
    analyzerService: AnalyzerService;
    documentationService: DocumentationService;
    unitTestGeneratorService: UnitTestGeneratorService;
    structureGenerationService: StructureGenerationService;
    statisticsService: StatisticsService;
    ignoreService: IgnoreService;
    brickConstructorService: BrickConstructorService;
}

// Fonction utilitaire pour récupérer la clé API
export function getApiKey(): string | undefined {
  // On récupère la section de configuration 'jabbarroot'
  const config = vscode.workspace.getConfiguration('jabbarroot');
  // On récupère la valeur de la clé 'gemini.apiKey' DANS cette section.
  return config.get<string>('gemini.apiKey');
}

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
        
        // Initialisation du gestionnaire de briques système
        const systemBrickManager = new SystemBrickManager(
          brickService,
          projectService,
          fileSystemAdapter
        );
        
        // Initialisation des services de construction
        const structureGenerationService = new StructureGenerationService(fileSystemAdapter);
        const compactionService = new CompactionService();
        const fileContentService = new FileContentService(fileSystemAdapter, compactionService);
        
        const brickConstructorService = new BrickConstructorService(structureGenerationService, fileContentService, compactionService);

        const statisticsService = new StatisticsService(fileContentService, compactionService, brickConstructorService, fileSystemAdapter);

        // Initialisation des services spécifiques à VSCode
        const ignoreService = new IgnoreService(fileSystemAdapter);
        
        // Initialisation de l'analyseur de structure
        const analyzerService = new AnalyzerService(
          fileSystemAdapter,
          projectService,
          brickService,
          statisticsService // Injection du service de statistiques
        );
        
        // Initialisation des services du Cœur Cognitif
        // Initialisation des services supplémentaires pour le workflow
        const promptTemplateService = new PromptTemplateService(fileSystemAdapter);
        const artefactService = new ArtefactService(projectService, brickService);

        // Initialisation du moteur de workflow générique
        const genericWorkflowEngine = new GenericWorkflowEngine(
          fileSystemAdapter,
          systemBrickManager,
          artefactService,
          fileContentService,
          promptTemplateService
        );

        const documentationService = new DocumentationService(
          analyzerService,
          systemBrickManager, // Passer le manager
          fileContentService, // Passer le service de contenu
          fileSystemAdapter
        );
        
        // Initialisation du service de génération de tests unitaires
        const unitTestGeneratorService = new UnitTestGeneratorService(
          brickService, 
          fileContentService,
          fileSystemAdapter // Injection de l'adaptateur VSCode
        );

        // Initialisation de la vue hiérarchique
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);

        // Vérification des briques système pour tous les projets au démarrage
        log('Vérification des briques système pour tous les projets existants...');
        try {
            const allProjects = await projectService.getAllProjects();
            if (allProjects.length > 0) {
                for (const project of allProjects) {
                    log(`  -> Vérification du projet : ${project.name}`);
                    await systemBrickManager.ensureSystemBricksExist(project);
                }
                log('Vérification des briques système terminée.');
            } else {
                log('Aucun projet existant à vérifier.');
            }
        } catch (error) {
            const errorMessage = `Erreur lors de la vérification des briques système: ${error instanceof Error ? error.message : String(error)}`;
            log(errorMessage, error);
            vscode.window.showErrorMessage('Erreur lors de la vérification des briques système. Consultez les logs pour plus de détails.');
        }

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

        const createProjectCommand = registerCreateProjectCommand(
            projectService, 
            projectTreeProvider,
            systemBrickManager,
            context
        );
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
          projectService
          // statisticsService est maintenant encapsulé dans analyzerService
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
            generateReadmeCommand = registerGenerateReadmeCommand(
                projectService, 
                documentationService,
                analyzerService // On passe analyzerService à la commande également
            );
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
        
        // Enregistrement du lanceur d'agents cognitifs
        log('Enregistrement du lanceur d\'agents cognitifs...');
        try {
            const runAgentCommand = vscode.commands.registerCommand('jabbarroot.runAgent', async () => {
                const projectRootPath = getProjectRootPath();
                if (!projectRootPath) {
                    vscode.window.showWarningMessage('Veuillez ouvrir un dossier pour exécuter un agent.');
                    return;
                }

                const apiKey = getApiKey();
                if (!apiKey) {
                    vscode.window.showErrorMessage('Clé API Gemini non configurée. Veuillez configurer "jabbarroot.gemini.apiKey" dans vos paramètres VS Code.');
                    return;
                }

                // 1. Charger le manifeste des agents
                let agentDefs: AgentDefinition[];
                try {
                    const manifestPath = path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'agents', 'manifest.json');
                    const manifestContent = await fileSystemAdapter.readFile(manifestPath);
                    agentDefs = (JSON.parse(manifestContent)).agents;
                } catch (e) {
                    vscode.window.showErrorMessage('Impossible de charger le manifeste des agents. Vérifiez le fichier .jabbarroot/.jabbarroot_data/system/agents/manifest.json');
                    return;
                }

                // 2. Afficher le QuickPick pour la sélection de l'agent
                const pickedAgent = await vscode.window.showQuickPick(
                    agentDefs.map(agent => ({
                        label: agent.label,
                        description: agent.description,
                        id: agent.id // On stocke l'ID pour l'exécution
                    })),
                    { title: 'Sélectionnez un Agent Cognitif à exécuter' }
                );

                if (!pickedAgent) return; // L'utilisateur a annulé

                // 3. Sélectionner le projet cible
                const projects = await projectService.getAllProjects();
                if (!projects || projects.length === 0) {
                    vscode.window.showWarningMessage('Aucun projet trouvé. Veuillez d\'abord créer un projet.');
                    return;
                }

                // Définir un type pour les éléments du sélecteur de projet
                interface ProjectItem extends vscode.QuickPickItem {
                    project: JabbarProject;
                }

                const projectItems: ProjectItem[] = projects.map((p) => ({
                    label: p.name,
                    description: p.projectRootPath,
                    project: p
                }));

                const selectedProject = await vscode.window.showQuickPick(projectItems, {
                    title: 'Sélectionnez le projet cible',
                    placeHolder: 'Choisissez un projet pour exécuter l\'agent'
                });

                if (!selectedProject) return; // L'utilisateur a annulé

                // 4. Exécuter l'agent sélectionné avec une barre de progression
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `JabbarRoot: Exécution de "${pickedAgent.label}" sur ${selectedProject.label}...`,
                    cancellable: false
                }, async (progress) => {
                    try {
                        // Initialisation du moteur de workflow générique
                        const workflowContext = {
                            // Services requis par GenericWorkflowEngine
                            fileSystem: fileSystemAdapter,
                            systemBrickManager,
                            artefactService: new ArtefactService(projectService, brickService),
                            fileContentService: new FileContentService(fileSystemAdapter, new CompactionService()),
                            promptTemplateService: new PromptTemplateService(fileSystemAdapter),
                            
                            // Services supplémentaires pour le contexte étendu
                            projectService,
                            brickService,
                            analyzerService,
                            documentationService,
                            unitTestGeneratorService,
                            structureGenerationService: new StructureGenerationService(fileSystemAdapter),
                            statisticsService,
                            ignoreService,
                            brickConstructorService
                        } as WorkflowContext;

                        const genericWorkflowEngine = new GenericWorkflowEngine(
                            workflowContext.fileSystem,
                            workflowContext.systemBrickManager,
                            workflowContext.artefactService,
                            workflowContext.fileContentService,
                            workflowContext.promptTemplateService
                        );

                        await genericWorkflowEngine.executeAgent(pickedAgent.id, selectedProject.project, apiKey);
                        vscode.window.showInformationMessage(`Agent "${pickedAgent.label}" exécuté avec succès sur le projet ${selectedProject.label}.`);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(`Erreur lors de l'exécution de l'agent ${pickedAgent.id}:`, error);
                        vscode.window.showErrorMessage(`Échec de l'exécution de l'agent: ${errorMessage}`);
                    }
                });
            });

            // Enregistrement de la commande
            context.subscriptions.push(runAgentCommand);
            log('Lanceur d\'agents enregistré avec succès.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            log('ERREUR: Impossible d\'enregistrer le lanceur d\'agents.', errorMessage);
            vscode.window.showErrorMessage(`Erreur lors de l'enregistrement du lanceur d'agents: ${errorMessage}`);
        }
        
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