import * as vscode from 'vscode';
import { ServiceRegistry } from './di/service.registry';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection, IService } from './interfaces';
// Importations de tous les services existants...
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager
} from '@jabbarroot/core';
import { AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, GenericWorkflowEngine, PromptTemplateService } from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { loadServices } from '../bootstrap/service.loader';
import { IgnoreService } from '../services/ignore.service';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

// Extension du type vscode.ExtensionContext pour implémenter IService
declare module 'vscode' {
    interface ExtensionContext extends IService {}
}


export class ExtensionBootstrapper {

    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: ServiceRegistry; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        
        // 1. Initialiser le registre de services
        const container = new ServiceRegistry();
        
        // 2. Enregistrer le contexte d'extension
        container.register('extensionContext', context);

        // 3. Instancier tous les services
        // --- Adapters
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const storageAdapter = new FileSystemStorageAdapter(fileSystemAdapter, projectRootPath, '.jabbarroot_data/storage_v2');
        // --- Core Services
        const projectService = new ProjectService(storageAdapter);
        container.register('projectService', projectService);
        const brickService = new BrickService(storageAdapter);
        container.register('brickService', brickService);
        const compactionService = new CompactionService();
        container.register('compactionService', compactionService);
        const fileContentService = new FileContentService(fileSystemAdapter, compactionService);
        container.register('fileContentService', fileContentService);
        const structureGenerationService = new StructureGenerationService(fileSystemAdapter);
        container.register('structureGenerationService', structureGenerationService);
        const brickConstructorService = new BrickConstructorService(structureGenerationService, fileContentService, compactionService);
        container.register('brickConstructorService', brickConstructorService);
        const statisticsService = new StatisticsService(fileContentService, compactionService, brickConstructorService, fileSystemAdapter);
        container.register('statisticsService', statisticsService);
        const systemBrickManager = new SystemBrickManager(brickService, projectService, fileSystemAdapter);
        container.register('systemBrickManager', systemBrickManager);
        // --- Extension-specific Services
        const ignoreService = new IgnoreService(fileSystemAdapter);
        container.register('ignoreService', ignoreService);
        // --- Prompt-Factory Services
        const analyzerService = new AnalyzerService(fileSystemAdapter, projectService, brickService, statisticsService);
        container.register('analyzerService', analyzerService);
        const documentationService = new DocumentationService(analyzerService, systemBrickManager, fileContentService, fileSystemAdapter);
        container.register('documentationService', documentationService);
        const unitTestGeneratorService = new UnitTestGeneratorService(brickService, fileContentService, fileSystemAdapter);
        container.register('unitTestGeneratorService', unitTestGeneratorService);
        const artefactService = new ArtefactService(projectService, brickService);
        container.register('artefactService', artefactService);
        const promptTemplateService = new PromptTemplateService(fileSystemAdapter);
        container.register('promptTemplateService', promptTemplateService);
        const genericWorkflowEngine = new GenericWorkflowEngine(fileSystemAdapter, systemBrickManager, artefactService, fileContentService, promptTemplateService);
        container.register('genericWorkflowEngine', genericWorkflowEngine);

        // --- Vues et Providers
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);
        container.register('treeDataProvider', projectTreeProvider);

        // Création de la vue avec gestion de la sélection
        const treeView = vscode.window.createTreeView('jabbarroot.contextView', { 
            treeDataProvider: projectTreeProvider, 
            showCollapseAll: true 
        });

        // Mise à jour du contexte à chaque changement de sélection
        context.subscriptions.push(
            treeView.onDidChangeSelection(e => {
                const selection = e.selection[0];
                if (selection instanceof BrickTreeItem) {
                    vscode.commands.executeCommand('setContext', 'jabbarroot:selectedBrickIsActive', selection.brick.isActiveForProjectCompilation);
                } else {
                    // Si on ne sélectionne pas une brique, on désactive le contexte
                    vscode.commands.executeCommand('setContext', 'jabbarroot:selectedBrickIsActive', undefined);
                }
            })
        );

        // 4. Charger les services supplémentaires via le loader
        const serviceCollection: ServiceCollection = {
            extensionContext: context as unknown as IService,
            projectService: projectService as unknown as IService,
            brickService: brickService as unknown as IService,
            compactionService: compactionService as unknown as IService,
            fileContentService: fileContentService as unknown as IService,
            structureGenerationService: structureGenerationService as unknown as IService,
            brickConstructorService: brickConstructorService as unknown as IService,
            statisticsService: statisticsService as unknown as IService,
            systemBrickManager: systemBrickManager as unknown as IService,
            ignoreService: ignoreService as unknown as IService,
            analyzerService: analyzerService as unknown as IService,
            documentationService: documentationService as unknown as IService,
            unitTestGeneratorService: unitTestGeneratorService as unknown as IService,
            artefactService: artefactService as unknown as IService,
            promptTemplateService: promptTemplateService as unknown as IService,
            genericWorkflowEngine: genericWorkflowEngine as unknown as IService,
            treeDataProvider: projectTreeProvider as unknown as IService
        } as ServiceCollection;
        
        loadServices(container, serviceCollection);

        // 5. Exécuter la logique pré-existante (ex: ensureSystemBricksExist)
        const allProjects = await projectService.getAllProjects();
        for (const project of allProjects) {
            await systemBrickManager.ensureSystemBricksExist(project);
        }

        // 6. Initialiser le registre de modules et découvrir les commandes
        // La découverte se fera à partir de `dist/commands`
        const moduleRegistry = new ModuleRegistry(context, container);
        moduleRegistry.discoverAndRegisterCommands(); // Activation du système de découverte des commandes

        // 5. Retourner le conteneur et la fonction de nettoyage
        return {
            container, // On expose le registre de services
            dispose: () => {
                console.log('[Bootstrapper] Disposing extension resources...');
                moduleRegistry.dispose();
                container.dispose();
            }
        };
    }
}