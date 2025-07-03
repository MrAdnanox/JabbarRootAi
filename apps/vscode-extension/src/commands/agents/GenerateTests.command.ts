/**
 * @file Commande pour générer des tests unitaires
 * @module GenerateTestsCommand
 * @description Permet de générer des tests unitaires pour un projet JabbarRoot
 * en utilisant le service UnitTestGeneratorService et l'API Gemini.
 * @see {@link UnitTestGeneratorService} pour la logique de génération des tests
 * @see {@link ProjectService} pour la gestion des projets
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { UnitTestGeneratorService } from '@jabbarroot/prompt-factory';

/**
 * Helper: Affiche une interface pour sélectionner un projet parmi ceux disponibles
 * 
 * @param projectService - Service de gestion des projets
 * @returns {Promise<JabbarProject | undefined>} Le projet sélectionné ou undefined
 * 
 * @example
 * ```typescript
 * // Helper: Sélectionne un projet dans une liste
 * const project = await selectProject(projectService);
 * if (project) {
 *   // Faire quelque chose avec le projet
 * }
 * ```
 */
async function selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
  const projects = await projectService.getAllProjects();
  if (projects.length === 0) {
    vscode.window.showWarningMessage('JabbarRoot: Aucun projet trouvé. Veuillez en créer un d\'abord.');
    return undefined;
  }
  if (projects.length === 1) {
    return projects[0];
  }

  const picked = await vscode.window.showQuickPick(
    projects.map(p => ({ label: p.name, description: p.projectRootPath, project: p })),
    { title: 'Sélectionnez le projet pour générer les tests unitaires' }
  );
  return picked?.project;
}

/**
 * Helper: Récupère la clé API Gemini depuis la configuration VSCode
 * 
 * @returns {string | undefined} La clé API ou undefined si non configurée
 * 
 * @example
 * ```typescript
 * // Helper: Récupère la clé API de configuration
 * const apiKey = getApiKey();
 * if (!apiKey) {
 *   vscode.window.showErrorMessage('Clé API non configurée');
 *   return;
 * }
 * ```
 */
function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

/**
 * Commande pour générer des tests unitaires pour un projet
 * 
 * ## Fonctionnalités
 * - Génère des tests unitaires pour un projet sélectionné
 * - Utilise l'API Gemini pour la génération des tests
 * - Affiche les résultats dans un nouvel onglet
 * 
 * ## Points d'attention
 * - Nécessite une clé API Gemini valide
 * - Peut prendre du temps pour les gros projets
 * - Nécessite une connexion Internet
 */
export class GenerateTestsCommand implements ICommandModule {
  /**
   * Métadonnées de la commande
   * @property {string} id - Identifiant unique de la commande
   * @property {string} title - Titre affiché dans l'interface
   * @property {string} category - Catégorie de la commande
   */
  public readonly metadata = {
    id: 'jabbarroot.test.GenerateTests',
    title: 'Générer des tests unitaires',
    category: 'jabbarroot' as const,
  };

  /**
   * Dépendances requises par la commande
   * @readonly
   */
  public readonly dependencies = [
    'projectService',
    'unitTestGeneratorService'
  ] as const;

  /**
   * Helper: Vérifie et récupère la clé API Gemini
   * @returns {Promise<string | undefined>} La clé API si valide, undefined sinon
   * 
   * @example
   * ```typescript
   * const apiKey = await this.verifyAndGetApiKey();
   * if (!apiKey) return;
   * ```
   */
  private async verifyAndGetApiKey(): Promise<string | undefined> {
    const apiKey = getApiKey();
    if (!apiKey) {
      const action = await vscode.window.showErrorMessage(
        'Clé API Gemini non configurée.',
        'Ouvrir les paramètres'
      );
      
      if (action === 'Ouvrir les paramètres') {
        await vscode.commands.executeCommand(
          'workbench.action.openSettings', 
          'jabbarroot.gemini.apiKey'
        );
      }
      return undefined;
    }
    return apiKey;
  }

