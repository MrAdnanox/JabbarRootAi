// packages/core/src/services/fileContent.service.ts

import { IFileSystem } from '@jabbarroot/types';
import * as path from 'path';
import type { CompactionService } from './compaction.service';
import type { CompressionLevel } from '../models/project.types';

/**
 * Service responsable de la lecture et de l'assemblage du contenu des fichiers
 * à partir d'une abstraction du système de fichiers (IFileSystem).
 */
export class FileContentService {
    constructor(
        private readonly fs: IFileSystem,
        private readonly compactionService: CompactionService
    ) {
        if (!fs) {
            throw new Error('FileSystem instance is required');
        }
        if (!compactionService) {
            throw new Error('CompactionService instance is required');
        }
    }

    /**
     * Construit une chaîne de caractères unique à partir du contenu de plusieurs fichiers.
     * @param filePathsInScope - Un tableau de chemins de fichiers RELATIFS au rootPath (ex: depuis files_scope).
     * @param projectRootPath - Le chemin racine ABSOLU du projet pour résoudre les chemins relatifs.
     * @param compressionLevel - Niveau de compression à appliquer au contenu des fichiers. Par défaut: 'none'.
     *        - 'none': Aucune compression
     *        - 'standard': Compression standard (suppression des commentaires et espaces inutiles)
     *        - 'extreme': Compression avancée (minification agressive, renommage des variables)
     * @returns Une promesse qui se résout en une chaîne formatée contenant le contenu de tous les fichiers,
     *          chacun précédé de son chemin relatif et séparé par des lignes vides.
     *          En cas d'erreur de lecture d'un fichier, le message d'erreur est inclus dans la sortie.
     */
    public async buildContentFromFiles(
        filePathsInScope: string[], 
        projectRootPath: string,
        compressionLevel: CompressionLevel = 'none'
    ): Promise<string> {
        if (!this.fs) {
            throw new Error('FileSystem instance is not available');
        }
        
        const contentParts: string[] = [];
        
        for (const relativeFilePath of filePathsInScope) {
            const absoluteFilePathToRead = path.join(projectRootPath, relativeFilePath);
            
            try {
                let content = await this.fs.readFile(absoluteFilePathToRead);
                const compactedContent = await this.compactionService.compact(content, compressionLevel, relativeFilePath);
                contentParts.push(`---FILE:${relativeFilePath}---\n${compactedContent}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                contentParts.push(`---ERROR READING FILE:${relativeFilePath}---\n${errorMessage}`);
            }
        }
        
        return contentParts.join('\n\n');
    }

    public async readFileContent(projectRootPath: string, relativeFilePath: string): Promise<string | null> {
        const absoluteFilePathToRead = path.join(projectRootPath, relativeFilePath);
        try {
            return await this.fs.readFile(absoluteFilePathToRead);
        } catch (error) {
            console.warn(`Could not read file ${absoluteFilePathToRead}`, error);
            return null;
        }
    }
}
