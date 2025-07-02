// packages/core/src/services/compaction/strategies/RegexCompactor.ts

import { ICompactor } from '../types';

/**
 * Une stratégie de compactage "sûre" qui utilise des expressions régulières.
 * Sans dépendances externes, elle est garantie de fonctionner avec Webpack.
 */
export class RegexCompactor implements ICompactor {
  constructor(private languageId: 'js' | 'css' | 'html' | 'generic' = 'generic') {}

  public async compact(content: string): Promise<string> {
    switch (this.languageId) {
      case 'js':
        return this.compactJs(content);
      case 'css':
        return this.compactCss(content);
      case 'html':
        return this.compactHtml(content);
      default:
        return this.compactGeneric(content);
    }
  }

  private compactJs(text: string): string {
    // Supprime les commentaires de bloc et de ligne, puis les lignes vides. Assez efficace.
    return text
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();
  }

  private compactCss(text: string): string {
    // Supprime les commentaires, puis les espaces inutiles.
    return text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s*([;:{},])\s*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private compactHtml(text: string): string {
    // Supprime les commentaires et les espaces entre les balises.
    return text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/>\s+</g, '><')
      .trim();
  }
  
  private compactGeneric(text: string): string {
    // Pour JSON, MD, etc., supprime juste les lignes vides.
    return text.split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n');
  }
}