// packages/core/src/services/compaction.service.ts

import * as path from 'path';
import { minify as minifyJs } from 'terser';
// @ts-ignore - Le type est disponible via @types/html-minifier-terser
import { minify as minifyHtml } from 'html-minifier-terser';
// @ts-ignore - Le type est disponible via @types/cssnano
import cssnano from 'cssnano';
// @ts-ignore - Le type est disponible via @types/postcss
import postcss from 'postcss';

// Le type CompressionLevel est maintenant défini dans project.types.ts
import type { CompressionLevel } from '../models/project.types';

export interface ICompactionService {
    compact(text: string, level: CompressionLevel, filePath: string): Promise<string>;
}

export class CompactionService implements ICompactionService {
    private postcssProcessor: postcss.Processor;

    constructor() {
        // Initialiser le processeur PostCSS avec cssnano
        this.postcssProcessor = postcss([cssnano({ preset: 'default' })]);
        // console.log('[CompactionService] Initialized with specialized libraries.');
    }

    /**
     * Dispatche la compaction vers la bibliothèque appropriée en fonction de l'extension du fichier.
     */
    public async compact(text: string, level: CompressionLevel, filePath: string): Promise<string> {
        if (level === 'none' || !text) {
            return text || '';
        }

        const extension = path.extname(filePath).toLowerCase();

        try {
            switch (extension) {
                case '.js':
                case '.ts':
                case '.mjs':
                case '.cjs':
                    return await this.compactJs(text, level);

                case '.html':
                case '.htm':
                    return await this.compactHtml(text, level);

                case '.css':
                    return await this.compactCss(text, level);

                default:
                    // Pour les autres types de fichiers (.md, .py, etc.), une compaction générique suffit.
                    return this.compactGeneric(text, level);
            }
        } catch (error) {
            console.error(`[CompactionService] Error during compaction for ${filePath}:`, error);
            // En cas d'erreur de la bibliothèque, on retourne le texte original pour ne rien perdre.
            return text;
        }
    }

    private async compactJs(text: string, level: CompressionLevel): Promise<string> {
        const options = {
            mangle: level === 'extreme', // Brouiller les noms de variables seulement en 'extreme'
            compress: level === 'extreme', // Compression plus agressive en 'extreme'
            format: {
                comments: false, // Supprimer tous les commentaires
                beautify: level === 'standard', // 'standard' est un formatage propre, pas une minification sur une ligne
            },
        };
        const result = await minifyJs(text, options);
        return result.code || text; // Retourne le code original si la minification échoue
    }

    private async compactHtml(text: string, level: CompressionLevel): Promise<string> {
        const options = {
            removeComments: true,
            collapseWhitespace: true,
            conservativeCollapse: level === 'standard', // Moins agressif en 'standard'
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyJS: true, // Utilise terser pour le JS inline
            minifyCSS: true, // Utilise cssnano pour le CSS inline
        };
        return await minifyHtml(text, options);
    }

    private async compactCss(text: string, level: CompressionLevel): Promise<string> {
        // cssnano est assez intelligent, le niveau n'a pas beaucoup d'impact ici.
        const result = await this.postcssProcessor.process(text, { from: undefined });
        return result.css;
    }
    
    private compactGeneric(text: string, level: CompressionLevel): string {
        // Supprime les commentaires communs (lignes commençant par #, //) et les lignes vides
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))
            .join(level === 'extreme' ? ' ' : '\n');
    }
}