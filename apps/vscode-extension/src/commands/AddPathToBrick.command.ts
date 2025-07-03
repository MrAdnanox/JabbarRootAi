// apps/vscode-extension/src/commands/AddPathToBrick.command.ts

/**
 * @file Commande pour ajouter un chemin à une brique JabbarRoot
 * @module AddPathToBrickCommand
 * @description Permet d'ajouter manuellement un chemin à une brique existante.
 * Gère la sélection du projet, de la brique cible et la validation du chemin.
 * @see {@link BrickService} pour la gestion des briques
 * @see {@link ProjectService} pour la gestion des projets
 * @see {@link IgnoreService} pour la gestion des règles d'ignore
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, BrickService, JabbarProject, BrickContext } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { IgnoreService } from '../services/ignore.service';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

/**
 * Commande pour ajouter un chemin à une brique existante
 * 
 * ## Fonctionnalités
 * - Permet de sélectionner un projet existant
 * - Liste les briques disponibles dans le projet
 * - Ajoute un chemin personnalisé à la brique sélectionnée
 * - Rafraîchit l'interface après l'ajout
 * 
 * ## Points d'attention
 * - Nécessite qu'au moins un projet existe
 * - La brique doit appartenir au projet sélectionné
 * - Le chemin doit être valide et accessible
 */
export class AddPathToBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.AddPathToBrick',
        title: 'Ajouter un chemin à une brique',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'brickService',
        'treeDataProvider',
        'ignoreService'
    ] as const;

    /**
     * Exécute la commande d'ajout de chemin à une brique
     * @param services - Conteneur d'injection de dépendances
     * @returns {Promise<void>}
     * 
     * @param {Map<keyof ServiceCollection, IService>} services - Conteneur de services injectés
     * @param {BrickTreeItem} [brickItem] - Élément de brique sélectionné (optionnel)
     * @returns {Promise<void>}
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const ignoreService = services.get('ignoreService') as IgnoreService;

        let targetBrick: BrickContext | undefined;

        try {
            // Si la commande est lancée depuis le menu contextuel, brickItem est fourni
            if (brickItem && brickItem.contextValue === 'jabbarrootBrick') {
                targetBrick = brickItem.brick;
            } else {
                // Sinon, on utilise le flux de sélection manuelle
                const projects = await projectService.getAllProjects();
                if (projects.length === 0) {
                    vscode.window.showWarningMessage('Aucun projet trouvé.');
                    return;
                }

                const project = await this.pickProject(projects);
                if (!project) return;

                const bricksInProject = await Promise.all(
                    project.brickContextIds.map(id => brickService.getBrick(id))
                );
                const validBricks = bricksInProject.filter((b): b is BrickContext => !!b);
                
                if (validBricks.length === 0) {
                    vscode.window.showWarningMessage('Aucune brique trouvée dans ce projet.');
                    return;
                }
                
                targetBrick = await this.pickBrick(validBricks);
            }

            if (!targetBrick) return; // Annulation par l'utilisateur

            const parentProject = await projectService.getProject(targetBrick.projectId);
            if (!parentProject) {
                throw new Error(`Projet parent (ID: ${targetBrick.projectId}) de la brique introuvable.`);
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('Aucun éditeur actif. Veuillez ouvrir un fichier pour en ajouter le chemin.');
                return;
            }

            const filePathAbsolute = activeEditor.document.uri.fsPath;
            const relativePath = vscode.workspace.asRelativePath(filePathAbsolute, false);

            const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, targetBrick);
            if (ignorePredicate(relativePath)) {
                vscode.window.showInformationMessage(`Chemin "${relativePath}" ignoré par les règles d'exclusion.`);
                return;
            }

            if (targetBrick.files_scope.includes(relativePath)) {
                vscode.window.showInformationMessage(`Chemin "${relativePath}" déjà présent dans la brique "${targetBrick.name}".`);
                return;
            }

            await brickService.addPathsToBrick(targetBrick.id, [relativePath]);
            treeDataProvider.refresh();
            
            vscode.window.showInformationMessage(
                `Chemin "${relativePath}" ajouté à la brique "${targetBrick.name}".`
            );
            
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
            
        } catch (error) {
            console.error(`Erreur lors de l'ajout du chemin à la brique:`, error);
            vscode.window.showErrorMessage(
                `Échec de l'ajout du chemin: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Affiche une liste déroulante pour sélectionner un projet
     * @private
     * @param {JabbarProject[]} projects - Liste des projets disponibles
     * @returns {Promise<JabbarProject | undefined>} Le projet sélectionné ou undefined si annulé
     */
    private async pickProject(projects: JabbarProject[]): Promise<JabbarProject | undefined> {
        if (projects.length === 1) {
            return projects[0];
        }
        
        interface ProjectQuickPickItem extends vscode.QuickPickItem {
            project: JabbarProject;
        }
        
        const items: ProjectQuickPickItem[] = projects.map(project => ({
            label: project.name,
            description: project.projectRootPath,
            project: project
        }));
        
        const picked = await vscode.window.showQuickPick(items, {
            title: 'Sélectionnez un projet'
        });
        
        return picked?.project;
    }

    /**
     * Affiche une liste déroulante pour sélectionner une brique
     * @private
     * @param {BrickContext[]} bricks - Liste des briques disponibles
     * @returns {Promise<BrickContext | undefined>} La brique sélectionnée ou undefined si annulé
     */
    private async pickBrick(bricks: BrickContext[]): Promise<BrickContext | undefined> {
        if (bricks.length === 1) {
            return bricks[0];
        }
        
        interface BrickQuickPickItem extends vscode.QuickPickItem {
            brick: BrickContext;
        }
        
        const items: BrickQuickPickItem[] = bricks.map(brick => ({
            label: brick.name,
            description: brick.id,
            brick: brick
        }));
        
        const picked = await vscode.window.showQuickPick(items, {
            title: 'Sélectionnez une brique'
        });
        
        return picked?.brick;
    }
}

export default new AddPathToBrickCommand();
