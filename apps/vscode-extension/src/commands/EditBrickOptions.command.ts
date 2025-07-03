// apps/vscode-extension/src/commands/EditBrickOptions.command.ts
/**
 * @file Commande pour éditer les options d'une brique via une interface web
 * @module EditBrickOptionsCommand
 * @description Permet la modification des options d'une brique via une interface web interactive.
 * Ouvre un panneau latéral dans VSCode avec un formulaire d'édition des options de la brique.
 * 
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link ProjectService} - Service de gestion des projets
 * @see {@link BrickOptionsViewProvider} - Fournisseur de la vue d'édition des options
 * @see {@link BrickTreeItem} - Représentation d'une brique dans l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { BrickOptionsViewProvider } from '../webviews/BrickOptionsViewProvider';

/**
 * Commande d'édition des options de brique via une interface web
 * 
 * ## Fonctionnalités
 * - Ouvre un panneau webview pour l'édition des options de la brique
 * - Charge les options actuelles de la brique et du projet parent
 * - Permet la sauvegarde des modifications
 * - Rafraîchit automatiquement la vue après modification
 * 
 * ## Points d'attention
 * - Nécessite une sélection de brique valide
 * - Vérifie l'existence du projet parent
 * - Gère les erreurs de chargement et de sauvegarde
 * - Nettoie automatiquement les ressources à la fermeture
 */
