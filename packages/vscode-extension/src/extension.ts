// packages/vscode-extension/src/extension.ts

import * as vscode from 'vscode';

// --- CORE ---
// Importe TOUT ce qui est public depuis le point d'entrée du core.
// C'est plus propre et utilise notre fichier "index.ts".
import {
  CompactionService,
  FileContentService,
  StructureGenerationService,
  ContextConstructorService,
  ProgrammableContext
  // IConfiguration, IFileSystem, IStorage etc. seront importés ici quand nécessaire
} from '@jabbarroot/core';


// --- EXTENSION-SPECIFIC ---
import { VscodeFileSystemAdapter } from './adapters/vscodeFileSystem.adapter';
import { VscodeConfigurationAdapter } from './adapters/vscodeConfiguration.adapter';
import { IgnoreService } from './services/ignore.service';
import { MementoStorageAdapter } from './adapters/mementoStorage.adapter';
import { ContextTreeDataProvider } from './providers/contextTreeDataProvider';
import { ContextItem } from './providers/context.tree-item-factory';

// On garde une référence pour la gestion du projet
const getProjectRootPath = (): string | undefined => {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
};


export function activate(context: vscode.ExtensionContext) {

  // =================================================================================
  //  1. PHASE D'INITIALISATION : INJECTION DE DÉPENDANCES
  //     Nous construisons l'application de l'extérieur vers l'intérieur.
  // =================================================================================

  // --- Couche 0 : Adaptateurs (Ponts vers l'API VSCode) ---
  const fsAdapter = new VscodeFileSystemAdapter();
  const configAdapter = new VscodeConfigurationAdapter();
  // L'état du workspace est un mécanisme de stockage, c'est donc un adaptateur.
  const storageAdapter = new MementoStorageAdapter(context.workspaceState);

  // --- Couche 1 : Services Spécifiques à l'Extension ---
  const ignoreService = new IgnoreService(fsAdapter);

  // --- Couche 2 : Services du Core (Cerveau Agnostique) ---
  const compactionService = new CompactionService();
  const fileContentService = new FileContentService(fsAdapter);
  const structureGenerationService = new StructureGenerationService(fsAdapter);
  
  // Le service de gestion des contextes (CRUD) dans le core, qui a besoin de savoir comment stocker.
  // NOTE: Ce service 'ContextService' doit être créé dans le core. Pour l'instant on imagine son existence.
  // const contextService = new CoreContextService(storageAdapter);

  // Le service d'orchestration principal, qui reçoit les autres services du core.
  const contextConstructorService = new ContextConstructorService(
    structureGenerationService,
    fileContentService,
    compactionService
  );

  // --- Couche 3 : UI Providers ---
  // La TreeView a besoin des services pour afficher les données.
  // NOTE: Il faudra refactorer ContextTreeDataProvider pour qu'il utilise les services injectés.
  // const statisticsService = new CoreStatisticsService(contextConstructorService);
  // const contextTreeProvider = new ContextTreeDataProvider(contextService, statisticsService, configAdapter);
  // vscode.window.createTreeView('jabbaRoot.contextView', { treeDataProvider: contextTreeProvider });


  // =================================================================================
  //  2. PHASE D'ENREGISTREMENT : COMMANDES
  //     Nous connectons l'application assemblée à l'UI de VSCode.
  // =================================================================================

  const refreshCommand = vscode.commands.registerCommand('jabbaRoot.refreshContextView', () => {
    // contextTreeProvider.refresh();
    vscode.window.showInformationMessage("JabbarRoot: View refreshed (simulation).");
  });

  const generateTreeCommand = vscode.commands.registerCommand('jabbaRoot.generateProjectTree', async () => {
    const rootPath = getProjectRootPath();
    if (!rootPath) {
      vscode.window.showWarningMessage("JabbaRoot: No project folder open.");
      return;
    }
    
    const shouldIgnore = await ignoreService.createIgnorePredicate(rootPath);
    const report = await structureGenerationService.generate(rootPath, { shouldIgnore });
    
    if (report?.tree) {
      await vscode.env.clipboard.writeText(report.tree);
      vscode.window.showInformationMessage("JabbarRoot: Project tree copied to clipboard.");
    } else {
      vscode.window.showErrorMessage("JabbaRoot: Could not generate project tree.");
    }
  });

  const compileCommand = vscode.commands.registerCommand('jabbaRoot.compileAndCopyContext', async (contextItem: ContextItem) => {
    if (!contextItem) {
      vscode.window.showWarningMessage('No context selected.');
      return;
    }
    
    const projectRootPath = getProjectRootPath();
    if (!projectRootPath) {
        vscode.window.showErrorMessage('A project folder must be open.');
        return;
    }

    const shouldIgnore = await ignoreService.createIgnorePredicate(projectRootPath);
    const structureGenOptions = { shouldIgnore, maxDepth: 7 };

    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `JabbarRoot: Compiling ${contextItem.label}...` }, async (progress) => {
      progress.report({ message: 'Assembling context...' });

      const contextModel: ProgrammableContext = contextItem.context;

      const compiledContext = await contextConstructorService.compileContext(
          contextModel,
          contextModel.files_scope,
          projectRootPath,
          structureGenOptions
      );
      
      await vscode.env.clipboard.writeText(compiledContext);
      vscode.window.showInformationMessage(`JabbarRoot: Context "${contextItem.label}" compiled and copied!`);
    });
  });

  const createContextCommand = vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
    // NOTE: La logique de création de contexte devra être migrée pour utiliser le `contextService` du core.
    vscode.window.showInformationMessage("JabbarRoot: 'Create Context' command not fully migrated yet.");
  });

  const deleteContextCommand = vscode.commands.registerCommand('jabbaRoot.deleteContext', async (contextItem: ContextItem) => {
    // NOTE: La logique de suppression devra utiliser le `contextService` du core.
    vscode.window.showInformationMessage("JabbarRoot: 'Delete Context' command not fully migrated yet.");
  });


  // Enregistrement de toutes les commandes pour qu'elles soient disponibles dans l'extension
  context.subscriptions.push(
    refreshCommand,
    generateTreeCommand,
    compileCommand,
    createContextCommand,
    deleteContextCommand
  );
}

export function deactivate() {}