// apps/vscode-extension/src/services/ignore.service.ts
import * as vscode from 'vscode';
import { minimatch } from 'minimatch';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { JabbarProject, BrickContext } from '@jabbarroot/core';
import * as path from 'path';

/**
 * Service responsable de la logique d'ignorance des fichiers,
 * spécifique à l'environnement VSCode et aux conventions de type .gitignore.
 */
export class IgnoreService {
    private readonly DEFAULT_IGNORE = ['.git', '.DS_Store', '*.log', '.vscode', '.idea', 'node_modules', '__pycache__', 'dist', 'build', '.env'];

    constructor(private readonly fs: VscodeFileSystemAdapter) {}

    private async loadPatternsFromFile(projectRootPath: string, relativeFilePath: string): Promise<string[]> {
        const absoluteFilePath = path.join(projectRootPath, relativeFilePath);
        try {
            const content = await this.fs.readFile(absoluteFilePath);
            return content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
        } catch {
            // Fichier non trouvé ou erreur de lecture, retourner un tableau vide
            // console.warn(`Ignore file not found or unreadable: ${absoluteFilePath}`);
            return [];
        }
    }

    /**
     * Crée et retourne une fonction de prédicat `shouldIgnore`
     * configurée avec les règles du projet et éventuellement de la brique.
     * @param project Le projet jabbarroot
     * @param brick La brique optionnelle pour des règles spécifiques
     * @returns Une fonction qui prend un chemin relatif et retourne true s'il doit être ignoré
     */
    public async createIgnorePredicate(
        project: JabbarProject,
        brick?: BrickContext
    ): Promise<(relativePath: string) => boolean> {
        let combinedPatterns: string[] = [...this.DEFAULT_IGNORE];

        // 1. .gitignore standard
        const gitignorePatterns = await this.loadPatternsFromFile(project.projectRootPath, '.gitignore');
        combinedPatterns.push(...gitignorePatterns);

        // 2. Project-level ignores
        if (project.options.projectIgnorePatterns) {
            combinedPatterns.push(...project.options.projectIgnorePatterns);
        }
        if (project.options.projectIgnoreFiles) {
            for (const file of project.options.projectIgnoreFiles) {
                const patterns = await this.loadPatternsFromFile(project.projectRootPath, file);
                combinedPatterns.push(...patterns);
            }
        }

        // 3. Brick-level ignores (if brick is provided)
        if (brick) {
            if (brick.options.brickIgnorePatterns) {
                combinedPatterns.push(...brick.options.brickIgnorePatterns);
            }
            if (brick.options.brickIgnoreFiles) {
                for (const file of brick.options.brickIgnoreFiles) {
                    const patterns = await this.loadPatternsFromFile(project.projectRootPath, file);
                    combinedPatterns.push(...patterns);
                }
            }
        }
        
        // Supprimer les doublons potentiels pour optimiser minimatch
        const uniquePatterns = Array.from(new Set(combinedPatterns));
        
        // Normalisation des chemins pour une correspondance cohérente
        const normalizePath = (p: string) => p.replace(/\\/g, '/').replace(/^\/\.\//, '');
        
        return (filePathToCheck: string): boolean => {
            const normalizedPath = normalizePath(filePathToCheck);
            const shouldIgnore = uniquePatterns.some(pattern => {
                const normalizedPattern = normalizePath(pattern);
                // Gestion des patterns de dossier (ex: "node_modules/")
                return normalizedPattern.endsWith('/')
                    ? minimatch(normalizedPath, normalizedPattern.slice(0, -1), { dot: true, matchBase: true }) || 
                      normalizedPath.startsWith(normalizedPattern.slice(0, -1) + '/')
                    : minimatch(normalizedPath, normalizedPattern, { dot: true, matchBase: true });
            });
            
            // Log de débogage pour les fichiers ignorés
            if (shouldIgnore) {
                console.log(`[JabbarRoot] Fichier ignoré: ${filePathToCheck} (correspond à l'un des motifs: ${uniquePatterns.join(', ')})`);
            }
            
            return shouldIgnore;
        };
    }
}