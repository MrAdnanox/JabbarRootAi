// apps/vscode-extension/src/commands/doc/generateReadme.command.ts

/**
 * @file Commande pour générer un README pour un projet JabbarRoot
 * @module GenerateReadmeCommand
 * @description Permet de générer un fichier README.md complet basé sur :
 * - L'analyse structurelle du projet
 * - Les métadonnées du projet
 * - L'API Gemini pour la génération de contenu
 *
 * @see {@link DocumentationService} - Service principal de génération de documentation
 * @see {@link AnalyzerService} - Analyse la structure du projet
 * @see {@link ProjectService} - Gestion des projets JabbarRoot
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { DocumentationService, AnalyzerService } from '@jabbarroot/prompt-factory';

/**
 * Commande pour générer un fichier README pour un projet JabbarRoot
 * 
 * ## Fonctionnalités
 * - Génération automatisée de README basée sur l'analyse structurelle
 * - Intégration avec l'API Gemini pour le contenu généré
 * - Interface utilisateur avec suivi de progression
 * 
 * ## Flux d'exécution
 * 1. Vérification de la configuration (API Gemini)
 * 2. Sélection du projet cible
 * 3. Vérification du rapport architectural
 * 4. Génération du contenu
 * 5. Écriture du fichier README.md
 */
export class GenerateReadmeCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.doc.GenerateReadme',
        title: 'Générer un README',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'documentationService',
        'analyzerService',
        'extensionContext'
    ] as const;

    /**
     * Exécute la commande de génération de README
     * @param services - Conteneur d'injection de dépendances
     * @param args - Arguments optionnels (non utilisés dans cette implémentation)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new GenerateReadmeCommand();
     * await command.execute(services);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        ...args: any[]
    ): Promise<void> {
        // Récupération du contexte depuis les services
        const context = services.get('extensionContext') as vscode.ExtensionContext;
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Génération du README en cours...",
            cancellable: true
        }, async (progress) => {
            try {
                // Récupération des services
                const projectService = services.get('projectService') as ProjectService;
                const documentationService = services.get('documentationService') as DocumentationService;
                const analyzerService = services.get('analyzerService') as AnalyzerService;

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
                if (!project) return;

                // Vérification du rapport architectural
                progress.report({ message: 'Vérification du rapport architectural...' });
                const hasReport = await this.ensureArchitecturalReportExists(project, analyzerService);
                if (!hasReport) {
                    vscode.window.showInformationMessage('Génération du README annulée : rapport architectural requis');
                    return;
                }

                // Génération du README
                progress.report({ message: 'Génération du contenu...' });
                const readmeContent = await documentationService.generateReadme(project, apiKey);

                // Écriture du fichier
                progress.report({ message: 'Écriture du fichier...' });
                const readmePath = vscode.Uri.joinPath(
                    vscode.Uri.file(project.projectRootPath),
                    'README.md'
                );
                await vscode.workspace.fs.writeFile(
                    readmePath,
                    Buffer.from(readmeContent, 'utf8')
                );

                // Confirmation et ouverture du fichier
                vscode.window.showInformationMessage(
                    'README généré avec succès !',
                    'Ouvrir le fichier'
                ).then(selection => {
                    if (selection === 'Ouvrir le fichier') {
                        vscode.workspace.openTextDocument(readmePath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                vscode.window.showErrorMessage(`Erreur lors de la génération du README: ${errorMessage}`);
                throw error;
            }
        });
    }

    /**
     * Vérifie et génère si nécessaire le rapport architectural
     * @private
     * @param project - Projet JabbarRoot à analyser
     * @param analyzerService - Service d'analyse de structure
     * @returns {Promise<boolean>} true si le rapport est disponible, false si l'utilisateur annule
     */
    private async ensureArchitecturalReportExists(
        project: JabbarProject,
        analyzerService: AnalyzerService
    ): Promise<boolean> {
        const artefactBrick = await analyzerService.findArtefactBrick(project);
        if (!artefactBrick) {
            const response = await vscode.window.showWarningMessage(
                `Le rapport architectural pour le projet "${project.name}" est introuvable.`,
                { modal: true },
                "Analyser la structure maintenant"
            );
            if (response === "Analyser la structure maintenant") {
                await vscode.commands.executeCommand('jabbarroot.brick.structureAnalyzer');
                const newArtefactBrick = await analyzerService.findArtefactBrick(project);
                return !!newArtefactBrick;
            }
            return false;
        }
        return true;
    }

    /**
     * Affiche un sélecteur de projet et retourne le choix de l'utilisateur
     * @private
     * @param projectService - Service de gestion des projets JabbarRoot
     * @returns {Promise<JabbarProject | undefined>} Le projet sélectionné ou undefined
     */
    private async selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
        const projects = await projectService.getAllProjects();
        if (projects.length === 0) {
            vscode.window.showWarningMessage('Aucun projet trouvé. Veuillez en créer un d\'abord.');
            return undefined;
        }
        if (projects.length === 1) {
            return projects[0];
        }
        const picked = await vscode.window.showQuickPick(
            projects.map((p: JabbarProject) => ({
                label: p.name,
                description: p.projectRootPath,
                project: p
            })),
            { 
                title: 'Sélectionnez le projet pour générer le README',
                matchOnDescription: true,
                matchOnDetail: true
            }
        ) as { label: string; description: string; project: JabbarProject } | undefined;
        
        return picked?.project;
    }

    /**
     * Récupère la clé API Gemini depuis la configuration VSCode
     * @private
     * @returns {string | undefined} La clé API si configurée, undefined sinon
     */
    private getApiKey(): string | undefined {
        return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
    }
}

export default new GenerateReadmeCommand();