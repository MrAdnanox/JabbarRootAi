// packages/core/src/services/compaction/strategies/CleanCssCompactor.ts

import { ICompactor } from '../types';
import CleanCSS from 'clean-css';

// Interface pour le résultat de la minification
interface MinifyResult {
  styles: string;
  errors: string[];
  warnings: string[];
}

// Type pour l'instance de CleanCSS
interface CleanCSSInstance {
  minify(css: string): MinifyResult;
}

/**
 * Implémentation de ICompactor utilisant clean-css pour la minification des fichiers CSS.
 * Supporte les formats CSS, SCSS, SASS et LESS.
 */
export class CleanCssCompactor implements ICompactor {
  private readonly cleaner: CleanCSSInstance;

  constructor() {
    // Création d'une instance de CleanCSS avec les options
    this.cleaner = new CleanCSS({
      level: 1, // Niveau de compression sûr et rapide
      compatibility: '*', // Meilleure compatibilité
      returnPromise: false // Utilisation de l'API synchrone
    }) as unknown as CleanCSSInstance; // Cast nécessaire à cause des types
  }

  /**
   * Minifie le contenu CSS fourni en utilisant clean-css.
   * @param content Le contenu CSS à minifier
   * @returns Une promesse résolue avec le contenu minifié ou le contenu d'origine en cas d'erreur
   */
  public async compact(content: string): Promise<string> {
    if (!content || typeof content !== 'string') {
      return content;
    }

    try {
      // Utilisation de l'API synchrone de clean-css avec les types appropriés
      const result = this.cleaner.minify(content);
      
      // Vérification des erreurs
      if (result.errors && result.errors.length > 0) {
        console.warn('Clean-CSS minification failed. Returning original content.', result.errors);
        return content;
      }
      
      // Retourne le CSS minifié ou le contenu original si vide
      return result.styles || content;
    } catch (error) {
      console.warn('Clean-CSS minification threw an error. Returning original content.', error);
      return content;
    }
  }
}