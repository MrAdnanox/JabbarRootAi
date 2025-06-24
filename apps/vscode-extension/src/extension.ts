// apps/vscode-extension/src/extension.ts
import * as vscode from 'vscode';

// Core services
import {
  CompactionService,
  FileContentService,
  StructureGenerationService,
  ContextConstructorService,
  ContextService,
  StatisticsService,
} from '@jabbarroot/core';

// Adapters
import { FileSystemStorageAdapter } from './adapters/fileSystemStorage.adapter';
import { VscodeFileSystemAdapter } from './adapters/vscodeFileSystem.adapter';

// Services
import { IgnoreService } from './services/ignore.service';

// Providers
import { ContextTreeDataProvider } from './providers/contextTreeDataProvider';

// Utils
import { getProjectRootPath } from './utils/workspace';

// Command imports
import { registerRefreshContextViewCommand } from './commands/refreshContextView.command';
import { registerCreateContextCommand } from './commands/createContext.command';
import { registerGenerateProjectTreeCommand } from './commands/generateProjectTree.command';
import { registerCompileAndCopyContextCommand } from './commands/compileAndCopyContext.command';
import { registerDeleteContextCommand } from './commands/deleteContext.command';
import { registerAddPathToContextCommand } from './commands/addPathToContext.command';
import { registerRemovePathFromContextCommand } from './commands/removePathFromContext.command';
import { registerSetActiveContextCommand } from './commands/setActiveContext.command';
import { registerUnsetActiveContextCommand } from './commands/unsetActiveContext.command';
import { registerAddPathToActiveContextCommand } from './commands/addPathToActiveContext.command';
import { registerAddActiveFileToSpecificContextCommand } from './commands/addActiveFileToSpecificContext.command';

export function activate(context: vscode.ExtensionContext) {
  // =================================================================================
  //  0. PRÉ-REQUIS
  // =================================================================================
  const projectRootPath = getProjectRootPath();
  if (!projectRootPath) {
    vscode.window.showWarningMessage('JabbarRoot: Veuillez ouvrir un dossier pour activer l\'extension.');
    return;
  }

  // =================================================================================
  //  1. PHASE D'INITIALISATION DES SERVICES & PROVIDERS
  // =================================================================================
  // --- Couche 1 : Adapters d'Abstraction du Host (VSCode) ---
  const fsAdapter = new VscodeFileSystemAdapter();
  const storageAdapter = new FileSystemStorageAdapter(fsAdapter, projectRootPath, 'contexts');
  // const configAdapter = new VscodeConfigurationAdapter(); // Pour plus tard
  const ignoreService = new IgnoreService(fsAdapter);

  // --- Couche 2 : Services du Core (Cerveau Agnostique) ---
  const compactionService = new CompactionService();
  const fileContentService = new FileContentService(fsAdapter);
  const structureGenerationService = new StructureGenerationService(fsAdapter);
  const contextConstructorService = new ContextConstructorService(
    structureGenerationService,
    fileContentService,
    compactionService
  );
  const contextService = new ContextService(storageAdapter);
  const statisticsService = new StatisticsService(contextConstructorService);

  // --- Couche 3 : UI Providers ---
  const contextTreeProvider = new ContextTreeDataProvider(
    contextService,
    statisticsService,
    ignoreService,
    context.globalState // Pass Memento for active context state
  );
  vscode.window.createTreeView('jabbaRoot.contextView', { treeDataProvider: contextTreeProvider });

  // =================================================================================
  //  2. PHASE D'ENREGISTREMENT DES COMMANDES
  // =================================================================================
  // Enregistrement des commandes via les fonctions d'aide dédiées
  const refreshCommand = registerRefreshContextViewCommand(contextTreeProvider);
  const createContextCommand = registerCreateContextCommand(contextService, contextTreeProvider);
  const generateTreeCommand = registerGenerateProjectTreeCommand(
    structureGenerationService,
    projectRootPath,
    ignoreService
  );
  const compileCommand = registerCompileAndCopyContextCommand(
    contextConstructorService,
    contextService,
    ignoreService,
    contextTreeProvider
  );
  
  const deleteContextCommand = registerDeleteContextCommand(
    contextService,
    contextTreeProvider
  );

  const addPathToContextCommand = registerAddPathToContextCommand(
    contextService,
    contextTreeProvider
  );

  const removePathFromContextCommand = registerRemovePathFromContextCommand(
    contextService,
    contextTreeProvider
  );

  const setActiveContextCommand = registerSetActiveContextCommand(
    contextService,
    contextTreeProvider,
    context.globalState
  );

  const unsetActiveContextCommand = registerUnsetActiveContextCommand(
    contextTreeProvider,
    context.globalState
  );

  const addPathToActiveContextCommand = registerAddPathToActiveContextCommand(
    contextService,
    contextTreeProvider,
    context.globalState
  );

  const addActiveFileToSpecificContextCommand = registerAddActiveFileToSpecificContextCommand(
    contextService,
    contextTreeProvider
  );

  // Enregistrement de toutes les commandes dans le contexte de l'extension
  context.subscriptions.push(
    refreshCommand,
    createContextCommand,
    generateTreeCommand,
    compileCommand,
    deleteContextCommand,
    addPathToContextCommand,
    removePathFromContextCommand,
    setActiveContextCommand,
    unsetActiveContextCommand,
    addPathToActiveContextCommand,
    addActiveFileToSpecificContextCommand
  );
} // Fin de la fonction activate

export function deactivate() {}