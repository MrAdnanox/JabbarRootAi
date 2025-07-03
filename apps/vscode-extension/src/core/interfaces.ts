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


/**
 * Interface de base pour tous les services gérés par le DIContainer.
 * Le typage structurel de TypeScript permet à toute classe d'être un IService
 * si elle a une méthode optionnelle `dispose`.
 */
export interface IService {
  dispose?(): void;
}

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