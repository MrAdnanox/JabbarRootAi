// apps/vscode-extension/src/commands/CompileProject.command.ts

/**
 * @file Commande pour compiler un projet JabbarRoot
 * @module CompileProjectCommand
 * @description Permet de compiler un projet JabbarRoot en rassemblant le contenu de toutes les briques actives.
 * La compilation inclut une analyse complète des fichiers, une compression intelligente et la génération d'un rapport détaillé.
 * @see {@link BrickService} pour la gestion des briques
 * @see {@link ProjectService} pour la gestion des projets
 * @see {@link StatisticsService} pour la génération des rapports
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectService, BrickService, StatisticsService, BrickCompilationReport } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';

/**
 * Commande pour compiler un projet JabbarRoot
 * 
 * ## Fonctionnalités
 * - Compile toutes les briques actives d'un projet
 * - Génère un rapport détaillé de la compilation
 * - Affiche les statistiques de compression
 * - Ouvre le résultat dans un nouvel onglet
 * 
 * ## Points d'attention
 * - Seules les briques marquées comme actives sont compilées
 * - La compilation peut prendre du temps pour les gros projets
 * - Les fichiers sont filtrés selon les règles d'ignore du projet
 */
export class CompileProjectCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.CompileProject',
        title: 'jabbarroot: Compile Project',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'brickService',
        'statisticsService',
        'ignoreService',
        'treeDataProvider'
    ] as const;

    /**
     * Exécute la commande de compilation de projet
     * @param services - Conteneur d'injection de dépendances
     * @param context - Contexte d'extension VSCode
     * @param projectItem - Élément d'arborescence du projet (optionnel)
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new CompileProjectCommand();
     * await command.execute(services, context, projectItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        context: vscode.ExtensionContext,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const statisticsService = services.get('statisticsService') as StatisticsService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const treeDataProvider = services.get('treeDataProvider') as any; // TODO: Importer le type correct de ProjectTreeDataProvider

        // Vérification du paramètre projectItem
        if (!projectItem || !(projectItem instanceof ProjectTreeItem)) {
            vscode.window.showErrorMessage('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }
        if (!projectItem || !(projectItem instanceof ProjectTreeItem)) {
            vscode.window.showErrorMessage('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }

        const project = projectItem.project;
        let finalContext = `--- COMPILED PROJECT: ${project.name} ---\n\n`;
        const allReports: BrickCompilationReport[] = [];
        let activeBricksCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `JabbarRoot: Compilation du projet "${project.name}"...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Recherche des briques actives...' });

            const activeBricks = [];
            for (const brickId of project.brickContextIds) {
                const brick = await brickService.getBrick(brickId);
                if (brick && brick.isActiveForProjectCompilation) {
                    activeBricks.push(brick);
                }
            }
            
            activeBricksCount = activeBricks.length;
            if (activeBricksCount === 0) {
                vscode.window.showWarningMessage(`Le projet "${project.name}" n'a aucune brique active à compiler.`);
                return;
            }

            for (let i = 0; i < activeBricks.length; i++) {
                const brick = activeBricks[i];
                progress.report({ message: `Compilation de la brique ${i + 1}/${activeBricksCount}: ${brick.name}`, increment: (100 / activeBricksCount) });

                const shouldIgnore = await ignoreService.createIgnorePredicate(project, brick);
                const structureGenOptions = {
                    maxDepth: project.options.defaultBrickIncludeProjectTreeMaxDepth,
                    shouldIgnore: shouldIgnore
                };

                const report = await statisticsService.generateBrickReport(brick, project, structureGenOptions);
                allReports.push(report);
                finalContext += `--- START OF BRICK: ${brick.name} ---\n\n`;
                finalContext += report.compiledContent;
                finalContext += `\n\n--- END OF BRICK: ${brick.name} ---\n\n`;
            }
        });

        // Génération du rapport global et affichage
        const summary = generateSummary(project.name, activeBricksCount, allReports);
        finalContext = summary + finalContext;

        const document = await vscode.workspace.openTextDocument({ content: finalContext, language: 'markdown' });
        await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });
        
        vscode.window.showInformationMessage(`Projet "${project.name}" compilé avec succès avec ${activeBricksCount} brique(s) active(s).`);
    }
}

export default new CompileProjectCommand();

/**
 * Génère un résumé de la compilation au format Markdown
 * @param projectName - Nom du projet compilé
 * @param brickCount - Nombre de briques compilées
 * @param reports - Rapports de compilation des briques
 * @returns {string} Résumé formaté en Markdown
 * 
 * @example
 * ```typescript
 * const summary = generateSummary('MonProjet', 3, reports);
 * ```
 */
function generateSummary(projectName: string, brickCount: number, reports: BrickCompilationReport[]): string {
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let totalOriginalTokens = 0;
    let totalCompressedTokens = 0;

    reports.forEach(report => {
        totalOriginalSize += report.totalOriginalSize;
        totalCompressedSize += report.totalCompressedSize;
        totalOriginalTokens += report.totalOriginalTokens;
        totalCompressedTokens += report.totalCompressedTokens;
    });

    const totalReduction = totalOriginalSize > 0 ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100) : 0;
    
    const summary = `
# RAPPORT DE COMPILATION DU PROJET : ${projectName}

## Résumé Global
- **Briques Actives Compilées:** ${brickCount}
- **Taille Totale (Original):** ${totalOriginalSize.toLocaleString()} caractères
- **Taille Totale (Compilé):** ${totalCompressedSize.toLocaleString()} caractères
- **Tokens Totaux (Estim. Original):** ${totalOriginalTokens.toLocaleString()} tokens
- **Tokens Totaux (Estim. Compilé):** ${totalCompressedTokens.toLocaleString()} tokens
- **Réduction Totale:** **${totalReduction}%**

---
`;
    return summary;
}