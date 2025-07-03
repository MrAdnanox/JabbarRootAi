import * as vscode from 'vscode';
import { DIContainer } from './di.container';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection } from './interfaces';
// Importations de tous les services existants...
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager
} from '@jabbarroot/core';
import { AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, GenericWorkflowEngine, PromptTemplateService } from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { IgnoreService } from '../services/ignore.service';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';


export class ExtensionBootstrapper {

    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: DIContainer; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        
        // 1. Initialiser le conteneur de dépendances
        const container = new DIContainer();
        
        // 2. Enregistrer le contexte d'extension
        container.register('extensionContext', context);

        // 2. Instancier et enregistrer tous les services
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
        vscode.window.createTreeView('jabbarroot.contextView', { treeDataProvider: projectTreeProvider, showCollapseAll: true });

        // 3. (Temporaire) Exécuter la logique pré-existante (ex: ensureSystemBricksExist)
        const allProjects = await projectService.getAllProjects();
        for (const project of allProjects) {
            await systemBrickManager.ensureSystemBricksExist(project);
        }

        // 4. Initialiser le registre de modules et découvrir les commandes
        // La découverte se fera à partir de `dist/commands`
        const moduleRegistry = new ModuleRegistry(context, container);
        moduleRegistry.discoverAndRegisterCommands(); // Activation du système de découverte des commandes

        // 5. Retourner le conteneur et la fonction de nettoyage
        return {
            container, // On expose le conteneur
            dispose: () => {
                console.log('[Bootstrapper] Disposing extension resources...');
                moduleRegistry.dispose();
                container.dispose();
            }
        };
    }
}