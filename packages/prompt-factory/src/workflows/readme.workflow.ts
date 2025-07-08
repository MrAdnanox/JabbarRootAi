// Contenu final pour: packages/prompt-factory/src/workflows/readme.workflow.ts
import { FileContentService, SystemBrickManager } from '@jabbarroot/core';
import { IFileSystem, JabbarProject } from '@jabbarroot/types';
import { GenericAgentExecutor } from '../executors/GenericAgent.executor';
import { PromptTemplateService } from '../services/PromptTemplate.service';
import { AnalyzerService } from '../services/analyzer.service';
import * as path from 'path';

export interface ReadmeWorkflowContext {
  project: JabbarProject;
  apiKey: string;
  analyzerService: AnalyzerService;
  systemBrickManager: SystemBrickManager; 
}

export class ReadmeWorkflow {
  private templateService: PromptTemplateService;

  constructor(
    private readonly fs: IFileSystem,
    private readonly fileContentService: FileContentService 
  ) {
    this.templateService = new PromptTemplateService(fs);
  }

  public async execute({ project, apiKey, analyzerService, systemBrickManager }: ReadmeWorkflowContext): Promise<string> {
    console.log('JabbLog [ReadmeWorkflow]: Début du workflow basé sur la mémoire système...');

    const architecturalReportBrick = await analyzerService.findArtefactBrick(project);
    if (!architecturalReportBrick) {
        throw new Error("Rapport architectural introuvable. Exécutez d'abord l'analyse de structure.");
    }
    const architecturalReport = await analyzerService.readArchitecturalReport(architecturalReportBrick);
    if (!architecturalReport) {
        throw new Error("Impossible de lire le rapport architectural depuis la brique d'artefact.");
    }

    console.log('JabbLog [ReadmeWorkflow]: Lecture de la brique [MEMORY] Documentation...');
    const docMemoryBrick = await systemBrickManager.findSystemBrick(project, '[MEMORY] Documentation');
    let keyDocumentsContext = '';
    if (docMemoryBrick && docMemoryBrick.files_scope.length > 0) {
        keyDocumentsContext = await this.fileContentService.buildContentFromFiles(
            docMemoryBrick.files_scope,
            project.projectRootPath,
            'none' 
        );
    } else {
        console.log('JabbLog [ReadmeWorkflow]: Brique [MEMORY] Documentation non trouvée ou vide.');
    }

    console.log('JabbLog [ReadmeWorkflow]: Agrégation des données brutes pour le contexte...');
    const userContext = 
      `${keyDocumentsContext}\n\n` +
      `--- ANALYSE ARCHITECTURALE STRUCTURÉE ---\n` +
      `${JSON.stringify(architecturalReport, null, 2)}\n` +
      `--- FIN DE L'ANALYSE ---`;

    const systemPrompt = await this.templateService.render(
      'ReadmeGenerator',
      project.projectRootPath,
      'doc',
      {}
    );

    console.log('JabbLog [ReadmeWorkflow]: Invocation de GenericAgentExecutor...');
    const executor = new GenericAgentExecutor(apiKey);
    const readmeContent = await executor.execute(systemPrompt, userContext);

    console.log('JabbLog [ReadmeWorkflow]: Workflow terminé. Contenu du README généré.');
    return readmeContent;
  }
}