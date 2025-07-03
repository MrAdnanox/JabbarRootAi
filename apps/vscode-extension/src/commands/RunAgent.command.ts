// apps/vscode-extension/src/commands/RunAgent.command.ts
/**
 * @file Commande pour exécuter un agent cognitif sur un projet
 * @module RunAgentCommand
 * @description Permet de sélectionner et d'exécuter un agent cognitif prédéfini
 * sur un projet spécifique. Gère le chargement du manifeste des agents,
 * la sélection de l'agent et du projet cible, et l'exécution du workflow associé.
 * 
 * @see {@link GenericWorkflowEngine} - Moteur d'exécution des workflows
 * @see {@link ProjectService} - Service de gestion des projets
 * @see {@link AgentDefinition} - Définition des agents
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { AgentDefinition } from '@jabbarroot/prompt-factory/dist/types/agent.types';
import { GenericWorkflowEngine } from '@jabbarroot/prompt-factory/dist/services/GenericWorkflowEngine.service';

/**
 * Commande pour exécuter un agent cognitif sur un projet
 * 
 * ## Fonctionnalités
 * - Charge le manifeste des agents disponibles
 * - Permet de sélectionner un agent dans une liste
 * - Permet de sélectionner un projet cible
 * - Exécute l'agent sélectionné sur le projet choisi
 * 
 * ## Prérequis
 * - Clé API Gemini configurée
 * - Au moins un projet existant
 * - Fichier manifeste des agents valide
 */
