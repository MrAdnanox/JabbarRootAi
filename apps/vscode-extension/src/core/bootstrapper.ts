// apps/vscode-extension/src/core/bootstrapper.ts

import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import { ServiceRegistry } from './di/service.registry';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection, IService } from './interfaces';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, IgnoreService, ConcurrencyService, LanguageRegistryService,
    MCPServerRegistry, ProcessManagerService
} from '@jabbarroot/core';
import { 
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, 
    GenericWorkflowEngine, PromptTemplateService,
    MCPOrchestrator, KnowledgeGraphService, OrdoAbChaosOrchestrator
} from '@jabbarroot/prompt-factory';

// JUSTIFICATION: Imports corrigés pour pointer vers les fichiers spécifiques.
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { VscodeSecureStorageAdapter } from '../adapters/vscodeSecureStorage.adapter';

import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { NotificationService } from '../services/ui/notification.service';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { McpManagerService } from '../services/mcpManager.service';
import neo4j from 'neo4j-driver';

// Permet d'étendre le type ExtensionContext pour l'enregistrement dans le conteneur
declare module 'vscode' {
    interface ExtensionContext extends IService {}
}

export class ExtensionBootstrapper {
    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: ServiceRegistry; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        const container = new ServiceRegistry();
        container.register('extensionContext', context);

        // --- Instanciation des Adaptateurs ---
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const secureStorageAdapter = new VscodeSecureStorageAdapter(context.secrets);
        const storageAdapter = new FileSystemStorageAdapter(fileSystemAdapter, projectRootPath, '.jabbarroot_data/storage_v2');
        
        // --- Instanciation des Services ---
        const notificationService = new NotificationService();
        const projectService = new ProjectService(storageAdapter);
        const dialogService = new DialogService(projectService);
        const geminiConfigService = new GeminiConfigService();
        const brickService = new BrickService(storageAdapter);

        // --- Services MCP et Processus ---
        const mcpManagerService = new McpManagerService(fileSystemAdapter, projectRootPath);
        const processManager = new ProcessManagerService();
        const mcpRegistry = new MCPServerRegistry();

        // JUSTIFICATION: Le bootstrapper charge les définitions de serveurs.
        // L'Orchestrator se chargera de les démarrer au besoin (on-demand).
        const allServers = await mcpManagerService.getAllServers();
        allServers.forEach(serverDef => {
            if (serverDef.state.enabled) {
                mcpRegistry.registerServerDefinition(serverDef);
            }
        });

        // --- Services d'Orchestration et de Connaissance ---
        const neo4jUri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
        const neo4jUser = process.env.NEO4J_USER || 'neo4j';
        const neo4jPassword = process.env.NEO4J_PASSWORD || 'DevPassTemp';
        const neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
        
        const knowledgeGraphService = new KnowledgeGraphService(neo4jDriver);
        const mcpOrchestrator = new MCPOrchestrator(mcpRegistry, processManager, knowledgeGraphService);
        
        // --- Collection de tous les services pour l'injection de dépendances ---
        const services: Partial<ServiceCollection> = {
            projectService,
            brickService,
            notificationService,
            dialogService,
            geminiConfigService,
            secureStorage: secureStorageAdapter,
            mcpManagerService,
            processManager,
            mcpRegistry,
            mcpOrchestrator,
            knowledgeGraphService, // JUSTIFICATION: Service ajouté à la collection.
            // ... Ajoutez ici d'autres services qui seraient créés ...
        };

        Object.entries(services).forEach(([key, service]) => {
            if (service) {
                container.register(key as keyof ServiceCollection, service);
            }
        });

        // --- Initialisation de l'UI et des Commandes ---
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);
        const treeView = vscode.window.createTreeView('jabbarroot.contextView', { treeDataProvider: projectTreeProvider });
        context.subscriptions.push(treeView);

        const moduleRegistry = new ModuleRegistry(context, container);
        moduleRegistry.discoverAndRegisterCommands(); 

        return {
            container, 
            dispose: async () => {
                console.log('[Bootstrapper] Disposing extension resources...');
                processManager.dispose(); // Arrête tous les processus enfants MCP
                await neo4jDriver.close(); // Ferme la connexion à la base de données de graphe
                moduleRegistry.dispose();
                container.dispose();
            }
        };
    }
}