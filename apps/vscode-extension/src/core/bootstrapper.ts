// Contenu final pour: apps/vscode-extension/src/core/bootstrapper.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ServiceRegistry } from './di/service.registry';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection, IService } from './interfaces';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, ConcurrencyService, LanguageRegistryService, IgnoreService, CacheService
} from '@jabbarroot/core';
import { 
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, 
    GenericWorkflowEngine, PromptTemplateService, OrdoAbChaosOrchestrator 
} from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { NotificationService } from '../services/ui/notification.service';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';

declare module 'vscode' {
    interface ExtensionContext extends IService {}
}

export class ExtensionBootstrapper {
    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: ServiceRegistry; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        const container = new ServiceRegistry();
        container.register('extensionContext', context);

        // --- PHASE 1: Adaptateurs et Services Fondamentaux (sans dépendances internes) ---
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const storageAdapter = new FileSystemStorageAdapter(fileSystemAdapter, projectRootPath, '.jabbarroot_data/storage_v2');
        const compactionService = new CompactionService();
        const notificationService = new NotificationService();
        const geminiConfigService = new GeminiConfigService(); // <-- CORRIGÉ
        const workerScriptPath = context.asAbsolutePath(path.join('dist', 'worker-task.js'));
        const concurrencyService = new ConcurrencyService(workerScriptPath);
        const parsersPath = context.asAbsolutePath(path.join('dist', 'parsers'));

        // --- PHASE 2: Services 'Core' (dépendent des adaptateurs) ---
        const projectService = new ProjectService(storageAdapter);
        const brickService = new BrickService(storageAdapter);
        const fileContentService = new FileContentService(fileSystemAdapter, compactionService);
        const structureGenerationService = new StructureGenerationService(fileSystemAdapter);
        const ignoreService = new IgnoreService(fileSystemAdapter);
        const languageRegistryService = new LanguageRegistryService(fileSystemAdapter, projectRootPath);
        await languageRegistryService.initialize();
        
        const brickConstructorService = new BrickConstructorService(structureGenerationService, fileContentService, compactionService);
        const statisticsService = new StatisticsService(fileContentService, compactionService, brickConstructorService, fileSystemAdapter);
        const systemBrickManager = new SystemBrickManager(brickService, projectService, fileSystemAdapter);

        // --- PHASE 3: Services 'Prompt-Factory' et Orchestrateurs (dépendent des services 'Core') ---
        const analyzerService = new AnalyzerService(fileSystemAdapter, projectService, brickService, statisticsService);
        const documentationService = new DocumentationService(analyzerService, systemBrickManager, fileContentService, fileSystemAdapter);
        const unitTestGeneratorService = new UnitTestGeneratorService(brickService, fileContentService, fileSystemAdapter);
        const artefactService = new ArtefactService(projectService, brickService);
        const promptTemplateService = new PromptTemplateService(fileSystemAdapter);
        const genericWorkflowEngine = new GenericWorkflowEngine(fileSystemAdapter, systemBrickManager, artefactService, fileContentService, promptTemplateService);
        const ordoAbChaosOrchestrator = new OrdoAbChaosOrchestrator(
            projectRootPath, 
            concurrencyService,
            fileContentService,
            parsersPath,
            languageRegistryService 
        );

        // --- PHASE 4: Services UI et Fournisseurs VSCode (dépendent des services précédents) ---
        const dialogService = new DialogService(projectService);
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);

        // --- PHASE 5: Enregistrement dans le conteneur d'injection de dépendances ---
        const services: Partial<ServiceCollection> = {
            extensionContext: context,
            fileSystem: fileSystemAdapter,
            storage: storageAdapter,
            projectService,
            brickService,
            compactionService,
            fileContentService,
            structureGenerationService,
            brickConstructorService,
            statisticsService,
            systemBrickManager,
            ignoreService,
            analyzerService,
            documentationService,
            unitTestGeneratorService,
            artefactService,
            promptTemplateService,
            genericWorkflowEngine,
            treeDataProvider: projectTreeProvider,
            concurrencyService,
            ordoAbChaosOrchestrator,
            notificationService,
            dialogService,
            geminiConfigService,
            languageRegistryService
        };

        Object.entries(services).forEach(([key, service]) => {
            if (service) {
                container.register(key as keyof ServiceCollection, service);
            }
        });
        
        // --- PHASE 6: Activation des modules et de l'UI ---
        const treeView = vscode.window.createTreeView('jabbarroot.contextView', { 
            treeDataProvider: projectTreeProvider, 
            showCollapseAll: true 
        });
        context.subscriptions.push(treeView);

        const allProjects = await projectService.getAllProjects();
        for (const project of allProjects) {
            await systemBrickManager.ensureSystemBricksExist(project);
        }

        const moduleRegistry = new ModuleRegistry(context, container);
        moduleRegistry.discoverAndRegisterCommands(); 
        
        return {
            container, 
            dispose: () => {
                console.log('[Bootstrapper] Disposing extension resources...');
                moduleRegistry.dispose();
                container.dispose();
            }
        };
    }
}