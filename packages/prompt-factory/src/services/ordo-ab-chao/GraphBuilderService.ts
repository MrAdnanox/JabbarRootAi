// packages/prompt-factory/src/services/ordo-ab-chao/GraphBuilderService.ts
// Assemble les résultats partiels en Graphe de Connaissance.
import { SemanticAnalysisResult } from './types';
import { ArchitecturalReport } from '../../schemas/ArchitecturalReport.schema';
import * as path from 'path';

export class GraphBuilderService {
    constructor() {}

    public buildGraph(analysisResults: SemanticAnalysisResult[], report: ArchitecturalReport): any {
        console.log(`[GraphBuilderService] Construction du graphe sémantique à partir de ${analysisResults.length} résultats.`);
        
        const nodes: any[] = [];
        const edges: any[] = [];
        const fileNodeMap = new Map<string, any>();

        // 1ère passe : Créer tous les nœuds (Fichiers et Symboles) et les arêtes CONTAINS
        for (const result of analysisResults) {
            // Vérification de base du résultat
            if (!result || result.error || !result.filePath) {
                console.warn(`[GraphBuilder] Résultat d'analyse invalide ignoré:`, result?.error || 'Données manquantes');
                continue;
            }

            // Créer le nœud Fichier
            const fileNode = {
                id: result.filePath,
                type: 'File',
                label: path.basename(result.filePath),
                language: result.language || 'unknown',
            };
            nodes.push(fileNode);
            fileNodeMap.set(result.filePath, fileNode);

            // Créer les nœuds Symbole et les arêtes CONTAINS si des symboles sont présents
            if (Array.isArray(result.symbols) && result.symbols.length > 0) {
                for (const symbol of result.symbols) {
                    if (!symbol?.name) continue; // Ignorer les symboles invalides
                    
                    const symbolId = `${result.filePath}#${symbol.name}`;
                    nodes.push({
                        id: symbolId,
                        type: 'Symbol',
                        label: symbol.name,
                        kind: symbol.kind || 'unknown',
                        isExported: Boolean(symbol.isExported),
                    });
                    
                    edges.push({
                        source: result.filePath,
                        target: symbolId,
                        label: 'CONTAINS',
                        metadata: {
                            source: 'static-analysis',
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }
        }

        // 2ème passe : Créer les arêtes IMPORTS
        for (const result of analysisResults) {
            // Vérification de base du résultat (comme dans la 1ère passe)
            if (!result || result.error || !result.filePath || !result.dependencies) continue;

            // Vérifier que nous avons bien un tableau de dépendances non vide
            if (!Array.isArray(result.dependencies) || result.dependencies.length === 0) continue;

            for (const dep of result.dependencies) {
                // Ignorer les dépendances vides ou invalides
                if (typeof dep !== 'string' || !dep.trim()) continue;

                let resolvedPath: string | undefined;
                
                try {
                    // Gestion des chemins relatifs et absolus
                    if (dep.startsWith('.') || dep.startsWith('/')) {
                        const absPath = path.resolve(path.dirname(result.filePath), dep);
                        
                        // Essayer avec différentes extensions si nécessaire
                        const extensions = ['', '.ts', '.js', '.tsx', '.jsx', '.json'];
                        for (const ext of extensions) {
                            const candidatePath = absPath + ext;
                            if (fileNodeMap.has(candidatePath)) {
                                resolvedPath = candidatePath;
                                break;
                            }
                            
                            // Essayer aussi avec index si c'est un dossier
                            const indexCandidate = path.join(absPath, `index${ext}`);
                            if (fileNodeMap.has(indexCandidate)) {
                                resolvedPath = indexCandidate;
                                break;
                            }
                        }
                    }
                    // Note: La gestion des modules node_modules est omise intentionnellement
                    // pour le moment comme indiqué dans le commentaire original
                    
                    // Créer l'arête si la dépendance a été résolue
                    if (resolvedPath && fileNodeMap.has(resolvedPath)) {
                        edges.push({
                            source: result.filePath,
                            target: resolvedPath,
                            label: 'IMPORTS',
                            metadata: {
                                source: 'static-analysis',
                                timestamp: new Date().toISOString(),
                                originalDependency: dep
                            }
                        });
                    }
                } catch (error) {
                    console.warn(`[GraphBuilder] Erreur lors de la résolution de la dépendance '${dep}' dans ${result.filePath}:`, error);
                }
            }
        }

        return {
            metadata: {
                source: 'OrdoAbChaos-v2-Semantic',
                confidence: report.confidence,
                architectural_pattern: report.pattern,
                stack: report.stack,
                metrics: report.metrics,
            },
            nodes,
            edges,
        };
    }

    public calculateConfidenceScore(
        totalFiles: number,
        succeededFiles: number,
        failedFilesInfo: { path: string; isCritical: boolean }[]
    ): number {
        if (totalFiles === 0) return 1.0;

        let baseScore = succeededFiles / totalFiles;
        
        // Pénaliser pour chaque échec critique
        const criticalFailures = failedFilesInfo.filter(f => f.isCritical).length;
        const penalty = criticalFailures * 0.2; // 20% de pénalité par échec critique

        const finalScore = Math.max(0, baseScore - penalty);
        console.log(`[GraphBuilderService] Score de confiance calculé : ${finalScore.toFixed(2)}`);
        return finalScore;
    }
}