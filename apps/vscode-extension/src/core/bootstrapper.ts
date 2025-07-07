import * as vscode from 'vscode';
import * as path from 'path';
import { ServiceRegistry } from './di/service.registry';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection, IService } from './interfaces';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, ConcurrencyService
} from '@jabbarroot/core';
import { 
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, 
    GenericWorkflowEngine, PromptTemplateService, OrdoAbChaosOrchestrator 
} from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { loadServices } from '../bootstrap/service.loader';
import { IgnoreService } from '../services/ignore.service';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { NotificationService } from '../services/ui/notification.service';
import { CacheService } from '@jabbarroot/core';

function getCacheFromOrchestrator(orchestrator: any): CacheService | undefined {
    return orchestrator['cacheService'];
}
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { SanctuaryViewProvider } from '../webviews/SanctuaryViewProvider';

declare module 'vscode' {
    interface ExtensionContext extends IService {}
}

export class ExtensionBootstrapper {

    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: ServiceRegistry; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        const container = new ServiceRegistry();
        container.register('extensionContext', context);

        // --- Instanciation de tous les services ---
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const storageAdapter = new FileSystemStorageAdapter(fileSystemAdapter, projectRootPath, '.jabbarroot_data/storage_v2');
        
        const projectService = new ProjectService(storageAdapter);
        const brickService = new BrickService(storageAdapter);
        const compactionService = new CompactionService();
        const fileContentService = new FileContentService(fileSystemAdapter, compactionService);
        const structureGenerationService = new StructureGenerationService(fileSystemAdapter);
        const brickConstructorService = new BrickConstructorService(structureGenerationService, fileContentService, compactionService);
        const statisticsService = new StatisticsService(fileContentService, compactionService, brickConstructorService, fileSystemAdapter);
        const systemBrickManager = new SystemBrickManager(brickService, projectService, fileSystemAdapter);
        const ignoreService = new IgnoreService(fileSystemAdapter);
        const analyzerService = new AnalyzerService(fileSystemAdapter, projectService, brickService, statisticsService);
        const documentationService = new DocumentationService(analyzerService, systemBrickManager, fileContentService, fileSystemAdapter);
        const unitTestGeneratorService = new UnitTestGeneratorService(brickService, fileContentService, fileSystemAdapter);
        const artefactService = new ArtefactService(projectService, brickService);
        const promptTemplateService = new PromptTemplateService(fileSystemAdapter);
        const genericWorkflowEngine = new GenericWorkflowEngine(fileSystemAdapter, systemBrickManager, artefactService, fileContentService, promptTemplateService);
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);
        
        const workerScriptPath = context.asAbsolutePath(path.join('dist', 'worker-task.js'));
        console.log(`[Bootstrapper] Chemin du worker résolu : ${workerScriptPath}`);
        const concurrencyService = new ConcurrencyService(workerScriptPath);
        
        const parsersPath = context.asAbsolutePath(path.join('dist', 'parsers'));
        console.log(`[Bootstrapper] Chemin des parsers résolu : ${parsersPath}`);
        
        const ordoAbChaosOrchestrator = new OrdoAbChaosOrchestrator(
            projectRootPath, 
            concurrencyService,
            fileContentService,
            parsersPath
        );

        // CORRECTION : Instancier les services UI ici aussi
        const notificationService = new NotificationService();
        const dialogService = new DialogService(projectService);
        const geminiConfigService = new GeminiConfigService();

        // --- Création de la collection complète ---
        const services: Record<string, any> = {
            extensionContext: context,
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
            geminiConfigService
            // Le service 'sanctuaryViewProvider' n'est plus enregistré au démarrage.
        };

        // --- Enregistrement de tous les services dans le conteneur ---
        Object.entries(services).forEach(([key, service]) => {
            // Le type 'sanctuaryViewProvider' n'existe plus dans ServiceCollection pour l'instant
            // car il n'est plus un service singleton géré par le conteneur.
            container.register(key as keyof Omit<ServiceCollection, 'sanctuaryViewProvider'>, service);
        });

        // ... (le reste de la fonction, la partie avec treeView, etc.)
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
            treeDataProvider: projectTreeProvider as unknown as IService,
            concurrencyService: concurrencyService as unknown as IService,
            ordoAbChaosOrchestrator: ordoAbChaosOrchestrator as unknown as IService
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