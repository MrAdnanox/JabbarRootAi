import { IFileSystem } from '@jabbarroot/types';
import { 
  JabbarProject, 
  BrickService, 
  ProjectService, 
  BrickContext, 
  StatisticsService
} from '@jabbarroot/core';
import { StructureAnalyzer } from '../analyzers/structure.analyzer';
import { ArchitecturalReportV2, ProjectStructureStats } from '@jabbarroot/types';
import { ArtefactService } from './artefact.service';
import * as path from 'path';

const ARCHITECTURAL_REPORT_TYPE = 'Architectural Report';

export class AnalyzerService {
  private structureAnalyzer: StructureAnalyzer;
  private artefactService: ArtefactService;
  private statisticsService: StatisticsService;
  private fs: IFileSystem;

  constructor(
    fs: IFileSystem,
    projectService: ProjectService,
    brickService: BrickService,
    statisticsService: StatisticsService
  ) {
    this.fs = fs;
    this.structureAnalyzer = new StructureAnalyzer(fs);
    this.artefactService = new ArtefactService(projectService, brickService);
    this.statisticsService = statisticsService;
  }

  public async analyzeStructureAndPersist(
    project: JabbarProject, 
    fileTree: string, 
    apiKey: string
  ): Promise<ArchitecturalReportV2> {
    
    console.log('[AnalyzerService] Début de l\'orchestration de l\'analyse...');
    
    // Étape 1 : Calculer les stats
    const shouldIgnore = () => false;
    const statsReport = await this.statisticsService.generateStructureStats(
      project.projectRootPath,
      shouldIgnore
    );
    console.log('[AnalyzerService] Statistiques calculées.');

    // Sauvegarde des statistiques
    try {
      const statsDir = path.join(project.projectRootPath, '.jabbarroot', '.jabbarroot_data', 'storage_v2', 'stats');
      await this.fs.createDirectory(statsDir);
      
      const statsFilePath = path.join(statsDir, `structure_stats_${project.id}.json`);
      const statsReportJson = JSON.stringify(statsReport, null, 2);
      
      await this.fs.writeFile(statsFilePath, statsReportJson);
      console.log(`[AnalyzerService] Rapport de statistiques sauvegardé dans ${statsFilePath}`);
    } catch (e) {
      console.error('[AnalyzerService] Erreur lors de la sauvegarde du rapport de statistiques:', e);
      // On continue même en cas d'échec de la sauvegarde
    }

    // Étape 2 : Appeler l'analyse interne
    return this.analyzeStructure(project, fileTree, statsReport, apiKey);
  }

  /**
   * Logique d'analyse interne qui prend les stats pré-calculées.
   * @private - Cette méthode pourrait être privée si seule `analyzeStructureAndPersist` l'utilise.
   */
  public async analyzeStructure(
    project: JabbarProject, 
    fileTree: string, 
    statsReport: ProjectStructureStats,
    apiKey: string
  ): Promise<ArchitecturalReportV2> {
    
    // 1. Essayer de lire un rapport précédent pour une analyse itérative
    const existingBrick = await this.artefactService.findArtefactBrick(project, ARCHITECTURAL_REPORT_TYPE);
    let oldReport: ArchitecturalReportV2 | undefined;
    if (existingBrick) {
      oldReport = await this.artefactService.readArchitecturalReport(existingBrick);
    }
    const oldReportJson = oldReport ? JSON.stringify(oldReport) : undefined;
    
    const statsReportJson = JSON.stringify(statsReport, null, 2);
    
    // 2. Appeler le véritable analyseur (le moteur IA)
    const newReport = await this.structureAnalyzer.analyze(
      project.projectRootPath,
      fileTree,
      statsReportJson,
      apiKey,
      oldReportJson
    );

    // 3. Enrichir le rapport avec les stats sources pour la traçabilité
    const finalReport: ArchitecturalReportV2 = {
      ...newReport,
      source_statistics: statsReport
    };

    // 4. Persister l'artefact complet
    await this.artefactService.upsertArchitecturalReportArtefact(project, finalReport);
    
    console.log('[AnalyzerService] Rapport architectural enrichi et sauvegardé avec succès.');
    return finalReport;
  }

  // Façades pour lire l'artefact (inchangées et correctes)
  public async findArtefactBrick(project: JabbarProject): Promise<BrickContext | undefined> {
    return this.artefactService.findArtefactBrick(project, ARCHITECTURAL_REPORT_TYPE);
  }

  public async readArchitecturalReport(artefactBrick: BrickContext): Promise<ArchitecturalReportV2 | undefined> {
    return this.artefactService.readArchitecturalReport(artefactBrick);
  }
}