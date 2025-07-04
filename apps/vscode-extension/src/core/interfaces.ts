import * as vscode from 'vscode';

// --- Importations des types de service concrets ---
import {
    ProjectService, BrickService, BrickConstructorService, StatisticsService, StructureGenerationService,
    FileContentService, CompactionService, SystemBrickManager
} from '@jabbarroot/core';
import {
    AnalyzerService, DocumentationService, UnitTestGeneratorService, ArtefactService,
    GenericWorkflowEngine, PromptTemplateService
} from '@jabbarroot/prompt-factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { IgnoreService } from '../services/ignore.service';
import { DialogService } from '../services/ui/dialog.service';
import { GeminiConfigService } from '../services/config/gemini.config.service';
import { NotificationService } from '../services/ui/notification.service';

/**
 * Interface marqueur pour les services gérés par le ServiceRegistry.
 * La méthode dispose est optionnelle et sera appelée dynamiquement si elle existe.
 */
export interface IService {}


/**
 * Contrat pour tout module de commande découvrable par le ModuleRegistry.
 */
export interface ICommandModule extends IService {
  readonly metadata: {
    readonly id: string;
    readonly title: string;
    readonly category: 'jabbarroot';
  };
  readonly dependencies: ReadonlyArray<keyof ServiceCollection>; 
  execute(dependencies: Map<keyof ServiceCollection, IService>, ...args: any[]): Promise<void>; 
}

/**
 * Collection de tous les services de l'application, avec leurs types concrets.
 * C'est le manifeste central pour l'injection de dépendances.
 */
export interface ServiceCollection {
    // --- Core Services ---
    projectService: ProjectService;
    brickService: BrickService;
    brickConstructorService: BrickConstructorService;
    statisticsService: StatisticsService;
    structureGenerationService: StructureGenerationService;
    fileContentService: FileContentService;
    compactionService: CompactionService;
    systemBrickManager: SystemBrickManager;
    // --- UI Services ---
    notificationService: NotificationService;
    dialogService: DialogService;
    // --- Config Services ---
    geminiConfigService: GeminiConfigService;
    // --- Extension-specific Services ---
    ignoreService: IgnoreService;
    treeDataProvider: ProjectTreeDataProvider;
    // --- Prompt-Factory Services ---
    analyzerService: AnalyzerService;
    documentationService: DocumentationService;
    unitTestGeneratorService: UnitTestGeneratorService;
    artefactService: ArtefactService;
    genericWorkflowEngine: GenericWorkflowEngine;
    promptTemplateService: PromptTemplateService;
    // --- Extension Context ---
    extensionContext: vscode.ExtensionContext;
}