// packages/core/src/services/compaction/utils.ts

import * as path from 'path';

const extensionToLanguageIdMap: Map<string, string> = new Map([
  // JavaScript
  ['.js', 'javascript'],
  ['.mjs', 'javascript'],
  ['.cjs', 'javascript'],
  // TypeScript
  ['.ts', 'typescript'],
  ['.mts', 'typescript'],
  ['.cts', 'typescript'],
  // CSS
  ['.css', 'css'],
  // HTML
  ['.html', 'html'],
  ['.htm', 'html'],
  // JSON
  ['.json', 'json'],
]);

/**
 * Détermine l'identifiant de langage à partir d'un chemin de fichier.
 * @param filePath Le chemin complet du fichier.
 * @returns L'identifiant de langage (ex: 'typescript') ou null si inconnu.
 */
export function getLanguageIdFromPath(filePath: string): string | null {
  const extension = path.extname(filePath).toLowerCase();
  return extensionToLanguageIdMap.get(extension) || null;
}