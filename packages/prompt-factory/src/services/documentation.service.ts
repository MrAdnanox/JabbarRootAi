// NOUVEAU FICHIER : packages/prompt-factory/src/services/documentation.service.ts
import { JabbarProject, BrickService, FileContentService } from '@jabbarroot/core';
import { IFileSystem } from '@jabbarroot/types';
import { ReadmeWorkflow } from '../workflows/readme.workflow';

// Ce service est maintenant le point d'entrée de haut niveau pour tout ce qui concerne la documentation.
export class DocumentationService {
  private readmeWorkflow: ReadmeWorkflow;

  constructor(
    // Il reçoit les services du 'core' et l'adaptateur 'fs' depuis l'extérieur
    private readonly brickService: BrickService,
    private readonly fileContentService: FileContentService,
    private readonly fs: IFileSystem,
  ) {
    // Il instancie les workflows dont il a besoin
    this.readmeWorkflow = new ReadmeWorkflow(
      this.brickService,
      this.fileContentService,
      this.fs
    );
  }

  /**
   * Génère un README pour un projet donné.
   * C'est la seule méthode publique que l'UI (VSCode) connaîtra.
   * @param project Le projet cible.
   * @param apiKey La clé API pour le LLM.
   * @returns Le contenu du README généré.
   */
  public async generateReadme(project: JabbarProject, apiKey: string): Promise<string> {
    console.log('JabbLog [PF DocumentationService]: Exécution de generateReadme...');
    try {
      const readmeContent = await this.readmeWorkflow.execute({ project, apiKey });
      return readmeContent;
    } catch (error) {
      console.error('JabbLog [PF DocumentationService]: Une erreur est survenue dans le workflow.', error);
      // L'erreur est re-levée pour être traitée par l'appelant (la commande VSCode)
      throw error;
    }
  }

  // À l'avenir, on pourrait ajouter ici :
  // public async generateChangelog(...) {}
  // public async generateContributingGuide(...) {}
}