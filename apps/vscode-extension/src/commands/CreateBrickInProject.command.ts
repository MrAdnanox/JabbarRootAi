// apps/vscode-extension/src/commands/CreateBrick.command.ts

/**
 * @file Commande pour créer une nouvelle brique dans un projet JabbarRoot
 * @module CreateBrickCommand
 * @description Permet à l'utilisateur de créer une nouvelle brique dans un projet existant.
 * Une brique est un conteneur logique pour organiser le code et les ressources.
 * @see {@link BrickService} pour la gestion des briques
 * @see {@link ProjectService} pour la gestion des projets
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, BrickService } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';

/**
 * Commande pour créer une nouvelle brique dans un projet JabbarRoot
 * 
 * ## Fonctionnalités
 * - Affiche une liste des projets disponibles
 * - Demande un nom pour la nouvelle brique
 * - Crée la brique avec des paramètres par défaut
 * - Rafraîchit l'arborescence du projet
 * 
 * ## Points d'attention
 * - Vérifie qu'au moins un projet existe avant de proposer la création
 * - Valide le nom de la brique (non vide, pas de caractères spéciaux)
 * - Gère les erreurs et affiche des messages utilisateur appropriés
 */
export class CreateBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.CreateBrickInProject',
        title: 'Create Brick In Project',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'brickService',
        'treeDataProvider'
    ] as const;

    /**
     * Exécute la commande de création de brique
     * @param services - Conteneur d'injection de dépendances
     * @param projectItem - Élément d'arborescence du projet (optionnel)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new CreateBrickCommand();
     * await command.execute(services);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;

        let projectId: string | undefined;

        if (projectItem && projectItem.project) {
            projectId = projectItem.project.id;
        } else {
            // Récupérer la liste des projets disponibles
            const projects = await projectService.getAllProjects();
            if (projects.length === 0) {
                vscode.window.showErrorMessage('Aucun projet disponible. Veuillez d\'abord créer un projet.');
                return;
            }
            
            // Créer les éléments de sélection pour le menu déroulant
            const projectItems = projects.map(p => ({
                label: p.name, // Nom affiché dans la liste
                description: p.projectRootPath, // Chemin du projet en description
                project: p // Référence complète au projet
            }));
            
            const selected = await vscode.window.showQuickPick(projectItems, {
                placeHolder: 'Sélectionnez un projet pour la brique',
                ignoreFocusOut: true
            });
            
            if (selected) {
                projectId = selected.project.id;
            }
        }

        if (!projectId) {
            vscode.window.showWarningMessage('Aucun projet sélectionné.');
            return;
        }

        // Demander le nom de la brique à l'utilisateur
        const brickName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the new brick',
            placeHolder: 'my-new-brick',
            validateInput: value => {
                if (!value || value.trim().length === 0) {
                    return 'Brick name cannot be empty';
                }
                // Validation supplémentaire : vérifier les caractères autorisés
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Brick name can only contain letters, numbers, underscores and hyphens';
                }
                return undefined; // Validation réussie
            }
        });

        if (!brickName) return;

        try {
            // Créer la brique avec les paramètres obligatoires selon la signature de la méthode
            await brickService.createBrick(
                projectId, // projectId: string
                brickName, // name: string
                { // options: BrickContextOptions
                    compilationCompressionLevel: 'standard',
                    compilationIncludeProjectTree: false,
                    // La profondeur est gérée par les options du projet, pas de la brique
                    brickIgnorePatterns: [], // Patterns d'ignore spécifiques à la brique
                    special_sections: {} // Sections spéciales optionnelles
                },
                true // isActiveForProjectCompilation: boolean
            );
            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Brick "${brickName}" created successfully.`);
        } catch (error) {
            console.error(`Error creating brick:`, error);
            vscode.window.showErrorMessage(`Failed to create brick: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new CreateBrickCommand();
