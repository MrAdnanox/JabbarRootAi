// apps/vscode-extension/src/commands/RefreshProjectView.command.ts
/**
 * @file Commande pour rafraîchir la vue de l'arborescence du projet JabbarRoot
 * @module RefreshProjectViewCommand
 * @description Permet de forcer le rafraîchissement de l'affichage de l'arborescence
 * du projet dans l'explorateur VSCode. Utile après des modifications de la structure
 * du projet ou des briques pour synchroniser l'interface utilisateur avec l'état actuel.
 * 
 * @see {@link ProjectTreeDataProvider} - Fournisseur de données pour l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';

/**
 * Commande de rafraîchissement de la vue du projet
 * 
 * ## Fonctionnalités
 * - Rafraîchit l'affichage de l'arborescence du projet
 * - S'exécute de manière silencieuse sans notification utilisateur
 * - Utile après des opérations modifiant la structure du projet
 * 
 * ## Points d'attention
 * - Ne nécessite pas de paramètres d'entrée
 * - Ne génère pas de sortie visible pour l'utilisateur
 * - Dépend du ProjectTreeDataProvider pour le rafraîchissement
 */
export class RefreshProjectViewCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.RefreshProjectView',
        title: 'Refresh Project View',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'treeDataProvider'  // Fournisseur de données pour l'arborescence du projet
    ] as const;

    /**
     * Exécute la commande de rafraîchissement de la vue
     * 
     * @param services - Conteneur d'injection de dépendances
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new RefreshProjectViewCommand();
     * await command.execute(services);
     * ```
     */
    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        try {
            await this.refreshProjectView(services);
            this.logDebug('Vue du projet rafraîchie avec succès');
        } catch (error) {
            this.handleError('Erreur lors du rafraîchissement de la vue', error);
        }
    }

    /**
     * Helper: Rafraîchit la vue de l'arborescence du projet
     * 
     * @private
     * @param {Map<keyof ServiceCollection, IService>} services - Conteneur de services
     * @returns {void}
     * 
     * @throws {Error} Si le fournisseur de données n'est pas disponible
     */
    private refreshProjectView(services: Map<keyof ServiceCollection, IService>): void {
        const treeDataProvider = services.get('treeDataProvider');
        
        if (!treeDataProvider) {
            throw new Error('Service treeDataProvider non disponible');
        }

        (treeDataProvider as ProjectTreeDataProvider).refresh();
    }

    /**
     * Helper: Journalise un message de débogage
     * 
     * @private
     * @param {string} message - Message à journaliser
     */
    private logDebug(message: string): void {
        console.debug(`[RefreshProjectView] ${message}`);
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
        
        console.error(`[RefreshProjectView] ${fullMessage}`, error);
        // Pas d'affichage à l'utilisateur pour une opération de rafraîchissement
    }
}

// Export d'une instance unique de la commande
export default new RefreshProjectViewCommand();
