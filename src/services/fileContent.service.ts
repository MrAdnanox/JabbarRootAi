// src/services/fileContent.service.ts

import * as vscode from 'vscode';

/**
 * Service outil responsable de lire une liste de fichiers et de les agréger en une seule chaîne formatée.
 */
export class FileContentService {
  /**
   * Construit une chaîne de caractères unique à partir du contenu de plusieurs fichiers.
   * @param fileUris - Un tableau d'URIs de fichiers à lire.
   * @returns Une promesse qui se résout en une chaîne formatée contenant les chemins relatifs et le contenu de chaque fichier.
   */
  public async buildContentFromFiles(fileUris: vscode.Uri[]): Promise<string> {
    const contentParts: string[] = [];

    for (const fileUri of fileUris) {
      try {
        const contentBytes = await vscode.workspace.fs.readFile(fileUri);
        const content = Buffer.from(contentBytes).toString('utf8');
        const relativePath = vscode.workspace.asRelativePath(fileUri, false);
        
        contentParts.push(`--- FILE: ${relativePath} ---\n${content}`);
      } catch (error) {
        console.error(`JabbaRoot: Erreur lors de la lecture du fichier ${fileUri.fsPath}`, error);
        // Inclure un marqueur d'erreur dans le contexte final pour informer l'utilisateur.
        contentParts.push(`--- ERROR: Failed to read file ${fileUri.fsPath} ---`);
      }
    }

    return contentParts.join('\n\n');
  }
}