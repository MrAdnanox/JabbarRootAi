// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { ContextService } from './services/contextService';
import { CompactionService } from './services/compactionService';
import { ContextTreeDataProvider, ContextTreeItem } from './providers/contextTreeDataProvider';

/**
 * Prend une liste d'URIs (fichiers ou dossiers) et la résout en une liste plate d'URIs de fichiers.
 * Les dossiers sont explorés récursivement.
 * @param uris - Les URIs à résoudre.
 * @returns Une promesse qui se résout en une liste d'URIs de fichiers.
 */
async function resolveUrisToFiles(uris: vscode.Uri[]): Promise<vscode.Uri[]> {
    const fileUris: Set<string> = new Set();

    async function processUri(uri: vscode.Uri) {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.type === vscode.FileType.Directory) {
                // Si c'est un dossier, lire son contenu récursivement
                const entries = await vscode.workspace.fs.readDirectory(uri);
                for (const [name, type] of entries) {
                    const newUri = vscode.Uri.joinPath(uri, name);
                    if (type === vscode.FileType.File) {
                        fileUris.add(newUri.toString());
                    } else if (type === vscode.FileType.Directory) {
                        await processUri(newUri); // Appel récursif pour les sous-dossiers
                    }
                }
            } else if (stat.type === vscode.FileType.File) {
                // Si c'est un fichier, l'ajouter directement
                fileUris.add(uri.toString());
            }
        } catch (error) {
            console.error(`JabbaRoot: Erreur lors du traitement de l'URI ${uri.fsPath}`, error);
            vscode.window.showWarningMessage(`Impossible de traiter ${uri.fsPath}.`);
        }
    }

    // Traiter tous les URIs de manière asynchrone
    await Promise.all(uris.map(uri => processUri(uri)));

    // Convertir le Set de chaînes en un tableau d'URIs
    return Array.from(fileUris).map(uriStr => vscode.Uri.parse(uriStr));
}

export function activate(context: vscode.ExtensionContext) {
    // 1. Initialisation des services
    const contextService = new ContextService(context.workspaceState);
    const compactionService = new CompactionService();

    // 2. Création et enregistrement de la Tree View
    const contextTreeDataProvider = new ContextTreeDataProvider(contextService);
    vscode.window.createTreeView('jabbaRoot.contextView', {
        treeDataProvider: contextTreeDataProvider
    });
    
    // 3. Enregistrement des commandes
    const createCommand = vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
        const contextName = await vscode.window.showInputBox({ prompt: 'Entrez le nom du nouveau contexte' });
        if (!contextName) { return; }

        const selectedUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: true, // On garde la possibilité de sélectionner des dossiers
            canSelectMany: true,
            title: 'Sélectionnez les fichiers et dossiers pour le contexte'
        });
        if (!selectedUris || selectedUris.length === 0) { return; }
        
        // --- CORRECTION MAJEURE ICI ---
        // Résoudre les dossiers en une liste de fichiers avant de continuer
        const resolvedFileUris = await resolveUrisToFiles(selectedUris);

        if (resolvedFileUris.length === 0) {
            vscode.window.showWarningMessage("Aucun fichier trouvé dans les dossiers sélectionnés.");
            return;
        }
        
        // La suite de la logique reste la même, mais utilise `resolvedFileUris`
        const compressionLevel = await vscode.window.showQuickPick(['none', 'standard', 'extreme'], { title: 'Niveau de compression' }) as "none" | "standard" | "extreme" | undefined;
        if (!compressionLevel) { return; }

        const includeTreeChoice = await vscode.window.showQuickPick(['Oui', 'Non'], { title: 'Inclure l\'arborescence du projet ?' });
        if (!includeTreeChoice) { return; }

        try {
            // On passe la liste de fichiers résolue au service
            await contextService.createContext(contextName, resolvedFileUris, {
                compression_level: compressionLevel,
                include_project_tree: includeTreeChoice === 'Oui'
            });
            vscode.window.showInformationMessage(`Contexte "${contextName}" créé avec ${resolvedFileUris.length} fichier(s).`);
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la création du contexte: ${error}`);
        }
    });

    const deleteCommand = vscode.commands.registerCommand('jabbaRoot.deleteContext', async (contextItem: ContextTreeItem) => {
        if (!contextItem || !contextItem.context.id) {
            vscode.window.showWarningMessage('Aucun contexte sélectionné pour la suppression.');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            `Êtes-vous sûr de vouloir supprimer le contexte "${contextItem.context.name}" ?`,
            { modal: true },
            'Supprimer'
        );

        if (confirmation === 'Supprimer') {
            await contextService.deleteContext(contextItem.context.id);
            vscode.window.showInformationMessage(`Contexte "${contextItem.context.name}" supprimé.`);
        }
    });

    const compileCommand = vscode.commands.registerCommand('jabbaRoot.compileAndCopyContext', async (item: ContextTreeItem) => {
        if (!item || !item.context) {
            vscode.window.showErrorMessage("Aucun contexte à compiler.");
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `JabbaRoot: Compilation de "${item.context.name}"`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "Préparation..." });
            
            const originalContext = await compactionService.compileContext({ ...item.context, options: { ...item.context.options, compression_level: 'none' }});
            progress.report({ increment: 50, message: "Compression..." });
            
            const finalContext = await compactionService.compileContext(item.context);
            
            await vscode.env.clipboard.writeText(finalContext);

            const reduction = originalContext.length - finalContext.length;
            const reductionPercent = originalContext.length > 0 ? Math.round((reduction / originalContext.length) * 100) : 0;

            progress.report({ increment: 100 });
            vscode.window.showInformationMessage(`Contexte "${item.context.name}" copié ! Réduction: ${reductionPercent}%`);
        });
    });
    
    const refreshCommand = vscode.commands.registerCommand('jabbaRoot.refreshContextView', () => {
        contextService.refresh();
    });

    context.subscriptions.push(createCommand, deleteCommand, compileCommand, refreshCommand);
}

export function deactivate() {}