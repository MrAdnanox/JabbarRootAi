// src/services/statistics/statistics.calculator.ts

const CHARS_PER_TOKEN_HEURISTIC = 4;

/**
 * Calcule les statistiques brutes basées sur les chaînes originales et compressées.
 * @param originalContent La chaîne de caractères avant compression.
 * @param compressedContent La chaîne de caractères après compression.
 * @returns Un objet contenant les statistiques brutes (nombres uniquement).
 */
export function calculateRawStats(originalContent: string, compressedContent: string) {
  const originalChars = originalContent.length;
  const compressedChars = compressedContent.length;
  const savedChars = originalChars - compressedChars;
  const reductionPercent = originalChars > 0 ? Math.round((savedChars / originalChars) * 100) : 0;

  return {
    originalChars,
    compressedChars,
    savedChars,
    reductionPercent,
    originalTokensApprox: Math.floor(originalChars / CHARS_PER_TOKEN_HEURISTIC),
    compressedTokensApprox: Math.floor(compressedChars / CHARS_PER_TOKEN_HEURISTIC),
    savedTokensApprox: Math.floor(savedChars / CHARS_PER_TOKEN_HEURISTIC),
  };
}