  /**
   * Exécute la commande de génération de tests
   * @param services - Conteneur d'injection de dépendances
   * @param context - Contexte d'extension VSCode
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * const command = new GenerateTestsCommand();
   * await command.execute(services, context);
   * ```
   */
  public async execute(
    services: Map<keyof ServiceCollection, IService>,
    context: vscode.ExtensionContext
  ): Promise<void> {
    const projectService = services.get('projectService') as ProjectService;
    const testGenerator = services.get('unitTestGeneratorService') as UnitTestGeneratorService;
    console.log('JabbLog [generateTests]: Commande appelée');
    
    // Helper: Vérification et récupération de la clé API avec gestion d'erreur
    const apiKey = await this.verifyAndGetApiKey();
    if (!apiKey) return; // L'erreur a déjà été gérée par le helper
    
    console.log('JabbLog [generateTests]: Sélection du projet...');
    const project = await selectProject(projectService);
    if (!project) return;
    
    console.log('JabbLog: Projet sélectionné pour génération de tests', { projectId: project.id });

    console.log('JabbLog: Démarrage de la génération des tests...');
    // Affichage de la barre de progression
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarTest: Génération des tests unitaires pour "${project.name}"`,
      cancellable: true
    }, async (progress, token) => {
      // Gestion de l'annulation
      token.onCancellationRequested(() => {
        console.log('JabbLog [generateTests]: Génération annulée par l\'utilisateur');
        throw new Error('Génération annulée par l\'utilisateur');
      });
      try {
        // Étape 1: Analyse du code source
        progress.report({ message: '🔍 Analyse du code source...', increment: 10 });
        
        // Étape 2: Génération des tests
        progress.report({ message: '⚙️  Génération des tests avec Gemini...', increment: 20 });
        const testContent = await testGenerator.generateTests(project, apiKey);

        // Vérification du contenu généré
        if (!testContent || testContent.trim().length === 0) {
          throw new Error('Aucun test généré. Le résultat est vide.');
        }

        // Étape 3: Affichage des résultats
        progress.report({ message: '📝 Préparation des résultats...', increment: 20 });
        
        // Détection automatique du langage basée sur l'extension du projet
        const language = project.projectRootPath.endsWith('.js') ? 'javascript' : 'typescript';
        
        const document = await vscode.workspace.openTextDocument({
          content: testContent,
          language: language
        });
        
        // Ouverture du document à côté de l'éditeur actuel
        await vscode.window.showTextDocument(document, { 
          preview: false, 
          viewColumn: vscode.ViewColumn.Beside,
          preserveFocus: true
        });
        
        // Notification de succès avec action rapide
        const action = await vscode.window.showInformationMessage(
          `Tests unitaires pour "${project.name}" générés avec succès !`,
          'Ouvrir le dossier des tests'
        );
        
        // Action supplémentaire si demandée
        if (action === 'Ouvrir le dossier des tests') {
          // Implémentation de l'ouverture du dossier des tests
          // (à adapter selon la structure de votre projet)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Journalisation détaillée
        console.error('JabbLog [generateTests]: Erreur lors de la génération', { 
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Affichage d'un message d'erreur clair
        if (errorMessage.includes('API key')) {
          vscode.window.showErrorMessage(
            'Erreur d\'authentification API. Vérifiez votre clé API Gemini dans les paramètres.',
            'Ouvrir les paramètres'
          ).then(selection => {
            if (selection === 'Ouvrir les paramètres') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'jabbarroot.gemini.apiKey');
            }
          });
        } else {
          vscode.window.showErrorMessage(`Erreur lors de la génération des tests: ${errorMessage}`);
        }
        
        // Relancer l'erreur pour permettre une gestion supplémentaire si nécessaire
        throw error;
      }
    });
  }
}

export default new GenerateTestsCommand();
