// packages/vscode-extension/src/services/ignore.service.ts

import * as vscode from 'vscode';
import { minimatch } from 'minimatch';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';

/**
 * Service responsable de la logique d'ignorance des fichiers,
 * spécifique à l'environnement VSCode et aux conventions de type .gitignore.
 */
export class IgnoreService {
  private readonly DEFAULT_IGNORE = ['.git', '.DS_Store', '*.log', '.vscode', '.idea', 'node_modules', '__pycache__', 'dist', 'build', '.env'];
  
  constructor(private readonly fs: VscodeFileSystemAdapter) {}

  private async loadIgnorePatterns(projectRootPath: string): Promise<string[]> {
    let patterns = [...this.DEFAULT_IGNORE];
    const gitignorePath = `${projectRootPath}/.gitignore`;
    const jabbaIgnorePath = `${projectRootPath}/.jabbarrootignore`; // Convention de nom de fichier

    for (const path of [gitignorePath, jabbaIgnorePath]) {
      try {
        const content = await this.fs.readFile(path);
        const filePatterns = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        patterns.push(...filePatterns);
      } catch {
        // Fichier non trouvé, c'est normal, on continue
      }
    }
    return patterns;
  }

  /**
   * Crée et retourne une fonction de prédicat `shouldIgnore`
   * configurée avec les règles du projet.
   * @param projectRootPath Le chemin racine du projet.
   * @returns Une fonction qui prend un chemin relatif et retourne true s'il doit être ignoré.
   */
  public async createIgnorePredicate(projectRootPath: string): Promise<(relativePath: string) => boolean> {
    const patterns = await this.loadIgnorePatterns(projectRootPath);
    
    return (relativePath: string): boolean => {
      // La logique de minimatch est maintenant contenue ici
      return patterns.some(pattern => {
        if (pattern.endsWith('/')) {
          // Gère les motifs de répertoire (ex: 'node_modules/')
          return minimatch(relativePath, pattern.slice(0, -1), { dot: true, matchBase: true }) || relativePath.startsWith(pattern.slice(0, -1) + '/');
        }
        return minimatch(relativePath, pattern, { dot: true, matchBase: true });
      });
    };
  }
}