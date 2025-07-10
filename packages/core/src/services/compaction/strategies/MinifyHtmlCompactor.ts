// packages/core/src/services/compaction/strategies/MinifyHtmlCompactor.ts

import { ICompactor } from '../types.js';
import { minify } from 'html-minifier-terser';

/**
 * Implémentation de ICompactor utilisant html-minifier-terser pour la minification des fichiers HTML/XML/SVG.
 * Cette implémentation est pure JavaScript et ne dépend pas de modules natifs.
 */
export class MinifyHtmlCompactor implements ICompactor {
  private readonly options = {
    collapseWhitespace: true,      // Supprime les espaces inutiles
    removeComments: true,           // Supprime les commentaires
    removeRedundantAttributes: true,// Supprime les attributs redondants
    removeScriptTypeAttributes: true, // Supprime type="text/javascript"
    removeStyleLinkTypeAttributes: true, // Supprime type="text/css"
    useShortDoctype: true,         // Utilise <!doctype html>
    minifyCSS: true,               // Minifie le CSS intégré
    minifyJS: false,               // Ne pas minifier le JS intégré pour la sécurité
    removeAttributeQuotes: false,   // Conserve les guillemets pour la compatibilité
    removeEmptyAttributes: true,    // Supprime les attributs vides
    removeOptionalTags: false,      // Conserve les balises optionnelles pour la compatibilité
    sortAttributes: true,          // Trie les attributs pour une meilleure compression
    sortClassName: true,           // Trie les noms de classe CSS
  };


  /**
   * Minifie le contenu HTML/XML/SVG fourni.
   * @param content Le contenu à minifier
   * @returns Une promesse résolue avec le contenu minifié ou le contenu d'origine en cas d'erreur
   */
  public async compact(content: string): Promise<string> {
    if (!content || typeof content !== 'string') {
      return content;
    }

    try {
      // html-minifier-terser fonctionne directement avec des strings
      const result = await minify(content, this.options);
      return result;
    } catch (error) {
      console.warn('HTML minification failed. Returning original content.', error);
      return content;
    }
  }
}