import { SystemBrickManager, FileContentService } from '@jabbarroot/core';
import { IFileSystem, JabbarProject } from '@jabbarroot/types';
import { ReadmeWorkflow } from '../workflows/readme.workflow';
import { AnalyzerService } from './analyzer.service';

export class DocumentationService {
  private readmeWorkflow: ReadmeWorkflow;

  constructor(
    private readonly analyzerService: AnalyzerService,
    private readonly systemBrickManager: SystemBrickManager,
    private readonly fileContentService: FileContentService,
    private readonly fs: IFileSystem,
  ) {
    this.readmeWorkflow = new ReadmeWorkflow(this.fs, this.fileContentService);
  }

  public async generateReadme(project: JabbarProject, apiKey: string): Promise<string> {
    console.log('JabbLog [PF DocumentationService]: Exécution de generateReadme...');
    try {
      // Passer le service d'analyse au contexte du workflow
      const readmeContent = await this.readmeWorkflow.execute({
        project,
        apiKey,
        analyzerService: this.analyzerService,
        systemBrickManager: this.systemBrickManager
      });
      return readmeContent;
    } catch (error) {
      console.error('JabbLog [PF DocumentationService]: Une erreur est survenue dans le workflow.', error);
      throw error;
    }
  }
}