// packages/prompt-factory/src/services/unitTestGenerator.service.ts
import * as path from 'path';
import * as vscode from 'vscode';
import { 
  BrickService, 
  FileContentService,
} from '@jabbarroot/core';
import { IFileSystem } from '@jabbarroot/types';
import { JabbarProject } from '@jabbarroot/types';

import { GenericAgentExecutor } from '../executors/GenericAgent.executor';

export class UnitTestGeneratorService {
  constructor(
    private readonly brickService: BrickService,
    private readonly fileContentService: FileContentService,
    private readonly fs: IFileSystem
  ) {}

  private async loadAgentPrompt(agentName: string, projectRoot: string): Promise<string> {
    const promptPath = path.join(projectRoot, '.jabbarroot', 'prompt-factory', 'agents', `${agentName}.agent.md`);
    try {
      const content = await this.fs.readFile(promptPath);
      return content;
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur Critique: Prompt pour l'agent "${agentName}" non trouvé à : ${promptPath}`);
      throw new Error(`Agent prompt for "${agentName}" not found.`);
    }
  }

  /**
   * Génère des tests unitaires pour le projet spécifié
   * @param project Le projet pour lequel générer les tests
   * @param apiKey Clé API pour l'agent d'IA
   * @returns Le contenu généré des tests unitaires
   */
  public async generateTests(project: JabbarProject, apiKey: string): Promise<string> {
    console.log('JabbLog [UnitTestGeneratorService]: Début de la génération des tests', { projectId: project.id });
    
    // 1. Charger le prompt système de l'Agent de test
    const systemPrompt = await this.loadAgentPrompt('unit-test-generator', project.projectRootPath);
    
    // 2. Obtenir le code source à tester (fichiers du projet)
    console.log('JabbLog [UnitTestGeneratorService]: Récupération des briques du projet...');
    const allBricks = await this.brickService.getBricksByProjectId(project.id);
    
    // 3. Préparer le contexte avec le code source
    const brickContextPromises = allBricks.map(async (brick: any) => {
      if (brick.files_scope.length === 0) {
        return `--- BRICK: ${brick.name} (Vide) ---`;
      }

      // Utiliser directement buildContentFromFiles pour la lecture et la compaction
      const brickContent = await this.fileContentService.buildContentFromFiles(
        brick.files_scope,
        project.projectRootPath,
        'standard' // Niveau de compression standard
      );

      return `--- BRICK: ${brick.name} ---\n${brickContent}\n--- END BRICK: ${brick.name} ---`;
    });

    const brickContexts = await Promise.all(brickContextPromises);
    const brickContext = brickContexts.join('\n\n');
    
    // 4. Construire le contexte utilisateur pour l'agent
    const userContext = `
PROJET: ${project.name}
CHEMIN: ${project.projectRootPath}

--- CODE SOURCE ---
${brickContext}
--- FIN DU CODE SOURCE ---

INSTRUCTIONS DE GÉNÉRATION DE TESTS:
1. Analyse le code source fourni
2. Identifie les composants à tester
3. Génère des tests unitaires complets pour chaque composant
4. Inclus des cas de test pour les cas limites et les erreurs
5. Utilise les bonnes pratiques de test (AAA, mocks, etc.)
6. Assure-toi que les tests sont isolés et reproductibles
7. Ajoute des commentaires explicatifs pour chaque test

FORMAT DE SORTIE:
- Un fichier de test par composant principal
- Nom du fichier: [nom-du-fichier].test.ts
- Structure de test claire et organisée
- Assertions précises et messages d'erreur explicites
`;

    // 5. Exécuter l'Agent
    console.log('JabbLog [UnitTestGeneratorService]: Invocation de GenericAgentExecutor...');
    try {
      const executor = new GenericAgentExecutor(apiKey);
      const testContent = await executor.execute(systemPrompt, userContext);
      console.log('JabbLog [UnitTestGeneratorService]: Tests unitaires générés avec succès.');
      return testContent;
    } catch (error) {
      console.error('JabbLog [UnitTestGeneratorService]: Erreur lors de la génération des tests.', error);
      vscode.window.showErrorMessage('Erreur lors de la génération des tests. Voir les logs pour plus de détails.');
      throw error; // Propage l'erreur pour que la commande puisse l'attraper
    }
  }
}
