// apps/vscode-extension/src/commands/CreateProject.command.ts
/**
 * @file Commande de création d'un nouveau projet JabbarRoot
 * @module CreateProjectCommand
 * @description Gère la création d'un nouveau projet et l'initialisation des briques système.
 * Cette commande est essentielle pour démarrer un nouvel espace de travail JabbarRoot.
 * 
 * @see {@link ProjectService} - Service de gestion des projets
 * @see {@link SystemBrickManager} - Gestionnaire des briques système
 * @see {@link ProjectTreeDataProvider} - Fournisseur de données pour l'arborescence
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, SystemBrickManager } from '@jabbarroot/core';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';

/**
 * Commande de création d'un nouveau projet JabbarRoot
 * 
 * ## Fonctionnalités
 * - Demande interactive du nom et du chemin du projet
 * - Création d'un nouveau projet via ProjectService
 * - Initialisation automatique des briques système requises
 * - Mise à jour de l'interface utilisateur
 * 
 * ## Points d'attention
 * - Nécessite des permissions d'écriture sur le système de fichiers
 * - Crée une structure de projet complète avec les dossiers de base
 * - Initialise les briques système nécessaires au bon fonctionnement
 * 
 * @implements {ICommandModule}
 */
export class CreateProjectCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.CreateProject',
        title: 'Create Project',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     * @type {Array<keyof ServiceCollection>}
     */
    public readonly dependencies = [
        'projectService',      // Service pour la gestion des projets
        'treeDataProvider',    // Fournisseur de données pour l'arborescence
        'systemBrickManager',  // Gestionnaire des briques système
        'extensionContext'     // Contexte d'extension VSCode
    ] as const;

    /**
     * Point d'entrée de la commande.
     * 
     * @param services Map des services disponibles injectés par le conteneur de dépendances
     * @param context Contexte d'extension VSCode
     */
    public async execute(services: Map<keyof ServiceCollection, IService>, ...args: any[]): Promise<void> {
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        // Récupération des services nécessaires
        const projectService = services.get('projectService') as ProjectService;
        const treeDataProvider = services.get('treeDataProvider') as ProjectTreeDataProvider;
        const systemBrickManager = services.get('systemBrickManager') as SystemBrickManager;

        // 1. Demander le nom du projet à l'utilisateur
        const projectName = await vscode.window.showInputBox({ 
            prompt: 'Entrez le nom du nouveau projet',
            placeHolder: 'MonProjetJabbarRoot'
        });
        if (!projectName) {
            // L'utilisateur a annulé la saisie
            return;
        }

        // 2. Demander le chemin racine du projet
        const projectRootPath = await vscode.window.showInputBox({ 
            prompt: 'Entrez le chemin racine du nouveau projet',
            placeHolder: '/chemin/vers/le/projet'
        });
        if (!projectRootPath) {
            // L'utilisateur a annulé la saisie
            return;
        }

        try {
            // Créer le nouveau projet
            const newProject = await projectService.createProject(projectName, projectRootPath);
            
            // S'assurer que les briques système sont créées pour le nouveau projet
            await systemBrickManager.ensureSystemBricksExist(newProject);
            
            // Rafraîchir l'arborescence
            if (treeDataProvider && typeof treeDataProvider.refresh === 'function') {
                treeDataProvider.refresh();
            }
            
            // Afficher un message de succès
            vscode.window.showInformationMessage(
                `Project "${projectName}" created successfully.`,
                'OK'
            );
        } catch (error) {
            // Journalisation de l'erreur
            console.error(`[CreateProject] Error creating project:`, error);
            
            // Message d'erreur clair pour l'utilisateur
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(
                `Failed to create project: ${errorMessage}`,
                'OK'
            );
            
            // Tenter de rafraîchir l'interface malgré l'erreur
            try {
                if (treeDataProvider && typeof treeDataProvider.refresh === 'function') {
                    treeDataProvider.refresh();
                }
            } catch (refreshError) {
                console.error('[CreateProject] Error refreshing tree view:', refreshError);
            }
        }
    }
}

export default new CreateProjectCommand();
