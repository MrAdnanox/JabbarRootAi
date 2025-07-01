// packages/prompt-factory/src/analyzers/structure.analyzer.ts
import { IFileSystem } from '@jabbarroot/types';
import { PromptTemplateService } from '../services/PromptTemplate.service';
import { StructureDecoderExecutor } from '../executors/structure-decoder.executor';
import { ArchitecturalReport } from '../schemas/ArchitecturalReport.schema';
import { ArtefactService } from '../services/artefact.service';

export class StructureAnalyzer {
  private templateService: PromptTemplateService;
  
  constructor(private readonly fs: IFileSystem) {
    this.templateService = new PromptTemplateService(fs);
  }

  /**
   * Applique les contraintes de taille au rapport généré par le LLM.
   * @param report Le rapport brut généré par le LLM
   * @returns Le rapport nettoyé avec les contraintes de taille appliquées
   */
  private postProcessReport(report: ArchitecturalReport): ArchitecturalReport {
    console.log('JabbLog [StructureAnalyzer]: Post-traitement du rapport...');

    // Appliquer les contraintes de taille par le code
    const processedReport: ArchitecturalReport = {
      ...report,
      keyFiles: report.keyFiles.slice(0, 8).map(file => ({
        ...file,
        justification: file.justification.substring(0, 80)
      })),
      summary: report.summary.substring(0, 500), // On peut être un peu plus large ici
      insights: report.insights.slice(0, 3),
      risks: report.risks.slice(0, 2)
    };
    
    return processedReport;
  }

  /**
   * Construit le prompt utilisateur pour l'analyse de la structure
   * @param fileTree L'arborescence du projet
   * @param error L'erreur éventuelle de l'exécution précédente
   * @param oldReportJson L'ancien rapport au format JSON (optionnel)
   * @returns Le prompt utilisateur formaté
   */
  private buildUserPrompt(fileTree: string, error: Error | null, oldReportJson?: string): string {
    let prompt = `Analyze the following file tree and produce the JSON architectural report.\n\n--- PROJECT TREE ---\n${fileTree}`;

    if (oldReportJson) {
      prompt += `\n\n--- PREVIOUS ANALYSIS REPORT ---\n${oldReportJson}\n\n--- TASK ---\nPlease update the previous report based on the new file tree. Focus on changes and refinements.`;
    }

    if (error) {
      prompt += `\n\n--- ERROR IN PREVIOUS ANALYSIS ---\n${error.message}\n\nPlease correct the errors in the report.`;
    }
    
    return prompt;
  }

  /**
   * Analyse l'arborescence d'un projet pour en extraire un rapport architectural.
   * @param projectRoot Le chemin racine du projet à analyser.
   * @param fileTree L'arborescence du projet sous forme de chaîne de caractères.
   * @param apiKey La clé API pour le LLM.
   * @param oldReportJson L'ancien rapport au format JSON (optionnel)
   * @returns Une promesse résolue avec le rapport architectural structuré.
   */
  private async analyze(projectRoot: string, fileTree: string, apiKey: string, oldReportJson?: string): Promise<ArchitecturalReport> {
    console.log('JabbLog [StructureAnalyzer]: Début de l\'analyse de la structure...');

    // 1. Charger le prompt spécifique à cette brique d'analyse
    const systemPrompt = await this.templateService.render(
      'StructureDecoder',
      projectRoot,
      'analytics',
      {}
    );

    // 2. Construire le prompt utilisateur avec l'ancien rapport si disponible
    const userPrompt = this.buildUserPrompt(fileTree, null, oldReportJson);

    // 3. Instancier l'exécuteur avec le prompt système
    const executor = new StructureDecoderExecutor(apiKey, systemPrompt);

    // 4. Lancer l'exécution et traiter le résultat
    try {
      const rawReport = await executor.execute(userPrompt);
      const finalReport = this.postProcessReport(rawReport);
      
      console.log('JabbLog [StructureAnalyzer]: Analyse et post-traitement terminés avec succès.');
      return finalReport;
    } catch (error) {
      console.error('JabbLog [StructureAnalyzer]: Échec de l\'exécution de la brique.', error);
      throw error;
    }
  }
}