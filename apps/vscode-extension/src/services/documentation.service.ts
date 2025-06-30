// apps/vscode-extension/src/services/documentation.service.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { 
  ProjectService, 
  BrickService, 
  StatisticsService, 
  JabbarProject,
  FileContentService,
  CompactionInput
} from '@jabbarroot/core';
import { GenericAgentExecutor } from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { IgnoreService } from './ignore.service';

export class DocumentationService {
  private fs: VscodeFileSystemAdapter;

  // Le constructeur est propre et déclare toutes ses dépendances.
  constructor(
    private readonly projectService: ProjectService,
    private readonly brickService: BrickService,
    private readonly statisticsService: StatisticsService,
    private readonly ignoreService: IgnoreService,
    private readonly fileContentService: FileContentService
  ) {
    this.fs = new VscodeFileSystemAdapter();
  }

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

  // Helper pour lire un document de manière robuste
  private async readProjectDocument(projectRoot: string, docName: string): Promise<string> {
    const docPath = path.join(projectRoot, docName);
    try {
      return await this.fs.readFile(docPath);
    } catch {
      return `[Document ${docName} non trouvé]`;
    }
  }

  public async generateReadme(project: JabbarProject, apiKey: string): Promise<string> {
    console.log('JabbLog [DocumentationService]: Début de generateReadme v2 (contexte riche)', { projectId: project.id });
    
    // 1. Charger le prompt système de l'Agent
    const systemPrompt = await this.loadAgentPrompt('jabbar-doc', project.projectRootPath);
    
    // 2. Assembler le contexte riche avec compaction
    console.log('JabbLog [DocumentationService]: Assemblage du contexte des Briques...');
    const allBricks = await this.brickService.getBricksByProjectId(project.id);
    
    const brickContextPromises = allBricks.map(async (brick) => {
      if (brick.files_scope.length === 0) {
        return `--- BRICK: ${brick.name} (Vide) ---`;
      }

      // Utiliser directement buildContentFromFiles qui gère la lecture et la compaction
      const brickContent = await this.fileContentService.buildContentFromFiles(
        brick.files_scope,
        project.projectRootPath,
        'standard' // Niveau de compression standard
      );

      return `--- BRICK: ${brick.name} ---\n${brickContent}\n--- END BRICK: ${brick.name} ---`;
    });

    const brickContexts = await Promise.all(brickContextPromises);
    const brickContext = brickContexts.join('\n\n');
    
    console.log('JabbLog [DocumentationService]: Lecture des documents de support...');
    const roadmapContent = await this.readProjectDocument(project.projectRootPath, 'JABBARROOT_ROADMAP_V2.md');
    const architectureContent = await this.readProjectDocument(project.projectRootPath, 'docs/architecture.md');
    
    const userContext = `
CONTEXTE DU PROJET JABBARROOT:

${brickContext}

--- DOCUMENT: JABBARROOT_ROADMAP_V2.md ---
${roadmapContent}

--- DOCUMENT: docs/architecture.md ---
${architectureContent}
---
REQUÊTE:
En te basant EXCLUSIVEMENT sur le contexte fourni ci-dessus, génère le contenu intégral d'un fichier README.md pour l'extension VS Code JabbarRoot.
Le niveau requis est "Ambassadeur". Assure-toi de suivre toutes tes instructions et tous tes postulats fondateurs.
Le README doit être complet, professionnel et prêt à être publié, en suivant le template standard de l'industrie pour une extension VS Code.
`;

    // 3. Exécuter l'Agent
    console.log('JabbLog [DocumentationService]: Invocation de GenericAgentExecutor...');
    try {
      const executor = new GenericAgentExecutor(apiKey);
      const readmeContent = await executor.execute(systemPrompt, userContext);
      console.log('JabbLog [DocumentationService]: Contenu du README généré avec succès.');
      return readmeContent;
    } catch (error) {
      console.error('JabbLog [DocumentationService]: Erreur lors de l\'exécution de l\'agent.', error);
      vscode.window.showErrorMessage('Erreur lors de la génération du README. Voir les logs pour plus de détails.');
      throw error; // Propage l'erreur pour que la commande puisse l'attraper
    }
  }
}