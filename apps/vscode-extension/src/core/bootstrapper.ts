// apps/vscode-extension/src/core/bootstrapper.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ServiceRegistry } from './di/service.registry';
import { ModuleRegistry } from './module.registry';
import { ServiceCollection, IService } from './interfaces';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, IgnoreService,
    // NOUVEAUX IMPORTS DE @jabbarroot/core
    MCPClient, MCPServerRegistry, MCPResponseCache, MCPConnectionPool, MCPAuthService
} from '@jabbarroot/core';
import { 
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService, 
    GenericWorkflowEngine, PromptTemplateService,
    // NOUVEAUX IMPORTS DE @jabbarroot/prompt-factory
    MCPOrchestrator, KnowledgeGraphService
} from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { FileSystemStorageAdapter } from '../adapters/fileSystemStorage.adapter';
import { VscodeSecureStorageAdapter } from '../adapters/vscodeSecureStorage.adapter'; // NOUVEL IMPORT
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { NotificationService } from '../services/ui/notification.service';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import neo4j from 'neo4j-driver'; // NOUVEL IMPORT

declare module 'vscode' {
    interface ExtensionContext extends IService {}
}

export class ExtensionBootstrapper {
    public static async activate(context: vscode.ExtensionContext, projectRootPath: string): Promise<{ container: ServiceRegistry; dispose: () => void }> {
        console.log('[Bootstrapper] Starting activation sequence...');
        const container = new ServiceRegistry();
        container.register('extensionContext', context);

        // --- Services de base et adaptateurs ---
        const fileSystemAdapter = new VscodeFileSystemAdapter();
        const storageAdapter = new FileSystemStorageAdapter(fileSystemAdapter, projectRootPath, '.jabbarroot_data/storage_v2');
        const secureStorageAdapter = new VscodeSecureStorageAdapter(context.secrets); // NOUVEAU
        const notificationService = new NotificationService();
        const dialogService = new DialogService(new ProjectService(storageAdapter));
        const geminiConfigService = new GeminiConfigService();

        // --- Services de @jabbarroot/core ---
        const projectService = new ProjectService(storageAdapter);
        const brickService = new BrickService(storageAdapter);
        // ... (autres services core existants)

        // =================== NOUVELLE SECTION : INITIALISATION DU SOCLE MCP ===================
        const mcpRegistry = new MCPServerRegistry();
        const mcpCache = new MCPResponseCache();
        const mcpPool = new MCPConnectionPool();
        const mcpAuthService = new MCPAuthService(secureStorageAdapter);
        const mcpClient = new MCPClient(mcpRegistry, mcpCache, mcpPool, mcpAuthService);

        // Configuration d'un serveur de test (à externaliser dans un fichier de config plus tard)
        // NOTE : Pour que cela fonctionne, l'Opérateur doit stocker une clé API.
        // Exemple : ouvrir la palette de commandes et exécuter "Secrets: Set Secret",
        // utiliser "MOCK_API_KEY" comme clé et une valeur factice.
        await secureStorageAdapter.setSecret('MOCK_API_KEY', 'your-actual-api-key-here');
        mcpRegistry.registerServer({
            id: 'mock-server-1',
            name: 'Mock Documentation Server',
            endpoint: 'http://localhost:3000', // Assurez-vous qu'un serveur mock tourne ici
            auth: { strategy: 'api-key', secretKeyName: 'MOCK_API_KEY' },
            capabilities: ['documentation:search', 'documentation:fetch'],
            priority: 100,
            tags: ['mock', 'testing']
        });
        // ======================================================================================

        // =================== NOUVELLE SECTION : INITIALISATION DE PROMPT-FACTORY ===================
        // Connexion à Neo4j (utilisez les variables d'environnement ou la config VSCode)
        const neo4jUri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
        const neo4jUser = process.env.NEO4J_USER || 'neo4j';
        const neo4jPassword = process.env.NEO4J_PASSWORD || 'DevPassTemp';
        const neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
        
        const knowledgeGraphService = new KnowledgeGraphService(neo4jDriver);
        const mcpOrchestrator = new MCPOrchestrator(mcpClient, mcpRegistry, knowledgeGraphService);
        // =========================================================================================

        // --- Enregistrement de tous les services dans le conteneur ---
        const services: Partial<ServiceCollection> = {
            // ... services existants
            projectService,
            brickService,
            notificationService,
            dialogService,
            geminiConfigService,
            // NOUVEAUX SERVICES
            secureStorage: secureStorageAdapter,
            mcpOrchestrator: mcpOrchestrator,
        };
        Object.entries(services).forEach(([key, service]) => {
            if (service) {
                container.register(key as keyof ServiceCollection, service);
            }
        });

        // --- Démarrage des composants UI et des modules ---
        const projectTreeProvider = new ProjectTreeDataProvider(projectService, brickService, context.globalState);
        const treeView = vscode.window.createTreeView('jabbarroot.contextView', { treeDataProvider: projectTreeProvider });
        context.subscriptions.push(treeView);

        const moduleRegistry = new ModuleRegistry(context, container);
        moduleRegistry.discoverAndRegisterCommands(); 

        return {
            container, 
            dispose: async () => {
                console.log('[Bootstrapper] Disposing extension resources...');
                await neo4jDriver.close(); // Fermer la connexion Neo4j
                moduleRegistry.dispose();
                container.dispose();
            }
        };
    }
}