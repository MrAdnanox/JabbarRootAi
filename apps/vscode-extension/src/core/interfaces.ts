// Contenu final pour: apps/vscode-extension/src/core/interfaces.ts
import * as vscode from 'vscode';
import { IFileSystem, IStorage, ISecureStorage } from '@jabbarroot/types';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, IgnoreService, ConcurrencyService, LanguageRegistryService
} from '@jabbarroot/core';
import {
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService,
    GenericWorkflowEngine, PromptTemplateService, OrdoAbChaosOrchestrator, MCPOrchestrator
} from '@jabbarroot/prompt-factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { NotificationService } from '../services/ui/notification.service';

export interface IService {}

export interface ICommandModule extends IService {
  readonly metadata: {
    readonly id: string;
    readonly title: string;
    readonly category: 'jabbarroot';
  };
  readonly dependencies: ReadonlyArray<keyof ServiceCollection>; 
  execute(dependencies: Map<keyof ServiceCollection, IService>, ...args: any[]): Promise<void>; 
}

export interface ServiceCollection {
    // --- Services de base et adaptateurs ---
    fileSystem: IFileSystem;
    storage: IStorage;
    extensionContext: vscode.ExtensionContext;
    
    // --- Services Core ---
    projectService: ProjectService;
    brickService: BrickService;
    brickConstructorService: BrickConstructorService;
    statisticsService: StatisticsService;
    structureGenerationService: StructureGenerationService;
    fileContentService: FileContentService;
    compactionService: CompactionService;
    systemBrickManager: SystemBrickManager;
    ignoreService: IgnoreService;
    concurrencyService: ConcurrencyService;
    languageRegistryService: LanguageRegistryService; // <-- LIGNE AJOUTÉE

    // --- Services UI ---
    notificationService: NotificationService;
    dialogService: DialogService;
    
    // --- Services MCP ---
    secureStorage: ISecureStorage;
    mcpOrchestrator: MCPOrchestrator;
    geminiConfigService: GeminiConfigService;
    treeDataProvider: ProjectTreeDataProvider;

    // --- Services Prompt-Factory ---
    analyzerService: AnalyzerService;
    documentationService: DocumentationService;
    unitTestGeneratorService: UnitTestGeneratorService;
    artefactService: ArtefactService;
    genericWorkflowEngine: GenericWorkflowEngine;
    promptTemplateService: PromptTemplateService;
    ordoAbChaosOrchestrator: OrdoAbChaosOrchestrator;
}