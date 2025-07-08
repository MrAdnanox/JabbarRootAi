// src/services/statistics/statistics.formatter.ts

/**
 * Génère un message de motivation basé sur le pourcentage de réduction.
 * @param reductionPercent Le pourcentage de compression (ex: 35 pour 35%).
 * @returns Une chaîne de caractères contenant un message et une icône.
 */
export function getMotivationMessage(reductionPercent: number): string {
    if (reductionPercent >= 40) {return "🚀 Compression Maximale !";}
    if (reductionPercent >= 30) {return "🔥 Excellente Optimisation !";}
    if (reductionPercent >= 20) {return "💪 Bon Compactage.";}
    if (reductionPercent >= 10) {return "✅ Réduction Acceptable.";}
    return "😤 Peu d'optimisation.";
}