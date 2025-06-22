// src/extension.ts
import * as vscode from 'vscode';
import { ContextService } from './services/contextService';
import { ContextTreeDataProvider, ContextTreeItem } from './providers/contextTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {

    console.log('JabbaRoot est maintenant actif!');

    // 1. Initialisation des services
    const contextService = new ContextService(context.workspaceState);

    // 2. Création et enregistrement de la Tree View
    const contextTreeDataProvider = new ContextTreeDataProvider(contextService);
    vscode.window.createTreeView('jabbaRoot.contextView', {
        treeDataProvider: contextTreeDataProvider
    });

    // 3. Enregistrement des commandes
    const createCommand = vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
        // --- Workflow de collecte d'informations ---
        const contextName = await vscode.window.showInputBox({
            prompt: 'Entrez le nom du nouveau contexte programmable',
            placeHolder: 'ex: refactor_auth_service',
            validateInput: text => text && text.length > 0 ? null : 'Le nom ne peut pas être vide.'
        });
        if (!contextName) { return; } // Annulation par l'utilisateur

        const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: true,
            canSelectMany: true,
            title: 'Sélectionnez les fichiers et dossiers pour le contexte'
        });
        if (!fileUris || fileUris.length === 0) { return; } // Annulation

        const compressionLevel = await vscode.window.showQuickPick(['none', 'standard', 'extreme'], {
            title: 'Choisissez le niveau de compression du contexte',
            placeHolder: 'standard'
        }) as "none" | "standard" | "extreme" | undefined;
        if (!compressionLevel) { return; } // Annulation

        const includeTree = await vscode.window.showQuickPick(['Oui', 'Non'], {
            title: 'Inclure l\'arborescence du projet ?'
        });
        if (!includeTree) { return; }

        // --- Appel au service ---
        try {
            await contextService.createContext(contextName, fileUris, {
                compression_level: compressionLevel,
                include_project_tree: includeTree === 'Oui'
            });
            vscode.window.showInformationMessage(`Contexte "${contextName}" créé avec succès.`);
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
    
    const refreshCommand = vscode.commands.registerCommand('jabbaRoot.refreshContextView', () => {
        contextService.refresh();
    });

    context.subscriptions.push(createCommand, deleteCommand, refreshCommand);
}

export function deactivate() {}