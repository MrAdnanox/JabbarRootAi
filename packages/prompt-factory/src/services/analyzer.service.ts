import { IFileSystem } from '@jabbarroot/types';
import { JabbarProject, BrickService, ProjectService, BrickContext } from '@jabbarroot/core';
import { StructureAnalyzer } from '../analyzers/structure.analyzer';
import { ArchitecturalReport } from '../schemas/ArchitecturalReport.schema';
import { ArtefactService } from './artefact.service';

const ARCHITECTURAL_REPORT_TYPE = 'Architectural Report';

export class AnalyzerService {
  private structureAnalyzer: StructureAnalyzer;
  private artefactService: ArtefactService;

  constructor(
    private readonly fs: IFileSystem,
    projectService: ProjectService,
    brickService: BrickService
  ) {
    this.structureAnalyzer = new StructureAnalyzer(fs);
    this.artefactService = new ArtefactService(projectService, brickService);
  }

  /**
   * Analyse la structure du projet et génère un rapport architectural
   * @param project Le projet à analyser
   * @param fileTree L'arborescence des fichiers du projet
   * @param statsReportJson Les statistiques de structure du projet au format JSON
   * @param apiKey La clé API pour les appels externes
   * @returns Le rapport architectural généré
   */
  public async analyzeStructure(
    project: JabbarProject, 
    fileTree: string, 
    statsReportJson: string,
    apiKey: string
  ): Promise<ArchitecturalReport> {
    // 1. Essayer de lire un rapport précédent pour une analyse itérative
    const existingBrick = await this.artefactService.findArtefactBrick(project, ARCHITECTURAL_REPORT_TYPE);
    let oldReport: ArchitecturalReport | undefined;
    if (existingBrick) {
      oldReport = await this.artefactService.readArchitecturalReport(existingBrick);
    }
    const oldReportJson = oldReport ? JSON.stringify(oldReport) : undefined;
    
    // 2. Appeler le véritable analyseur pour obtenir le nouveau rapport
    const newReport = await this.structureAnalyzer.analyze(
      project.projectRootPath,
      fileTree,
      statsReportJson,
      apiKey,
      oldReportJson
    );

    // 3. Persister le nouveau rapport dans une brique d'artefact
    // upsertArchitecturalReportArtefact s'occupe de créer OU mettre à jour
    // et de peupler à la fois les special_sections ET le files_scope
    await this.artefactService.upsertArchitecturalReportArtefact(project, newReport);
    
    console.log('[AnalyzerService] Rapport architectural sauvegardé avec succès.');
    return newReport;
  }

  // Les méthodes de façade restent correctes
  public async findArtefactBrick(project: JabbarProject): Promise<BrickContext | undefined> {
    return this.artefactService.findArtefactBrick(project, ARCHITECTURAL_REPORT_TYPE);
  }

  public async readArchitecturalReport(artefactBrick: BrickContext): Promise<ArchitecturalReport | undefined> {
    return this.artefactService.readArchitecturalReport(artefactBrick);
  }
}