export class EditBrickOptionsCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.EditBrickOptions',
        title: 'Edit Brick Options',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',  // Service pour la gestion des projets
        'brickService',    // Service pour la gestion des briques
        'extensionContext' // <-- Demander le contexte comme dépendance
    ] as const;

    /**
     * Exécute la commande d'édition des options de brique
     * 
     * @param services - Conteneur d'injection de dépendances
     * @param ...args - Arguments supplémentaires (brickItem, context)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new EditBrickOptionsCommand();
     * await command.execute(services, brickTreeItem, context);
     * ```
     */
    public async execute(services: Map<keyof ServiceCollection, IService>, ...args: any[]): Promise<void> {
        // --- RÉCUPÉRATION DES ARGUMENTS ---
        const brickItem = args[0] as BrickTreeItem | undefined;

        try {
            // Validation de la sélection de la brique
            if (!this.isValidBrickSelection(brickItem)) {
                this.showError('Veuillez lancer cette commande depuis la vue JabbarRoot en cliquant sur une brique.');
                return;
            }

            // Récupération et configuration du panneau d'édition
            const panelResult = await this.setupBrickOptionsPanel(services, brickItem!);
            if (!panelResult) return;
            
            // Extraction des propriétés après vérification de nullité
            const { panel, brick, project } = panelResult;

            // Configuration des gestionnaires d'événements
            this.setupMessageHandlers(panel, services, brick, project);
        } catch (error) {
            this.handleError('Erreur lors de l\'initialisation de l\'éditeur d\'options de brique', error);
        }
    }

    /**
     * Helper: Vérifie si la sélection de brique est valide
     * 
     * @private
     * @param {BrickTreeItem | undefined} brickItem - Élément de brique sélectionné
     * @returns {boolean} True si la sélection est valide, false sinon
     */
    private isValidBrickSelection(brickItem?: BrickTreeItem): boolean {
        // Vérification robuste du type et du contexte
        return !!brickItem && brickItem.contextValue === 'jabbarrootBrick' && !!brickItem.brick?.id;
    }

    /**
     * Helper: Configure le panneau d'édition des options de la brique
     * 
     * @private
     * @param {vscode.ExtensionContext} context - Contexte d'extension VSCode
     * @param {Map<keyof ServiceCollection, IService>} services - Conteneur de services
     * @param {BrickTreeItem} brickItem - Élément de brique sélectionné
     * @returns {Promise<{panel: vscode.WebviewPanel, brick: any, project: any} | null>} Configuration du panneau ou null en cas d'erreur
     */
    private async setupBrickOptionsPanel(
        services: Map<keyof ServiceCollection, IService>,
        brickItem: BrickTreeItem
    ): Promise<{panel: vscode.WebviewPanel, brick: any, project: any} | null> {
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        const brickService = services.get('brickService') as BrickService;
        const projectService = services.get('projectService') as ProjectService;
        const brickId = brickItem.brick!.id;

        // Récupération des données fraîches
        const [brick, project] = await Promise.all([
            brickService.getBrick(brickId),
            projectService.getProject(brickItem.brick!.projectId)
        ]);

        // Validation des données
        if (!brick) {
            this.showError(`Impossible de trouver la brique avec l'ID: ${brickId}`);
            return null;
        }
        if (!project) {
            this.showError('Le projet parent de la brique est introuvable.');
            return null;
        }

        // Création du panneau webview
        const panel = vscode.window.createWebviewPanel(
            'jabbarroot.brickOptions',
            `Options: ${brick.name}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'assets')
                ]
            }
        );

        // Configuration du contenu de la webview
        const viewProvider = new BrickOptionsViewProvider(brick, project, context.extensionUri);
        panel.webview.html = viewProvider.getHtmlForWebview(panel.webview);

        return { panel, brick, project };
    }

    /**
     * Helper: Configure les gestionnaires de messages pour la webview
     * 
     * @private
     * @param {vscode.WebviewPanel} panel - Panneau webview
     * @param {Map<keyof ServiceCollection, IService>} services - Conteneur de services
     * @param {any} brick - Brique en cours d'édition
     * @param {any} project - Projet parent de la brique
     * @param {vscode.ExtensionContext} context - Contexte d'extension VSCode
     */
    private setupMessageHandlers(
        panel: vscode.WebviewPanel,
        services: Map<keyof ServiceCollection, IService>,
        brick: any,
        project: any
    ): void {
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        const brickService = services.get('brickService') as BrickService;
        
        panel.webview.onDidReceiveMessage(
            async (message: { type: string; payload?: any }) => {
                if (message.type === 'save') {
                    await this.handleSaveOptions(panel, brickService, brick, message.payload);
                }
            },
            undefined,
            (services.get('extensionContext') as vscode.ExtensionContext).subscriptions
        );
    }

    /**
     * Helper: Gère la sauvegarde des options de la brique
     * 
     * @private
     * @param {vscode.WebviewPanel} panel - Panneau webview
     * @param {BrickService} brickService - Service de gestion des briques
     * @param {any} brick - Brique à mettre à jour
     * @param {any} payload - Données de la sauvegarde
     */
    private async handleSaveOptions(
        panel: vscode.WebviewPanel,
        brickService: BrickService,
        brick: any,
        payload: { updatedOptions: any }
    ): Promise<void> {
        try {
            await brickService.updateBrick(brick.id, {
                options: payload.updatedOptions
            });
            
            // Notification de succès
            panel.webview.postMessage({
                type: 'optionsSaved',
                message: 'Les options ont été enregistrées avec succès.'
            });
            
            // Fermeture différée avec retour visuel
            setTimeout(() => {
                panel.dispose();
                vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
            }, 1000);
            
        } catch (error) {
            this.handleError('Échec de la sauvegarde des options', error);
            
            // Notification d'erreur à l'utilisateur
            panel.webview.postMessage({
                type: 'error',
                error: 'Échec de l\'enregistrement des options. Veuillez réessayer.'
            });
        }
    }

    /**
     * Helper: Affiche un message d'erreur
     * 
     * @private
     * @param {string} message - Message d'erreur
     */
    private showError(message: string): void {
        vscode.window.showErrorMessage(message);
        console.error(`[EditBrickOptions] ${message}`);
    }

    /**
     * Helper: Gère les erreurs de manière centralisée
     * 
     * @private
     * @param {string} context - Contexte de l'erreur
     * @param {unknown} error - Erreur survenue
     */
    private handleError(context: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullMessage = `${context}: ${errorMessage}`;
        
        console.error(`[EditBrickOptions] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then(selection => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

export default new EditBrickOptionsCommand();