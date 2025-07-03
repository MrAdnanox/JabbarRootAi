// apps/vscode-extension/src/commands/RemoveFileFromBrick.command.ts
/**
 * @file Commande pour retirer un fichier d'une brique via une interface de sélection
 * @module RemoveFileFromBrickCommand
 * @description Permet de retirer un fichier d'une brique après sélection via une interface utilisateur.
 * L'utilisateur peut choisir parmi les fichiers existants de la brique.
 * 
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link ProjectTreeDataProvider} - Fournisseur de données pour l'arborescence des projets
 * @see {@link BrickTreeItem} - Représentation d'une brique dans l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

/**
 * Commande pour retirer un fichier d'une brique via une interface de sélection
 * 
 * ## Fonctionnalités
 * - Affiche une liste des fichiers de la brique
 * - Permet à l'utilisateur de sélectionner un fichier à retirer
 * - Gère les erreurs et les cas limites (brique vide, sélection annulée)
 * - Rafraîchit l'interface utilisateur après la suppression
 * 
 * ## Points d'attention
 * - Vérifie que la brique sélectionnée est valide
 * - Vérifie que la brique contient des fichiers avant d'afficher la sélection
 * - Gère correctement l'annulation de la sélection
 */
export class RemoveFileFromBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.RemoveFileFromBrick',
        title: 'Remove File from Brick',
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
     * @param brickItem - Élément d'arborescence représentant la brique (optionnel)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new RemoveFileFromBrickCommand();
     * await command.execute(services, brickTreeItem);
     * ```
     */
    public async execute(services: Map<keyof ServiceCollection, IService>, brickItem?: BrickTreeItem): Promise<void> {
        // Récupération des services nécessaires
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;

        // Validation de la sélection
        if (!this.isValidBrickSelection(brickItem)) {
            this.showWarning('Veuillez sélectionner une brique valide pour en supprimer un fichier.');
            return;
        }

        const brick = brickItem!.brick;
        
        // Vérification des fichiers dans la brique
        if (!this.hasFilesInBrick(brick)) {
            this.showInfo(`La brique "${brick.name}" ne contient aucun fichier.`);
            return;
        }

        // Sélection et suppression du fichier
        await this.selectAndRemoveFile(brickService, treeDataProvider, brick);
    }

    /**
     * Helper: Vérifie si la sélection de brique est valide
     * 
     * @private
     * @param {BrickTreeItem | undefined} brickItem - Élément de brique sélectionné
     * @returns {boolean} True si la sélection est valide, false sinon
     */
    private isValidBrickSelection(brickItem?: BrickTreeItem): boolean {
        return !!brickItem && brickItem.contextValue === 'jabbarrootBrick';
    }

    /**
     * Helper: Vérifie si la brique contient des fichiers
     * 
     * @private
     * @param {any} brick - Brique à vérifier
     * @returns {boolean} True si la brique contient des fichiers, false sinon
     */
    private hasFilesInBrick(brick: any): boolean {
        return !!(brick.files_scope && brick.files_scope.length > 0);
    }

    /**
     * Helper: Affiche une boîte de dialogue de sélection et supprime le fichier choisi
     * 
     * @private
     * @param {BrickService} brickService - Service de gestion des briques
     * @param {ProjectTreeDataProvider} treeDataProvider - Fournisseur de données pour l'arborescence
     * @param {any} brick - Brique dont on veut supprimer un fichier
     * @returns {Promise<void>}
     */
    private async selectAndRemoveFile(
        brickService: BrickService,
        treeDataProvider: ProjectTreeDataProvider,
        brick: any
    ): Promise<void> {
        // Sélection du fichier à supprimer
        const fileToRemove = await vscode.window.showQuickPick(brick.files_scope, {
            placeHolder: 'Sélectionnez le fichier à retirer de la brique'
        });

        // Sortie si l'utilisateur annule la sélection
        if (!fileToRemove) return;

        try {
            await this.removeFileFromBrick(brickService, treeDataProvider, brick, fileToRemove);
            this.showSuccess(`Fichier "${fileToRemove}" supprimé de la brique "${brick.name}".`);
        } catch (error) {
            this.handleError('Échec de la suppression du fichier', error);
        }
    }

    /**
     * Helper: Supprime un fichier d'une brique
     * 
     * @private
     * @param {BrickService} brickService - Service de gestion des briques
     * @param {ProjectTreeDataProvider} treeDataProvider - Fournisseur de données pour l'arborescence
     * @param {any} brick - Brique de laquelle retirer le fichier
     * @param {string} filePath - Chemin du fichier à retirer
     * @returns {Promise<void>}
     */
    private async removeFileFromBrick(
        brickService: BrickService,
        treeDataProvider: ProjectTreeDataProvider,
        brick: any,
        filePath: string
    ): Promise<void> {
        await brickService.removePathFromBrick(brick.id, filePath);
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
        console.warn(`[RemoveFileFromBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message d'information à l'utilisateur
     * 
     * @private
     * @param {string} message - Message d'information
     */
    private showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
        console.log(`[RemoveFileFromBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message de succès
     * 
     * @private
     * @param {string} message - Message de succès
     */
    private showSuccess(message: string): void {
        vscode.window.showInformationMessage(message);
        console.log(`[RemoveFileFromBrick] ${message}`);
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
        
        console.error(`[RemoveFileFromBrick] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then((selection: string | undefined) => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// Export d'une instance unique de la commande
export default new RemoveFileFromBrickCommand();
