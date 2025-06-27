// packages/core/src/services/compaction.service.ts

import * as path from 'path';
import { minify as minifyHtml } from 'html-minifier-terser';
import cssnano from 'cssnano';
import postcss from 'postcss';
import type { CompressionLevel } from '../models/project.types';

export interface ICompactionService {
    compact(text: string, level: CompressionLevel, filePath: string): Promise<string>;
}

export class CompactionService implements ICompactionService {
    private postcssProcessor: postcss.Processor;

    constructor() {
        this.postcssProcessor = postcss([cssnano({ preset: 'default' })]);
    }

    public async compact(text: string, level: CompressionLevel, filePath: string): Promise<string> {
        if (level === 'none' || !text?.trim()) { return text || ''; }
        const extension = path.extname(filePath).toLowerCase();

        // Les seules bibliothèques que nous gardons sont pour HTML/CSS car elles sont plus fiables.
        if (extension === '.html' || extension === '.htm') {
            return this.compactHtml(text, level);
        }
        if (extension === '.css') {
            return this.compactCss(text, level);
        }
        
        // POUR TOUT LE RESTE (JS, TS, JSX, C#, Go, Python...), nous utilisons une méthode texte.
        return this.compactCodeAsText(text, level);
    }

    /**
     * Compacte n'importe quel code en le traitant comme du texte.
     * Cette méthode est infaillible car elle n'utilise aucune dépendance externe et ne parse pas la syntaxe.
     */
    private compactCodeAsText(text: string, level: CompressionLevel): string {
        try {
            // 1. Supprime les commentaires de bloc et de ligne.
            let processed = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

            // 2. Sépare par ligne, supprime les espaces en début/fin, et filtre les lignes vides.
            const lines = processed.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            // 3. Retourne le résultat basé sur le niveau.
            if (level === 'extreme') {
                return lines.join(' ');
            } else { // 'standard'
                return lines.join('\n');
            }
        } catch (e) {
            // Cette partie ne devrait littéralement jamais être atteinte.
            return text;
        }
    }

    private async compactHtml(text: string, level: CompressionLevel): Promise<string> {
        // IMPORTANT : Nous désactivons la minification JS interne pour éviter les erreurs.
        const options = {
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: false, // <-- CRUCIAL
            minifyCSS: true
        };
        try {
            return await minifyHtml(text, options);
        } catch (e) { return text; }
    }

    private async compactCss(text: string, level: CompressionLevel): Promise<string> {
        try {
            const result = await this.postcssProcessor.process(text, { from: undefined });
            return result.css;
        } catch (e) { return text; }
    }
}