// apps/vscode-extension/src/core/interfaces.ts

import * as vscode from 'vscode';
import { IFileSystem, IStorage, ISecureStorage } from '@jabbarroot/types';
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager, IgnoreService, ConcurrencyService, LanguageRegistryService, 
    // JUSTIFICATION : PortManagerService a été supprimé car inutile dans l'architecture stdio.
    ProcessManagerService, 
    MCPServerRegistry
} from '@jabbarroot/core';
import {
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService,
    GenericWorkflowEngine, PromptTemplateService, OrdoAbChaosOrchestrator, MCPOrchestrator, KnowledgeGraphService
} from '@jabbarroot/prompt-factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { NotificationService } from '../services/ui/notification.service';
import { McpManagerService } from '../services/mcpManager.service';

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
    fileSystem: IFileSystem;
    storage: IStorage;
    extensionContext: vscode.ExtensionContext;
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
    languageRegistryService: LanguageRegistryService; 
    notificationService: NotificationService;
    dialogService: DialogService;
    secureStorage: ISecureStorage;
    mcpOrchestrator: MCPOrchestrator;
    geminiConfigService: GeminiConfigService;
    treeDataProvider: ProjectTreeDataProvider;
    mcpManagerService: McpManagerService;
    // JUSTIFICATION : PortManagerService a été supprimé.
    // portManager: PortManagerService;
    processManager: ProcessManagerService;
    mcpRegistry: MCPServerRegistry;
    analyzerService: AnalyzerService;
    documentationService: DocumentationService;
    unitTestGeneratorService: UnitTestGeneratorService;
    artefactService: ArtefactService;
    genericWorkflowEngine: GenericWorkflowEngine;
    promptTemplateService: PromptTemplateService;
    ordoAbChaosOrchestrator: OrdoAbChaosOrchestrator;
    knowledgeGraphService: KnowledgeGraphService;
}