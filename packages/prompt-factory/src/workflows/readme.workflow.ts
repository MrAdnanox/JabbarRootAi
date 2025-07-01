import { JabbarProject, BrickService, FileContentService } from '@jabbarroot/core';
import { IFileSystem } from '@jabbarroot/types';
import { GenericAgentExecutor } from '../executors/GenericAgent.executor';
import { PromptTemplateService } from '../services/PromptTemplate.service';
import * as path from 'path';

// Contexte requis par ce workflow pour s'exécuter
export interface ReadmeWorkflowContext {
  project: JabbarProject;
  apiKey: string;
}

export class ReadmeWorkflow {
  private templateService: PromptTemplateService;

  constructor(
    private readonly brickService: BrickService,
    private readonly fileContentService: FileContentService,
    private readonly fs: IFileSystem,
  ) {
    this.templateService = new PromptTemplateService(fs);
  }

  private async readProjectDocument(projectRoot: string, docName: string): Promise<string> {
    const docPath = path.join(projectRoot, docName);
    try {
      return await this.fs.readFile(docPath);
    } catch {
      return `[Document ${docName} non trouvé]`;
    }
  }

  public async execute({ project, apiKey }: ReadmeWorkflowContext): Promise<string> {
    console.log('JabbLog [ReadmeWorkflow]: Exécution du workflow...');

    // Étape 1: Récupérer le prompt système (l'agent)
    // On utilise le nouveau service pour charger le prompt de l'agent lui-même
    const systemPrompt = await this.templateService.render(
      'ReadmeGenerator', // Nom du fichier de template
      project.projectRootPath,
      'doc', // Le rôle (dossier)
      {}
    );
    
    const allBricks = await this.brickService.getBricksByProjectId(project.id);
    const brickContextPromises = allBricks.map(async (brick) => {
      if (brick.files_scope.length === 0) return `--- BRICK: ${brick.name} (Vide) ---`;
      const brickContent = await this.fileContentService.buildContentFromFiles(
        brick.files_scope,
        project.projectRootPath,
        'standard'
      );
      return `--- BRICK: ${brick.name} ---\n${brickContent}\n--- END BRICK: ${brick.name} ---`;
    });
    const brickContexts = await Promise.all(brickContextPromises);
    const brickContext = brickContexts.join('\n\n');

    const roadmapContent = await this.readProjectDocument(project.projectRootPath, 'docs/VISION.md');
    const architectureContent = await this.readProjectDocument(project.projectRootPath, 'docs/architecture.md');

    // Utilisation du PromptTemplateService pour générer le contexte utilisateur
    // Rendu du template README avec les données du projet
    const readmeContent = await this.templateService.render(
      'ReadmeGenerator', // Le nom du fichier de template
      project.projectRootPath,
      'doc', // Le rôle (dossier)
      {
        projectName: project.name,
        brickContext,
        roadmapContent,
        architectureContent,
      }
    );


    console.log('JabbLog [ReadmeWorkflow]: Workflow terminé avec succès.');
    return readmeContent;
  }
}