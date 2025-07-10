import { IFileSystem } from '@jabbarroot/types';
import { PromptTemplateService } from '../services/PromptTemplate.service.js';
import { StructureDecoderExecutor } from '../executors/structure-decoder.executor.js';
import { ArchitecturalReportV2 as ArchitecturalReport } from '@jabbarroot/types';

export class StructureAnalyzer {
  private templateService: PromptTemplateService;

  constructor(private readonly fs: IFileSystem) {
    this.templateService = new PromptTemplateService(fs);
  }

  // Cette méthode devient la seule responsabilité de cette classe
  public async analyze(
    projectRoot: string,
    fileTree: string,
    statsReportJson: string,
    apiKey: string,
    oldReportJson?: string
  ): Promise<ArchitecturalReport> {
    console.log('JabbLog [StructureAnalyzer]: Début de l\'analyse de la structure...');
    
    // 1. Obtenir le prompt système
    const systemPrompt = await this.templateService.render(
      'StructureDecoder',
      projectRoot,
      'analytics', // Le rôle est 'analytics'
      {}
    );

    // 2. Initialiser l'exécuteur spécialisé
    const executor = new StructureDecoderExecutor(apiKey, systemPrompt);

    // 3. Construire le prompt utilisateur
    let userPrompt = `Analyze the following file tree and project statistics to produce a comprehensive architectural report.\n\n--- PROJECT STATISTICS ---\n${statsReportJson}\n\n--- PROJECT TREE ---\n${fileTree}`;
    
    if (oldReportJson) {
      userPrompt += `\n\n--- PREVIOUS ANALYSIS REPORT ---\n${oldReportJson}\n\n--- TASK ---\nPlease update the previous report based on the new file tree and statistics. Focus on changes, refinements, and highlight any interesting patterns or potential issues identified in the statistics.`;
    }

    try {
      // 4. Exécuter l'analyse et retourner le rapport
      const rawReport = await executor.execute(userPrompt); // L'exécuteur gère maintenant les tentatives et la validation Zod
      console.log('JabbLog [StructureAnalyzer]: Analyse terminée avec succès.');
      return rawReport; // On retourne le rapport brut validé
    } catch (error) {
      console.error('JabbLog [StructureAnalyzer]: Échec de l\'exécution de la brique.', error);
      throw error;
    }
  }
}