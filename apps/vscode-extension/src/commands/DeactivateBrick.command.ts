// apps/vscode-extension/src/commands/DeactivateBrick.command.ts
/**
 * @file Commande pour désactiver une brique pour la compilation du projet
 * @module DeactivateBrickCommand
 * @description Gère la désactivation d'une brique JabbarRoot pour la compilation du projet.
 * Exclut la brique de la compilation tout en la conservant dans le système.
 * 
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link BrickTreeItem} - Représentation d'une brique dans l'arborescence
 * @see {@link ProjectTreeDataProvider} - Fournisseur de données pour l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';

/**
 * Commande de désactivation de brique pour la compilation du projet
 * 
 * ## Fonctionnalités
 * - Vérification de la validité de la brique sélectionnée
 * - Désactivation de la brique via le BrickService
 * - Mise à jour de l'interface utilisateur et du contexte VSCode
 * - Gestion robuste des erreurs et feedback utilisateur
 * 
 * ## Points d'attention
 * - Ne supprime pas la brique, mais l'exclut uniquement de la compilation
 * - Nécessite que la brique soit active pour être désactivée
 * - Met à jour le contexte VSCode pour les menus contextuels
 */
export class DeactivateBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.DeactivateBrick',
        title: 'Deactivate Brick for Project Compilation',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     * @type {Array<keyof ServiceCollection>}
     */
    public readonly dependencies = [
        'brickService',     // Service pour la gestion des briques
        'treeDataProvider'  // Fournisseur de données pour l'arborescence
    ] as const;

    /**
     * Exécute la commande de désactivation de brique
     * 
     * @param services - Conteneur d'injection de dépendances
     * @param _context - Contexte d'extension VSCode (non utilisé actuellement)
     * @param brickItem - Élément de l'arborescence représentant la brique à désactiver
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new DeactivateBrickCommand();
     * await command.execute(services, context, brickTreeItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        _context: vscode.ExtensionContext,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        try {
            // Récupération des services nécessaires
            const brickService = services.get('brickService') as BrickService;
            const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;

            // Validation de la sélection de la brique
            if (!this.isValidBrickSelection(brickItem)) {
                this.showWarning('Veuillez sélectionner une brique valide pour la désactiver.');
                return;
            }

            const brick = brickItem!.brick;
            
            // Vérification que la brique est active
            if (!this.isBrickActive(brick)) {
                this.showInfo(`La brique "${brick.name}" est déjà désactivée.`);
                return;
            }

            // Exécution de la désactivation
            await this.executeDeactivation(brick, {
                brickService,
                treeDataProvider
            });

        } catch (error) {
            this.handleError('Erreur lors de la désactivation de la brique', error);
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
        return !!brickItem && 
               brickItem.contextValue === 'jabbarrootBrick' && 
               !!brickItem.brick;
    }

    /**
     * Helper: Vérifie si une brique est active pour la compilation
     * 
     * @private
     * @param {any} brick - Brique à vérifier
     * @returns {boolean} True si la brique est active, false sinon
     */
    private isBrickActive(brick: any): boolean {
        return !!brick.isActiveForProjectCompilation;
    }

    /**
     * Helper: Exécute la désactivation de la brique
     * 
     * @private
     * @param {any} brick - Brique à désactiver
     * @param {Object} services - Services nécessaires pour la désactivation
     * @param {BrickService} services.brickService - Service de gestion des briques
     * @param {ProjectTreeDataProvider} services.treeDataProvider - Fournisseur de données de l'arborescence
     * @returns {Promise<void>}
     */
    private async executeDeactivation(
        brick: any,
        services: {
            brickService: BrickService;
            treeDataProvider: ProjectTreeDataProvider;
        }
    ): Promise<void> {
        const { brickService, treeDataProvider } = services;

        try {
            // 1. Mise à jour du statut de la brique
            const updatedBrick = await brickService.updateBrick(
                brick.id, 
                { isActiveForProjectCompilation: false }
            );
            
            if (updatedBrick) {
                // 2. Notification de succès
                this.showSuccess(`Brique "${brick.name}" désactivée pour la compilation du projet.`);
                
                // 3. Mise à jour du contexte VSCode
                await this.updateVSCodeContext(false);
                
                // 4. Rafraîchissement de l'interface
                this.refreshTreeView(treeDataProvider);
            } else {
                this.showError(`Impossible de désactiver la brique "${brick.name}".`);
            }
            
        } catch (error) {
            this.refreshTreeView(treeDataProvider);
            throw error;
        }
    }

    /**
     * Helper: Met à jour le contexte VSCode pour les menus contextuels
     * 
     * @private
     * @param {boolean} isActive - Nouvel état d'activation de la brique
     * @returns {Promise<void>}
     */
    private async updateVSCodeContext(isActive: boolean): Promise<void> {
        try {
            await vscode.commands.executeCommand(
                'setContext', 
                'jabbarroot:selectedBrickIsActive', 
                isActive
            );
        } catch (error) {
            console.error('Erreur lors de la mise à jour du contexte VSCode :', error);
        }
    }

    /**
     * Helper: Rafraîchit la vue de l'arborescence
     * 
     * @private
     * @param {ProjectTreeDataProvider} treeDataProvider - Fournisseur de données de l'arborescence
     */
    private refreshTreeView(treeDataProvider: ProjectTreeDataProvider): void {
        try {
            if (treeDataProvider?.refresh) {
                treeDataProvider.refresh();
            }
        } catch (refreshError) {
            console.error('Erreur lors du rafraîchissement de l\'arborescence :', refreshError);
        }
    }

    /**
     * Helper: Affiche un message d'information
     * 
     * @private
     * @param {string} message - Message à afficher
     */
    private showInfo(message: string): void {
        vscode.window.showInformationMessage(message, 'OK');
        console.log(`[DeactivateBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message d'avertissement
     * 
     * @private
     * @param {string} message - Message d'avertissement
     */
    private showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
        console.warn(`[DeactivateBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message de succès
     * 
     * @private
     * @param {string} message - Message de succès
     */
    private showSuccess(message: string): void {
        vscode.window.showInformationMessage(message, 'OK');
        console.log(`[DeactivateBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message d'erreur
     * 
     * @private
     * @param {string} message - Message d'erreur
     */
    private showError(message: string): void {
        vscode.window.showErrorMessage(message, 'OK');
        console.error(`[DeactivateBrick] ${message}`);
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
        
        console.error(`[DeactivateBrick] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then(selection => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// Export d'une instance unique de la commande pour utilisation dans le système de commandes
export default new DeactivateBrickCommand();
