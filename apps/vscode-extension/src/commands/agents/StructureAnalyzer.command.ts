// apps/vscode-extension/src/commands/brick/structureAnalyzer.command.ts

/**
 * @file Commande pour analyser la structure d'un projet JabbarRoot
 * @module StructureAnalyzerCommand
 * @description Permet d'analyser la structure d'un projet et de générer un rapport architectural.
 * Cette commande est essentielle pour la compréhension de l'architecture du projet.
 *
 * @see {@link AnalyzerService} - Service principal d'analyse de structure
 * @see {@link StructureGenerationService} - Génération de l'arborescence du projet
 * @see {@link ProjectService} - Gestion des projets JabbarRoot
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { AnalyzerService } from '@jabbarroot/prompt-factory';
import { 
  StructureGenerationService, 
  ProjectService, 
  JabbarProject
} from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';

/**
 * Commande d'analyse de structure de projet
 * 
 * ## Fonctionnalités
 * - Génère une arborescence complète du projet
 * - Analyse la structure et génère un rapport architectural
 * - Persiste les résultats pour une utilisation ultérieure
 * 
 * ## Points d'attention
 * - Nécessite une clé API Gemini valide
 * - Peut prendre du temps sur les grands projets
 * - Génère un rapport JSON détaillé
 */
export class StructureAnalyzerCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.brick.StructureAnalyzer',
        title: 'Analyser la structure du projet',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'analyzerService',
        'structureGenerationService',
        'ignoreService',
        'projectService',
        'extensionContext'
    ] as const;

    /**
     * Exécute la commande d'analyse de structure
     * @param services - Conteneur d'injection de dépendances
     * @param context - Contexte d'extension VSCode
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new StructureAnalyzerCommand();
     * await command.execute(services, context);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        ...args: any[]
    ): Promise<void> {
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        // Récupération des services
        const analyzerService = services.get('analyzerService') as AnalyzerService;
        const structureService = services.get('structureGenerationService') as StructureGenerationService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const projectService = services.get('projectService') as ProjectService;

        // Vérification de la clé API
        const apiKey = this.getApiKey();
        if (!apiKey) {
            vscode.window.showErrorMessage(
                'Clé API Gemini non configurée. Veuillez configurer votre clé dans les paramètres de l\'extension.'
            );
            return;
        }

        // Sélection du projet
        const project = await this.selectProject(projectService);
        if (!project) {
            return;
        }

        // Exécution de l'analyse avec suivi de progression
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Analyse de la structure du projet "${project.name}"`,
            cancellable: true
        }, async (progress) => {
            try {
                // Préparation des règles d'ignorance
                progress.report({ message: 'Préparation des règles d\'ignorance...' });
                const shouldIgnore = await ignoreService.createIgnorePredicate(project);
                
                // Génération de l'arborescence
                progress.report({ message: 'Analyse de la structure des fichiers...' });
                const treeReport = await structureService.generate(project.projectRootPath, {
                    maxDepth: 8, // TODO: Récupérer cette valeur depuis la configuration du projet
                    shouldIgnore: shouldIgnore
                });
                const fileTree = treeReport?.tree || '';

                // Analyse complète de la structure
                progress.report({ message: 'Génération du rapport architectural...' });
                const finalReport = await analyzerService.analyzeStructureAndPersist(
                    project, 
                    fileTree, 
                    apiKey
                );
                
                // Affichage des résultats
                progress.report({ message: 'Préparation des résultats...' });
                await this.displayResults(finalReport);
                
                // Rafraîchissement de la vue
                await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
                
                vscode.window.showInformationMessage(
                    'Analyse de structure terminée avec succès !',
                    'Voir le rapport'
                ).then(selection => {
                    if (selection === 'Voir le rapport') {
                        vscode.commands.executeCommand('workbench.action.quickOpen', '**/rapport-architectural.json');
                    }
                });
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[StructureAnalyzer] Erreur lors de l'analyse: ${errorMessage}`, error);
                vscode.window.showErrorMessage(
                    `Échec de l'analyse de structure: ${errorMessage}`,
                    'Voir les logs'
                ).then(selection => {
                    if (selection === 'Voir les logs') {
                        vscode.commands.executeCommand('workbench.action.output.show.extension-output-jabbarroot');
                    }
                });
                
                // Relancer l'erreur pour permettre une gestion supplémentaire si nécessaire
                throw error;
            }
        });
    }

    /**
     * Affiche les résultats de l'analyse dans un nouvel onglet
     * @private
     * @param report - Rapport d'analyse à afficher
     */
    private async displayResults(report: any): Promise<void> {
        try {
            const reportContent = JSON.stringify(report, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: reportContent,
                language: 'json',
                // TODO: Sauvegarder le rapport dans un fichier temporaire
                // language: 'json',
                // content: JSON.stringify(report, null, 2)
            });
            
            await vscode.window.showTextDocument(document, { 
                preview: false,
                viewColumn: vscode.ViewColumn.Beside
            });
        } catch (error) {
            console.error("Erreur lors de l'affichage des résultats:", error);
            throw error;
        }
    }

    /**
     * Récupère la clé API Gemini depuis la configuration VSCode
     * @private
     * @returns {string | undefined} La clé API si configurée, undefined sinon
     */
    private getApiKey(): string | undefined {
        return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
    }

    /**
     * Affiche un sélecteur de projet et retourne le choix de l'utilisateur
     * @private
     * @param projectService - Service de gestion des projets JabbarRoot
     * @returns {Promise<JabbarProject | undefined>} Le projet sélectionné ou undefined
     */
    private async selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
        try {
            const projects = await projectService.getAllProjects();
            if (projects.length === 0) {
                vscode.window.showWarningMessage('Aucun projet trouvé. Veuillez en créer un d\'abord.');
                return undefined;
            }
            
            if (projects.length === 1) {
                return projects[0];
            }
            
            const picked = await vscode.window.showQuickPick(
                projects.map(p => ({
                    label: p.name,
                    description: p.projectRootPath,
                    detail: `ID: ${p.id}`,
                    project: p
                })),
                { 
                    title: 'Sélectionnez le projet à analyser',
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: 'Rechercher un projet...'
                }
            );
            
            return picked?.project;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Erreur lors de la sélection du projet:', error);
            vscode.window.showErrorMessage(`Échec de la sélection du projet: ${errorMessage}`);
            return undefined;
        }
    }
}

export default new StructureAnalyzerCommand();