export class RunAgentCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.RunAgent',
        title: 'Exécuter un agent',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'genericWorkflowEngine'
    ] as const;

    /**
     * Exécute la commande RunAgent
     * @param services - Conteneur d'injection de dépendances
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new RunAgentCommand();
     * await command.execute(services);
     * ```
     */
    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        try {
            // Récupération des services
            const [projectService, genericWorkflowEngine] = this.getRequiredServices(services);
            
            // Vérification des prérequis
            const apiKey = this.verifyApiKey();
            if (!apiKey) return;

            // Chargement des définitions d'agents
            const agentDefs = await this.loadAgentDefinitions();
            if (!agentDefs.length) return;

            // Sélection de l'agent
            const pickedAgent = await this.pickAgent(agentDefs);
            if (!pickedAgent) return;

            // Sélection du projet
            const selectedProject = await this.pickProject(projectService);
            if (!selectedProject) return;

            // Exécution de l'agent
            await this.executeAgent(
                genericWorkflowEngine,
                pickedAgent,
                selectedProject,
                apiKey
            );
        } catch (error) {
            this.handleError('Erreur lors de l\'exécution de la commande RunAgent', error);
        }
    }

    /**
     * Helper: Récupère les services requis depuis le conteneur d'injection de dépendances
     * 
     * @private
     * @param services - Conteneur de services
     * @returns Tuple contenant [ProjectService, GenericWorkflowEngine]
     * 
     * @throws {Error} Si un service requis n'est pas disponible
     */
    private getRequiredServices(services: Map<keyof ServiceCollection, IService>): [ProjectService, GenericWorkflowEngine] {
        const projectService = services.get('projectService');
        const genericWorkflowEngine = services.get('genericWorkflowEngine');

        if (!projectService || !genericWorkflowEngine) {
            throw new Error('Services requis non disponibles');
        }

        return [
            projectService as ProjectService,
            genericWorkflowEngine as GenericWorkflowEngine
        ];
    }

    /**
     * Helper: Vérifie que la clé API Gemini est correctement configurée
     * 
     * @private
     * @returns La clé API si elle est configurée, undefined sinon
     * 
     * @description
     * Vérifie la présence de la clé API dans la configuration VSCode.
     * Affiche un message d'erreur si la clé est manquante.
     */
    private verifyApiKey(): string | undefined {
        const config = vscode.workspace.getConfiguration('jabbarroot');
        const apiKey = config.get<string>('gemini.apiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage(
                'Clé API Gemini non configurée. ' +
                'Veuillez configurer "jabbarroot.gemini.apiKey" dans les paramètres.'
            );
            return undefined;
        }

        return apiKey;
    }

    /**
     * Helper: Charge les définitions d'agents depuis le manifeste
     * 
     * @private
     * @returns {Promise<AgentDefinition[]>} Tableau des définitions d'agents
     * 
     * @description
     * Charge le fichier manifest.json depuis le dossier système des agents.
     * Le chemin est construit de manière dynamique en fonction du workspace ouvert.
     * 
     * @throws {Error} Si le dossier de travail n'est pas ouvert ou si le format du manifeste est invalide
     */
    private async loadAgentDefinitions(): Promise<AgentDefinition[]> {
        try {
            const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!projectRootPath) {
                throw new Error('Aucun dossier de travail ouvert');
            }
            
            const manifestPath = path.join(
                projectRootPath,
                '.jabbarroot',
                '.jabbarroot_data',
                'system',
                'agents',
                'manifest.json'
            );
            
            const fsAdapter = new VscodeFileSystemAdapter();
            const manifestContent = await fsAdapter.readFile(manifestPath);
            const manifest = JSON.parse(manifestContent);
            
            if (!Array.isArray(manifest?.agents)) {
                throw new Error('Format de manifeste invalide');
            }
            
            return manifest.agents as AgentDefinition[];
        } catch (error) {
            this.handleError(
                'Impossible de charger le manifeste des agents. ' +
                'Vérifiez le fichier .jabbarroot/.jabbarroot_data/system/agents/manifest.json',
                error
            );
            return [];
        }
    }

    /**
     * Helper: Affiche une boîte de dialogue pour sélectionner un agent
     * 
     * @private
     * @param {AgentDefinition[]} agentDefs - Définitions des agents disponibles
     * @returns {Promise<{id: string, label: string} | undefined>} L'agent sélectionné ou undefined
     * 
     * @description
     * Affiche un sélecteur VSCode avec la liste des agents disponibles.
     * Permet la recherche via le label, la description ou l'ID de l'agent.
     */
    private async pickAgent(agentDefs: AgentDefinition[]) {
        const items = agentDefs.map(agent => ({
            label: agent.label,
            description: agent.description,
            detail: agent.id,
            id: agent.id
        }));

        return vscode.window.showQuickPick(items, {
            title: 'Sélectionnez un agent à exécuter',
            placeHolder: 'Recherchez un agent...',
            matchOnDescription: true,
            matchOnDetail: true
        });
    }

    /**
     * Helper: Affiche une boîte de dialogue pour sélectionner un projet cible
     * 
     * @private
     * @param {ProjectService} projectService - Service de gestion des projets
     * @returns {Promise<JabbarProject | undefined>} Le projet sélectionné ou undefined
     * 
     * @description
     * Récupère la liste des projets disponibles et affiche un sélecteur VSCode.
     * Affiche un avertissement si aucun projet n'est disponible.
     */
    private async pickProject(projectService: ProjectService) {
        const projects = await projectService.getAllProjects();
        
        if (!projects?.length) {
            vscode.window.showWarningMessage('Aucun projet trouvé. Veuillez d\'abord créer un projet.');
            return undefined;
        }

        const items = projects.map(project => ({
            label: project.name,
            description: project.projectRootPath,
            detail: '',
            project
        }));

        return vscode.window.showQuickPick(items, {
            title: 'Sélectionnez le projet cible',
            placeHolder: 'Recherchez un projet...',
            matchOnDescription: true,
            matchOnDetail: true
        }).then(selection => selection?.project);
    }

    /**
     * Helper: Exécute un agent sur un projet spécifique
     * 
     * @private
     * @param {GenericWorkflowEngine} engine - Moteur d'exécution des workflows
     * @param {{id: string, label: string}} agent - Agent à exécuter
     * @param {JabbarProject} project - Projet cible
     * @param {string} apiKey - Clé API Gemini
     * @returns {Promise<void>}
     * 
     * @description
     * Gère l'exécution asynchrone d'un agent avec affichage de la progression.
     * Affiche une notification de succès ou d'échec selon le résultat.
     */
    private async executeAgent(
        engine: GenericWorkflowEngine,
        agent: { id: string; label: string },
        project: JabbarProject,
        apiKey: string
    ): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exécution de "${agent.label}" sur ${project.name}...`,
            cancellable: false
        }, async () => {
            try {
                await engine.executeAgent(agent.id, project, apiKey);
                this.showSuccess(
                    `Agent "${agent.label}" exécuté avec succès`,
                    `sur le projet ${project.name}.`
                );
            } catch (error) {
                this.handleError(
                    `Échec de l'exécution de l'agent "${agent.label}"`,
                    error
                );
                throw error; // Propage l'erreur pour l'affichage dans la barre de progression
            }
        });
    }

    /**
     * Helper: Affiche un message de succès à l'utilisateur
     * 
     * @private
     * @param {string} message - Message principal à afficher
     * @param {string} [details] - Détails supplémentaires optionnels
     * 
     * @description
     * Affiche un message d'information à l'utilisateur via l'interface VSCode
     * et enregistre le message dans la console de débogage.
     */
    private showSuccess(message: string, details?: string): void {
        vscode.window.showInformationMessage(
            `JabbarRoot: ${message} ${details || ''}`.trim()
        );
        console.log(`[RunAgent] ${message}`, details || '');
    }

    /**
     * Helper: Gère les erreurs de manière centralisée
     * 
     * @private
     * @param {string} message - Message d'erreur descriptif
     * @param {unknown} error - Erreur survenue (peut être de type Error ou autre)
     * 
     * @description
     * Affiche un message d'erreur à l'utilisateur via l'interface VSCode,
     * enregistre l'erreur dans la console, et propose d'afficher les logs complets.
     * Gère à la fois les objets Error et les autres types d'erreurs.
     */
    private handleError(message: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullMessage = `${message}: ${errorMessage}`;
        
        console.error(`[RunAgent] ${fullMessage}`, error);
        vscode.window.showErrorMessage(
            `JabbarRoot: ${fullMessage}`,
            'Voir les logs'
        ).then(selection => {
            if (selection === 'Voir les logs') {
                vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
            }
        });
    }
}

// Export d'une instance unique de la commande
export default new RunAgentCommand();
