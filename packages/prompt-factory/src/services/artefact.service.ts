import { 
  BrickService, 
  ProjectService, 
  JabbarProject, 
  BrickContext, 
  BrickContextOptions 
} from '@jabbarroot/core';
import { ArchitecturalReport } from '../schemas/ArchitecturalReport.schema';
import * as path from 'path';

export const ARTEFACT_BRICK_PREFIX = '[ARTEFACT]';
const ARCHITECTURAL_REPORT_TYPE = 'Architectural Report';
const ARCHITECTURAL_REPORT_FILENAME = 'report.json';

export class ArtefactService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly brickService: BrickService
  ) {}

  private getArtefactBrickName(artefactType: string): string {
    return `${ARTEFACT_BRICK_PREFIX} ${artefactType}`;
  }

  public async findArtefactBrick(
    project: JabbarProject, 
    artefactType: string
  ): Promise<BrickContext | undefined> {
    const artefactName = this.getArtefactBrickName(artefactType);
    const bricks = await this.brickService.getBricksByProjectId(project.id);
    return bricks.find((b: BrickContext) => b.name === artefactName);
  }

  /**
   * Crée ou met à jour un rapport architectural
   * @param project Projet concerné
   * @param report Objet rapport architectural
   * @returns La brique mise à jour
   */
  public async upsertArchitecturalReportArtefact(
    project: JabbarProject,
    report: ArchitecturalReport
  ): Promise<BrickContext> {
    const brickToUpdate = await this.findArtefactBrick(project, ARCHITECTURAL_REPORT_TYPE);
    
    // 1. Extraire le nom du dossier racine du projet
    const projectRootName = path.basename(project.projectRootPath);

    // 2. Extraire et NORMALISER les chemins des fichiers clés
    const keyFilePaths = (report.keyFiles || []).map(kf => {
      const parts = kf.path.replace(/\\/g, '/').split('/');
      // Si le premier segment du chemin est le nom du dossier racine, on le retire
      if (parts[0] === projectRootName) {
        return parts.slice(1).join('/');
      }
      return kf.path;
    });
    
    // Sérialisation du rapport
    const reportContent = JSON.stringify(report, null, 2);
    
    // Préparation des options de la brique
    const currentOptions = brickToUpdate?.options || {};
    const updatedOptions: BrickContextOptions = {
      ...currentOptions,
      special_sections: {
        ...currentOptions.special_sections,
        [ARCHITECTURAL_REPORT_FILENAME]: reportContent
      }
    };

    if (!brickToUpdate) {
      console.log(`[ArtefactService] Création de la brique de rapport architectural`);
      const newBrick = await this.brickService.createBrick(
        project.id,
        this.getArtefactBrickName(ARCHITECTURAL_REPORT_TYPE),
        updatedOptions,
        false
      );
      
      // Mise à jour du files_scope avec les chemins des fichiers clés
      if (keyFilePaths.length > 0) {
        await this.brickService.updateBrick(newBrick.id, { 
          files_scope: keyFilePaths 
        });
      }
      
      await this.projectService.addBrickIdToProject(project.id, newBrick.id);
      return newBrick;
    }

    // Mise à jour de la brique existante
    const updatedBrick = await this.brickService.updateBrick(brickToUpdate.id, { 
      options: updatedOptions,
      files_scope: keyFilePaths
    });
    
    if (!updatedBrick) {
      throw new Error(`[ArtefactService] Échec de la mise à jour du rapport architectural`);
    }
    
    return updatedBrick;
  }

  /**
   * Récupère un rapport architectural depuis une brique
   * @param artefactBrick Brique contenant le rapport
   * @returns Le rapport architectural ou undefined si non trouvé
   */
  public async readArchitecturalReport(
    artefactBrick: BrickContext
  ): Promise<ArchitecturalReport | undefined> {
    const content = artefactBrick.options?.special_sections?.[ARCHITECTURAL_REPORT_FILENAME];
    if (!content) return undefined;
    
    try {
      return JSON.parse(content as string) as ArchitecturalReport;
    } catch (error) {
      console.error('[ArtefactService] Erreur lors de la lecture du rapport architectural:', error);
      return undefined;
    }
  }

  // Méthodes existantes conservées pour la rétrocompatibilité
  
  public async upsertArtefact(
    project: JabbarProject,
    artefactType: string,
    fileName: string,
    content: string
  ): Promise<BrickContext> {
    return this.upsertArtefactWithOptions(project, artefactType, {
      special_sections: { [fileName]: content }
    });
  }

  public async readArtefactContent(
    artefactBrick: BrickContext, 
    fileName: string
  ): Promise<string | undefined> {
    const content = artefactBrick.options?.special_sections?.[fileName];
    return Array.isArray(content) ? content.join('\n') : content;
  }

  // Méthode utilitaire pour la mise à jour générique
  private async upsertArtefactWithOptions(
    project: JabbarProject,
    artefactType: string,
    options: BrickContextOptions
  ): Promise<BrickContext> {
    const brickToUpdate = await this.findArtefactBrick(project, artefactType);

    if (!brickToUpdate) {
      const newBrick = await this.brickService.createBrick(
        project.id,
        this.getArtefactBrickName(artefactType),
        options,
        false
      );
      await this.projectService.addBrickIdToProject(project.id, newBrick.id);
      return newBrick;
    }

    const updatedBrick = await this.brickService.updateBrick(brickToUpdate.id, { 
      options: {
        ...brickToUpdate.options,
        ...options,
        special_sections: {
          ...brickToUpdate.options?.special_sections,
          ...options.special_sections
        }
      }
    });
    
    if (!updatedBrick) {
      throw new Error(`[ArtefactService] Échec de la mise à jour de la brique ${brickToUpdate.id}`);
    }
    
    return updatedBrick;
  }
}