// apps/vscode-extension/src/commands/DeleteProject.command.ts
/**
 * @file Commande pour supprimer un projet et toutes ses briques associées
 * @module DeleteProjectCommand
 * @description Gère la suppression complète d'un projet JabbarRoot et de toutes ses dépendances.
 * Effectue une suppression en cascade avec confirmation utilisateur et gestion des erreurs.
 * 
 * @see {@link ProjectService} - Service de gestion des projets
 * @see {@link BrickService} - Service de gestion des briques
 * @see {@link ProjectTreeItem} - Représentation d'un projet dans l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { BrickService, ProjectService } from '@jabbarroot/core';

/**
 * Commande de suppression de projet avec gestion des dépendances
 * 
 * ## Fonctionnalités
 * - Suppression en cascade des briques associées au projet
 * - Confirmation utilisateur explicite avec avertissement de sécurité
 * - Gestion robuste des erreurs et restauration partielle en cas d'échec
 * - Rafraîchissement automatique de l'interface utilisateur
 * 
 * ## Points d'attention
 * - Action irréversible avec impact sur les données
 * - Nécessite une confirmation explicite de l'utilisateur
 * - Gestion des erreurs pour éviter les états incohérents
 * - Journalisation détaillée des opérations
 */
export class DeleteProjectCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.DeleteProject',
        title: 'Delete Project',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     * @type {Array<keyof ServiceCollection>}
     */
    public readonly dependencies = [
        'projectService',    // Service pour la gestion des projets
        'brickService',      // Service pour la gestion des briques
        'treeDataProvider'   // Fournisseur de données pour l'arborescence
    ] as const;

    /**
     * Exécute la commande de suppression de projet
     * 
     * @param services - Conteneur d'injection de dépendances
     * @param context - Contexte d'extension VSCode
     * @param projectItem - Élément de l'arborescence représentant le projet à supprimer
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new DeleteProjectCommand();
     * await command.execute(services, context, projectTreeItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        context: vscode.ExtensionContext,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        try {
            // Récupération des services nécessaires
            const projectService = services.get('projectService') as ProjectService;
            const brickService = services.get('brickService') as BrickService;
            const treeDataProvider = services.get('treeDataProvider') as any;

            // Validation de la sélection du projet
            if (!this.isValidProjectSelection(projectItem)) {
                this.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
                return;
            }

            const project = projectItem!.project!;

            // Demande de confirmation à l'utilisateur
            const confirmed = await this.confirmDeletion(project.name, project.brickContextIds.length);
            if (!confirmed) {
                return; // L'utilisateur a annulé
            }

            // Exécution de la suppression
            await this.executeDeletion(project, {
                projectService,
                brickService,
                treeDataProvider
            });

        } catch (error) {
            this.handleError('Erreur lors de la suppression du projet', error);
        }
    }

    /**
     * Helper: Vérifie si la sélection de projet est valide
     * 
     * @private
     * @param {ProjectTreeItem | undefined} projectItem - Élément de projet sélectionné
     * @returns {boolean} True si la sélection est valide, false sinon
     */
    private isValidProjectSelection(projectItem?: ProjectTreeItem): boolean {
        return !!projectItem && 
               projectItem instanceof ProjectTreeItem && 
               !!projectItem.project;
    }

    /**
     * Helper: Demande confirmation à l'utilisateur avant suppression
     * 
     * @private
     * @param {string} projectName - Nom du projet à supprimer
     * @param {number} brickCount - Nombre de briques associées
     * @returns {Promise<boolean>} True si l'utilisateur confirme, false sinon
     */
    private async confirmDeletion(projectName: string, brickCount: number): Promise<boolean> {
        const confirmation = await vscode.window.showWarningMessage(
            `Supprimer le projet "${projectName}" supprimera aussi ses ${brickCount} brique(s). Cette action est irréversible.`,
            { 
                modal: true,
                detail: 'Toutes les données associées seront définitivement perdues.'
            },
            'Supprimer Définitivement'
        );

        return confirmation === 'Supprimer Définitivement';
    }

    /**
     * Helper: Exécute la suppression du projet et de ses briques
     * 
     * @private
     * @param {any} project - Projet à supprimer
     * @param {Object} services - Services nécessaires pour la suppression
     * @param {ProjectService} services.projectService - Service de gestion des projets
     * @param {BrickService} services.brickService - Service de gestion des briques
     * @param {any} services.treeDataProvider - Fournisseur de données de l'arborescence
     * @returns {Promise<void>}
     */
    private async executeDeletion(
        project: any,
        services: {
            projectService: ProjectService;
            brickService: BrickService;
            treeDataProvider: any;
        }
    ): Promise<void> {
        const { projectService, brickService, treeDataProvider } = services;

        try {
            // 1. Suppression des briques associées
            await this.deleteProjectBricks(project, brickService);
            
            // 2. Suppression du projet
            await projectService.deleteProject(project.id);
            
            // 3. Feedback utilisateur
            this.showSuccess(`Projet "${project.name}" et ses briques ont été supprimés.`);
            
            // 4. Rafraîchissement de l'interface
            this.refreshTreeView(treeDataProvider);
            
        } catch (error) {
            // En cas d'erreur, on tente de rafraîchir l'interface malgré tout
            this.refreshTreeView(treeDataProvider);
            throw error; // On relance pour gestion par l'appelant
        }
    }

    /**
     * Helper: Supprime toutes les briques d'un projet
     * 
     * @private
     * @param {any} project - Projet contenant les briques à supprimer
     * @param {BrickService} brickService - Service de gestion des briques
     * @returns {Promise<void>}
     */
    private async deleteProjectBricks(project: any, brickService: BrickService): Promise<void> {
        const brickIds = [...project.brickContextIds]; // Copie pour itération sûre
        const errors: Array<{brickId: string; error: Error}> = [];
        
        // Suppression séquentielle pour gérer correctement les dépendances
        for (const brickId of brickIds) {
            try {
                await brickService.deleteBrick(brickId);
            } catch (brickError) {
                errors.push({
                    brickId,
                    error: brickError instanceof Error ? brickError : new Error(String(brickError))
                });
            }
        }
        
        // Journalisation des erreurs éventuelles
        if (errors.length > 0) {
            console.warn(`Des erreurs sont survenues lors de la suppression de ${errors.length} brique(s) sur ${brickIds.length}:`);
            errors.forEach(({brickId, error}) => {
                console.warn(`- Brique ${brickId}:`, error);
            });
            
            if (errors.length === brickIds.length) {
                throw new Error('Échec de la suppression de toutes les briques du projet');
            }
            
            // On continue malgré les erreurs partielles
            console.info(`Suppression partielle : ${brickIds.length - errors.length}/${brickIds.length} briques supprimées avec succès.`);
        }
    }

    /**
     * Helper: Rafraîchit la vue de l'arborescence
     * 
     * @private
     * @param {any} treeDataProvider - Fournisseur de données de l'arborescence
     */
    private refreshTreeView(treeDataProvider: any): void {
        try {
            if (treeDataProvider?.refresh) {
                treeDataProvider.refresh();
            }
        } catch (refreshError) {
            console.error('Erreur lors du rafraîchissement de l\'arborescence :', refreshError);
        }
    }

    /**
     * Helper: Affiche un message de succès
     * 
     * @private
     * @param {string} message - Message à afficher
     */
    private showSuccess(message: string): void {
        vscode.window.showInformationMessage(message, 'OK');
        console.log(`[DeleteProject] ${message}`);
    }

    /**
     * Helper: Affiche un message d'erreur
     * 
     * @private
     * @param {string} message - Message d'erreur
     */
    private showError(message: string): void {
        vscode.window.showErrorMessage(message);
        console.error(`[DeleteProject] ${message}`);
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
        
        console.error(`[DeleteProject] ${fullMessage}`, error);
        vscode.window.showErrorMessage(fullMessage, 'Voir les logs')
            .then(selection => {
                if (selection === 'Voir les logs') {
                    vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                }
            });
    }
}

// Export d'une instance unique de la commande pour utilisation dans le système de commandes
export default new DeleteProjectCommand();