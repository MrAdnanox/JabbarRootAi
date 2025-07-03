// apps/vscode-extension/src/commands/ActivateBrick.command.ts

/**
 * @file Commande pour activer une brique JabbarRoot
 * @module ActivateBrickCommand
 * @description Permet d'activer une brique pour la compilation du projet.
 * Une brique active sera incluse dans la compilation du projet parent.
 * @see {@link BrickService} pour la gestion des briques
 * @see {@link ProjectTreeDataProvider} pour la gestion de l'affichage
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';

/**
 * Commande pour activer une brique en vue de sa compilation
 * 
 * ## Fonctionnalités
 * - Active une brique pour la compilation du projet
 * - Met à jour l'interface utilisateur
 * - Gère les erreurs potentielles
 * 
 * ## Points d'attention
 * - Nécessite une brique valide en entrée
 * - Vérifie que la brique n'est pas déjà active
 * - Met à jour le contexte VSCode
 */
export class ActivateBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.ActivateBrick',
        title: 'Activer la brique pour la compilation',
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
     * Exécute la commande d'activation d'une brique
     * @param services - Conteneur d'injection de dépendances
     * @param brickItem - Élément d'arborescence de la brique à activer
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new ActivateBrickCommand();
     * await command.execute(services, brickItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;

        // Validation de l'entrée
        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            vscode.window.showWarningMessage(
                "Veuillez sélectionner une brique inactive pour l'activer."
            );
            return;
        }

        const brick = brickItem.brick;
        
        // Vérifier si la brique est déjà active
        if (brick.isActiveForProjectCompilation) {
            vscode.window.showInformationMessage(
                `La brique "${brick.name}" est déjà active pour la compilation.`
            );
            return;
        }

        try {
            // Mise à jour de l'état de la brique
            const updatedBrick = await brickService.updateBrick(
                brick.id,
                { isActiveForProjectCompilation: true }
            );
            
            if (updatedBrick) {
                // Mise à jour de l'interface utilisateur
                await vscode.commands.executeCommand(
                    'setContext',
                    'jabbarroot:selectedBrickIsActive',
                    true
                );
                
                // Rafraîchissement de l'affichage
                treeDataProvider.refresh();
                
                // Notification de succès
                vscode.window.showInformationMessage(
                    `Brique "${brick.name}" activée pour la compilation du projet.`
                );
                
                // Rafraîchir la vue du projet
                await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
            } else {
                throw new Error('La mise à jour de la brique a échoué');
            }
        } catch (error) {
            // Journalisation et affichage de l'erreur
            console.error(
                `Erreur lors de l'activation de la brique "${brick.name}":`,
                error
            );
            
            vscode.window.showErrorMessage(
                `Échec de l'activation : ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

export default new ActivateBrickCommand();
