import * as path from 'path';
import { BrickService } from './brick.service.js';
import { IFileSystem } from '@jabbarroot/types';
import { ProjectService } from './project.service.js';
import { JabbarProject, BrickContext, BrickContextOptions } from '@jabbarroot/types';

export class SystemBrickManager {
  constructor(
    private readonly brickService: BrickService,
    private readonly projectService: ProjectService,
    private readonly fs: IFileSystem
  ) {}

  private getManifestPath(projectRootPath: string): string {
    return path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'bricks', 'manifest.json');
  }

  public async ensureSystemBricksExist(project: JabbarProject): Promise<void> {
    const manifestPath = this.getManifestPath(project.projectRootPath);
    let manifest;
    try {
      const manifestContent = await this.fs.readFile(manifestPath);
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      console.warn(`[SystemBrickManager] Manifeste introuvable ou invalide à ${manifestPath}. Aucune brique système ne sera créée.`);
      return; 
    }

    if (!manifest || !manifest.bricks || !Array.isArray(manifest.bricks)) {
        console.warn(`[SystemBrickManager] Le format du manifeste est invalide.`);
        return;
    }

    // On récupère les briques une seule fois pour optimiser
    const existingBricks = await this.brickService.getBricksByProjectId(project.id);
    const existingBrickNames = new Set(existingBricks.map(b => b.name));

    for (const brickDef of manifest.bricks) {
      if (!existingBrickNames.has(brickDef.name)) {
        console.log(`[SystemBrickManager] La brique système "${brickDef.name}" est manquante. Création...`);
        
        const newBrick = await this.brickService.createBrick(
          project.id,
          brickDef.name,
          brickDef.options || {},
          false // Les briques système sont inactives par défaut
        );
        
        await this.projectService.addBrickIdToProject(project.id, newBrick.id);
        
        // On peuple le scope avec les fichiers par défaut, en vérifiant leur existence
        if (brickDef.default_files_scope && Array.isArray(brickDef.default_files_scope)) {
            const filesToAdd: string[] = [];
            for (const filePath of brickDef.default_files_scope) {
                const absolutePath = path.join(project.projectRootPath, filePath);
                try {
                    // Utiliser l'abstraction IFileSystem pour vérifier l'existence
                    await this.fs.readFile(absolutePath);
                    filesToAdd.push(filePath);
                } catch (e) {
                    console.log(`[SystemBrickManager] Fichier par défaut "${filePath}" non trouvé, il ne sera pas ajouté à la brique "${brickDef.name}".`);
                }
            }
            if (filesToAdd.length > 0) {
                await this.brickService.addPathsToBrick(newBrick.id, filesToAdd);
            }
        }
        console.log(`[SystemBrickManager] Brique "${brickDef.name}" créée avec succès.`);
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