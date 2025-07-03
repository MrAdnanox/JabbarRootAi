// apps/vscode-extension/src/commands/SetAsDefaultTargetBrick.command.ts
/**
 * @file Commande pour définir une brique comme cible par défaut
 * @module SetAsDefaultTargetBrickCommand
 * @description Permet de marquer une brique comme cible par défaut pour les opérations
 * ultérieures (ajout de fichiers, compilation, etc.) dans l'arborescence du projet.
 * 
 * Cette commande est généralement invoquée depuis le menu contextuel d'une brique
 * dans l'arborescence du projet JabbarRoot.
 * 
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link BrickTreeItem} - Représentation d'une brique dans l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

/**
 * Commande pour définir une brique comme cible par défaut
 * 
 * ## Fonctionnalités
 * - Marque une brique comme cible par défaut
 * - Met à jour automatiquement l'état des autres briques
 * - Fournit un retour visuel à l'utilisateur
 * 
 * ## Points d'attention
 * - Une seule brique peut être cible par défaut à la fois
 * - Nécessite des droits en écriture sur le projet
 */
export class SetAsDefaultTargetBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande ('jabbarroot')
     */
    public readonly metadata = {
        id: 'jabbarroot.SetAsDefaultTargetBrick',
        title: 'Définir comme cible par défaut',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'brickService'
    ] as const;

    /**
     * Exécute la commande de définition de cible par défaut
     * @param services - Conteneur d'injection de dépendances
     * @param brickItem - Élément d'arborescence représentant la brique sélectionnée (optionnel)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new SetAsDefaultTargetBrickCommand();
     * await command.execute(services, brickTreeItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        // Vérification de la sélection d'une brique valide
        if (!this.isValidBrickSelection(brickItem)) {
            this.showWarning('Veuillez sélectionner une brique valide pour la définir comme cible par défaut.');
            return;
        }

        // Récupération des services
        const brickService = services.get('brickService') as BrickService;
        const brick = brickItem!.brick;

        try {
            // Affichage d'une notification de progression
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Définition de la brique "${brick.name}" comme cible par défaut...`,
                cancellable: false
            }, async () => {
                // Définition de la brique comme cible par défaut
                await brickService.setAsDefaultTarget(brick.id);
            });
            
            // Notification de succès
            this.showSuccess(`La brique "${brick.name}" est maintenant la cible par défaut.`);
            
            // Rafraîchissement de la vue pour refléter les changements
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
            
        } catch (error) {
            this.handleError(error, `Impossible de définir la brique "${brick.name}" comme cible par défaut`);
        }
    }

    /**
     * Helper: Vérifie si un élément d'arborescence représente une brique valide
     * 
     * @private
     * @param {BrickTreeItem | undefined} brickItem - Élément d'arborescence à vérifier
     * @returns {boolean} True si l'élément est une brique valide, false sinon
     * 
     * @description
     * Vérifie que l'élément existe, qu'il s'agit bien d'une brique (contextValue = 'jabbarrootBrick')
     * et que les données de la brique sont disponibles.
     */
    private isValidBrickSelection(brickItem?: BrickTreeItem): boolean {
        return !!brickItem && brickItem.contextValue === 'jabbarrootBrick' && !!brickItem.brick;
    }

    /**
     * Helper: Affiche un message d'avertissement à l'utilisateur
     * 
     * @private
     * @param {string} message - Message d'avertissement à afficher
     * 
     * @description
     * Affiche un message d'avertissement dans l'interface VSCode et l'enregistre
     * dans la console avec le préfixe [SetAsDefaultTargetBrick].
     */
    private showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
        console.warn(`[SetAsDefaultTargetBrick] ${message}`);
    }

    /**
     * Helper: Affiche un message de succès à l'utilisateur
     * 
     * @private
     * @param {string} message - Message de succès à afficher
     * 
     * @description
     * Affiche un message d'information dans l'interface VSCode et l'enregistre
     * dans la console avec le préfixe [SetAsDefaultTargetBrick].
     * Utilisé pour confirmer les actions réussies à l'utilisateur.
     */
    private showSuccess(message: string): void {
        vscode.window.showInformationMessage(message);
        console.log(`[SetAsDefaultTargetBrick] ${message}`);
    }

    /**
     * Helper: Gère les erreurs de manière centralisée
     * 
     * @private
     * @param {unknown} error - Erreur survenue (peut être de type Error ou autre)
     * @param {string} context - Contexte descriptif de l'erreur
     * 
     * @description
     * Affiche un message d'erreur à l'utilisateur via l'interface VSCode,
     * enregistre l'erreur dans la console avec le préfixe [SetAsDefaultTargetBrick],
     * et propose d'afficher les logs complets.
     * Gère à la fois les objets Error et les autres types d'erreurs.
     */
    private handleError(error: unknown, context: string): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullMessage = `${context}: ${errorMessage}`;
        
        console.error(`[SetAsDefaultTargetBrick] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then(selection => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// Export d'une instance unique de la commande
export default new SetAsDefaultTargetBrickCommand();
