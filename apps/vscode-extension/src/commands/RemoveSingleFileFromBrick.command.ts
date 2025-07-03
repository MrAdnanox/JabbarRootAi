// apps/vscode-extension/src/commands/RemoveSingleFileFromBrick.command.ts
/**
 * @file Commande pour retirer un fichier spécifique d'une brique existante
 * @module RemoveSingleFileFromBrickCommand
 * @description Permet de retirer un fichier d'une brique, ce qui signifie que le fichier ne sera plus inclus
 * dans les opérations de compilation ou de traitement spécifiques à cette brique.
 * 
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link ProjectTreeDataProvider} - Fournisseur de données pour l'arborescence des projets
 * @see {@link FileTreeItem} - Représentation d'un fichier dans l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { FileTreeItem } from '../providers/projectTreeItem.factory';

/**
 * Commande pour retirer un fichier spécifique d'une brique existante
 * 
 * ## Fonctionnalités
 * - Retire un fichier d'une brique existante
 * - Met à jour l'interface utilisateur pour refléter les changements
 * - Gère les erreurs avec des messages utilisateur appropriés
 * 
 * ## Points d'attention
 * - Vérifie que le fichier sélectionné est valide
 * - Confirme la suppression avec l'utilisateur
 * - Rafraîchit l'arborescence après la suppression
 */
export class RemoveSingleFileFromBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.RemoveSingleFileFromBrick',
        title: 'Remove Single File from Brick',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'brickService',
        'treeDataProvider'
    ] as const;

    /**
     * Exécute la commande de suppression de fichier d'une brique
     * @param services - Conteneur d'injection de dépendances
     * @param fileItem - Élément d'arborescence représentant le fichier à retirer (optionnel)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new RemoveSingleFileFromBrickCommand();
     * await command.execute(services, fileTreeItem);
     * ```
     */
    public async execute(services: Map<keyof ServiceCollection, IService>, fileItem?: FileTreeItem): Promise<void> {
        // Récupération des services nécessaires
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;

        // Validation de la sélection
        if (!this.isValidFileSelection(fileItem)) {
            this.showWarning('Veuillez sélectionner un fichier valide à supprimer.');
            return;
        }

        // Récupération de la brique parente
        const brick = await this.getParentBrick(brickService, fileItem!);
        if (!brick) {
            return;
        }

        try {
            await this.removeFileFromBrick(brickService, treeDataProvider, brick, fileItem!);
            this.showSuccess(`Fichier "${fileItem!.label}" supprimé de la brique "${brick.name}".`);
        } catch (error) {
            this.handleError('Échec de la suppression du fichier', error);
        }
    }

    /**
     * Helper: Vérifie si la sélection de fichier est valide
     * 
     * @private
     * @param {FileTreeItem | undefined} fileItem - Élément de fichier sélectionné
     * @returns {boolean} True si la sélection est valide, false sinon
     */
    private isValidFileSelection(fileItem?: FileTreeItem): boolean {
        return !!fileItem && fileItem.contextValue === 'jabbarrootFile';
    }

    /**
     * Helper: Récupère la brique parente d'un fichier
     * 
     * @private
     * @param {BrickService} brickService - Service de gestion des briques
     * @param {FileTreeItem} fileItem - Fichier dont on veut la brique parente
     * @returns {Promise<any | undefined>} La brique parente ou undefined si non trouvée
     */
    private async getParentBrick(brickService: BrickService, fileItem: FileTreeItem): Promise<any | undefined> {
        const brick = await brickService.getBrick(fileItem.brickId);
        if (!brick) {
            this.showError('Impossible de trouver la brique parente.');
            return undefined;
        }
        return brick;
    }

    /**
     * Helper: Supprime un fichier d'une brique
     * 
     * @private
     * @param {BrickService} brickService - Service de gestion des briques
     * @param {ProjectTreeDataProvider} treeDataProvider - Fournisseur de données pour l'arborescence
     * @param {any} brick - Brique de laquelle retirer le fichier
     * @param {FileTreeItem} fileItem - Fichier à retirer
     * @returns {Promise<void>}
     */
    private async removeFileFromBrick(
        brickService: BrickService,
        treeDataProvider: ProjectTreeDataProvider,
        brick: any,
        fileItem: FileTreeItem
    ): Promise<void> {
        await brickService.removePathFromBrick(brick.id, fileItem.label as string);
        treeDataProvider.refresh();
    }

    /**
     * Helper: Affiche un avertissement à l'utilisateur
     * 
     * @private
     * @param {string} message - Message d'avertissement
     */
    private showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
        console.warn(`[RemoveSingleFileFromBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message de succès
     * 
     * @private
     * @param {string} message - Message de succès
     */
    private showSuccess(message: string): void {
        vscode.window.showInformationMessage(message);
        console.log(`[RemoveSingleFileFromBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message d'erreur
     * 
     * @private
     * @param {string} message - Message d'erreur
     */
    private showError(message: string): void {
        vscode.window.showErrorMessage(message);
        console.error(`[RemoveSingleFileFromBrick] ${message}`);
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
        
        console.error(`[RemoveSingleFileFromBrick] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then((selection: string | undefined) => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// Export d'une instance unique de la commande
export default new RemoveSingleFileFromBrickCommand();
