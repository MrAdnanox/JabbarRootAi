// packages/core/src/services/SystemBrickManager.service.ts
import * as path from 'path';
import { BrickService } from './brick.service';
import { IFileSystem } from '@jabbarroot/types';
import { ProjectService } from './project.service';
import { JabbarProject, BrickContext } from '../models/project.types';

export class SystemBrickManager {
  constructor(
    private readonly brickService: BrickService,
    private readonly fs: IFileSystem,
    private readonly projectService: ProjectService
  ) {}

  private getManifestPath(projectRootPath: string): string {
    // Le chemin est maintenant plus spécifique et robuste.
    return path.join(
      projectRootPath,
      '.jabbarroot',
      '.jabbarroot_data',
      'system',
      'bricks',
      'manifest.json'
    );
  }

  public async ensureSystemBricksExist(project: JabbarProject): Promise<void> {
    const manifestPath = this.getManifestPath(project.projectRootPath);
    let manifest;
    try {
      const manifestContent = await this.fs.readFile(manifestPath);
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      console.error(`[SystemBrickManager] Manifeste introuvable ou invalide à ${manifestPath}.`, error);
      // On pourrait ici copier un manifest par défaut depuis l'extension si non trouvé.
      return; 
    }

    const existingBricks = await this.brickService.getBricksByProjectId(project.id);
    const existingBrickNames = new Set(existingBricks.map(b => b.name));

    for (const brickDef of manifest.bricks) {
      if (!existingBrickNames.has(brickDef.name)) {
        console.log(`[SystemBrickManager] La brique système "${brickDef.name}" est manquante. Création...`);
        const newBrick = await this.brickService.createBrick(
          project.id,
          brickDef.name,
          brickDef.options || {},
          false // Les briques système ne sont pas actives pour la compilation par défaut
        );
        
        // Peuple le scope avec les fichiers par défaut, SI le chemin existe.
        const filesToAdd = [];
        if (brickDef.default_files_scope) {
          for (const filePath of brickDef.default_files_scope) {
            const absolutePath = path.join(project.projectRootPath, filePath);
            // On vérifie si le fichier existe avant de l'ajouter
            try {
              // Une lecture rapide est un bon moyen de vérifier l'existence
              // Note: fs.exists est déprécié, on utilise une lecture dans un try/catch
              await this.fs.readFile(absolutePath); 
              filesToAdd.push(filePath);
            } catch (e) {
              // Le fichier n'existe pas, on ne l'ajoute pas.
            }
          }
        }
        
        if (filesToAdd.length > 0) {
            await this.brickService.addPathsToBrick(newBrick.id, filesToAdd);
        }

        await this.projectService.addBrickIdToProject(project.id, newBrick.id);
      }
    }
  }

  /**
   * Trouve une brique système spécifique par son nom pour un projet donné.
   * @param project Le projet dans lequel chercher.
   * @param brickName Le nom complet de la brique système (ex: "[MEMORY] Documentation").
   * @returns La brique si elle est trouvée, sinon undefined.
   */
  public async findSystemBrick(project: JabbarProject, brickName: string): Promise<BrickContext | undefined> {
    // On récupère toutes les briques du projet
    const projectBricks = await this.brickService.getBricksByProjectId(project.id);
    
    // On cherche celle qui correspond exactement au nom demandé
    const foundBrick = projectBricks.find(brick => brick.name === brickName);

    return foundBrick;
  }
}