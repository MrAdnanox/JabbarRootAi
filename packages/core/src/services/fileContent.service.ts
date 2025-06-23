// packages/core/src/services/fileContent.service.ts

import { IFileSystem } from '@jabbarroot/types';

/**
 * Service pur responsable de l'agrégation du contenu de plusieurs fichiers.
 * Ne dépend que d'une abstraction du système de fichiers (IFileSystem).
 */
export class FileContentService {
  constructor(private readonly fs: IFileSystem) {}

  /**
   * Construit une chaîne de caractères unique à partir du contenu de plusieurs fichiers.
   * @param filePaths - Un tableau de chemins de fichiers absolus.
   * @param rootPath - Le chemin racine du projet pour calculer les chemins relatifs.
   * @returns Une promesse qui se résout en une chaîne formatée.
   */
  public async buildContentFromFiles(filePaths: string[], rootPath: string): Promise<string> {
    const contentParts: string[] = [];

    for (const filePath of filePaths) {
      try {
        const content = await this.fs.readFile(filePath);
        const relativePath = this.fs.getRelativePath(rootPath, filePath);
        
        contentParts.push(`--- FILE: ${relativePath} ---\n${content}`);
      } catch (error) {
        // En cas d'erreur de lecture, on l'indique clairement dans le contexte.
        const relativePath = this.fs.getRelativePath(rootPath, filePath);
        contentParts.push(`--- ERROR: Failed to read file ${relativePath} ---`);
        // On pourrait aussi logger l'erreur via un service de log injecté.
        console.error(`Core: Error reading file ${filePath}`, error);
      }
    }

    return contentParts.join('\n\n');
  }
}