import { IFileSystem } from '@jabbarroot/types';
import { JabbarProject, BrickService, ProjectService } from '@jabbarroot/core';
import { StructureAnalyzer } from '../analyzers/structure.analyzer';
import { ArchitecturalReport } from '../schemas/ArchitecturalReport.schema';
import { ArtefactService } from './artefact.service';

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
   * Point d'entrée pour l'analyse de la structure d'un projet.
   */
  /**
   * Analyse la structure d'un projet et génère un rapport architectural
   * @param project Le projet à analyser
   * @param fileTree L'arborescence des fichiers du projet
   * @param apiKey Clé API pour les services externes
   * @returns Le rapport architectural généré
   */
  public async analyzeStructure(project: JabbarProject, fileTree: string, apiKey: string): Promise<ArchitecturalReport> {
    // 1. Récupérer l'ancien rapport s'il existe
    const existingBrick = await this.artefactService.findArtefactBrick(project, 'Architectural Report');
    let oldReport: ArchitecturalReport | undefined;
    
    if (existingBrick) {
      oldReport = await this.artefactService.readArchitecturalReport(existingBrick);
    }

    // 2. Lancer l'analyse en passant l'ancien rapport (sérialisé en JSON)
    const oldReportJson = oldReport ? JSON.stringify(oldReport) : undefined;
    // @ts-ignore - Accès à une méthode privée pour l'orchestration
    const newReport = await this.structureAnalyzer.analyze(
      project.projectRootPath, 
      fileTree, 
      apiKey, 
      oldReportJson
    );

    // 3. Sauvegarder le nouvel artefact avec la nouvelle méthode
    await this.artefactService.upsertArchitecturalReportArtefact(project, newReport);
    
    return newReport;
  }

  // À l'avenir, on pourrait ajouter ici :
  // - D'autres types d'analyse (qualité de code, sécurité, etc.)
  // - Des méthodes pour gérer le cache des analyses
  // - Des méthodes pour comparer différentes versions d'analyse(...) {}
}