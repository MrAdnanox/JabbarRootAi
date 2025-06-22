// src/extension.ts

import * as vscode from 'vscode';
import { ConfigurationService } from './services/configuration.service';
import { ContextService } from './services/contextService';
import { CompactionService } from './services/compactionService';
import { StatisticsService } from './services/statistics/statistics.service';
import { ContextTreeDataProvider } from './providers/contextTreeDataProvider';
import { ContextItem } from './providers/context.tree-item-factory';
import { FileContentService } from './services/fileContent.service';
import { StructureGenerationService } from './services/structureGeneration';
import { ContextConstructorService } from './services/contextConstructor.service';

async function resolveUrisToFiles(uris: vscode.Uri[]): Promise<vscode.Uri[]> {
    const fileUris: Set<string> = new Set();
    async function processUri(uri: vscode.Uri) {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.type === vscode.FileType.Directory) {
                const entries = await vscode.workspace.fs.readDirectory(uri);
                for (const [name, type] of entries) {
                    const newUri = vscode.Uri.joinPath(uri, name);
                    if (type === vscode.FileType.File) {
                        fileUris.add(newUri.toString());
                    } else if (type === vscode.FileType.Directory) {
                        await processUri(newUri);
                    }
                }
            } else if (stat.type === vscode.FileType.File) {
                fileUris.add(uri.toString());
            }
        } catch (error) {
            console.error(`JabbaRoot: Error processing URI ${uri.fsPath}`, error);
            vscode.window.showWarningMessage(`Could not process ${uri.fsPath}.`);
        }
    }
    await Promise.all(uris.map(uri => processUri(uri)));
    return Array.from(fileUris).map(uriStr => vscode.Uri.parse(uriStr));
}

export function activate(context: vscode.ExtensionContext) {

    // 1. Couche 1 : Instanciation des Outils
    const configurationService = new ConfigurationService();
    const structureGenerationService = new StructureGenerationService();
    const fileContentService = new FileContentService();
    const compactionService = new CompactionService();
    const contextService = new ContextService(context.workspaceState);

    // 2. Couche 2 : Instanciation des Superviseurs (avec injection des outils)
    const contextConstructor = new ContextConstructorService(
        structureGenerationService,
        fileContentService,
        compactionService,
        configurationService
    );
    const statisticsService = new StatisticsService(contextConstructor);

    // 3. Couche 3 : Instanciation de l'Interface Utilisateur (avec injection des superviseurs)
    const contextTreeDataProvider = new ContextTreeDataProvider(
      contextService,
      statisticsService,
      configurationService
    );
    vscode.window.createTreeView('jabbaRoot.contextView', { treeDataProvider: contextTreeDataProvider });
    
    // 4. Enregistrement des commandes qui délèguent aux superviseurs
    const createCommand = vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
        const contextName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new context' });
        if (!contextName) { return; }

        const selectedUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: true,
            canSelectMany: true,
            title: 'Select files and folders for the context'
        });
        if (!selectedUris || selectedUris.length === 0) { return; }
        
        const resolvedFileUris = await resolveUrisToFiles(selectedUris);

        if (resolvedFileUris.length === 0) {
            vscode.window.showWarningMessage("No files found in the selected directories.");
            return;
        }
        
        const compressionLevel = await vscode.window.showQuickPick(['none', 'standard', 'extreme'], { title: 'Compression Level' }) as "none" | "standard" | "extreme" | undefined;
        if (!compressionLevel) { return; }

        const includeTreeChoice = await vscode.window.showQuickPick(['Yes', 'No'], { title: 'Include project tree?' });
        if (!includeTreeChoice) { return; }

        try {
            await contextService.createContext(contextName, resolvedFileUris, {
                compression_level: compressionLevel,
                include_project_tree: includeTreeChoice === 'Yes'
            });
            vscode.window.showInformationMessage(`Context "${contextName}" created with ${resolvedFileUris.length} file(s).`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating context: ${error}`);
        }
    });

    const deleteCommand = vscode.commands.registerCommand('jabbaRoot.deleteContext', async (contextItem: ContextItem) => {
        if (!contextItem?.context?.id) {
            vscode.window.showWarningMessage('No context selected for deletion.');
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the context "${contextItem.context.name}"?`,
            { modal: true },
            'Delete'
        );
        if (confirmation === 'Delete') {
            await contextService.deleteContext(contextItem.context.id);
            vscode.window.showInformationMessage(`Context "${contextItem.context.name}" deleted.`);
        }
    });

    const compileCommand = vscode.commands.registerCommand('jabbaRoot.compileAndCopyContext', async (item: ContextItem) => {
        if (!item?.context) {
            vscode.window.showErrorMessage("No context to compile.");
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `JabbaRoot: Compiling "${item.context.name}"`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 20, message: "Assembling context..." });
            const finalContext = await contextConstructor.compileContext(item.context);
            progress.report({ increment: 90, message: "Copying to clipboard..." });
            await vscode.env.clipboard.writeText(finalContext);
            const stats = item.stats;
            progress.report({ increment: 100 });
            vscode.window.showInformationMessage(`Context "${item.context.name}" copied! Reduction: ${stats.reductionPercent}%`);
        });
    });
    
    const refreshCommand = vscode.commands.registerCommand('jabbaRoot.refreshContextView', () => {
        contextTreeDataProvider.refresh();
    });

    const generateTreeCommand = vscode.commands.registerCommand('jabbaRoot.generateProjectTree', async () => {
        if (!vscode.workspace.workspaceFolders?.length) {
            vscode.window.showWarningMessage("JabbaRoot: No project folder open.");
            return;
        }
        const rootUri = vscode.workspace.workspaceFolders[0].uri;
        const report = await structureGenerationService.generate(rootUri);
        if (report?.tree) {
            await vscode.env.clipboard.writeText(report.tree);
            vscode.window.showInformationMessage("JabbaRoot: Project tree copied to clipboard.");
        } else {
            vscode.window.showErrorMessage("JabbaRoot: Could not generate project tree.");
        }
    });

    context.subscriptions.push(createCommand, deleteCommand, compileCommand, generateTreeCommand, refreshCommand);
}

export function deactivate() {}