// apps/vscode-extension/src/commands/CompileBrick.command.ts

/**
 * @file Commande pour compiler une brique JabbarRoot
 * @module CompileBrickCommand
 * @description Permet de compiler une brique individuelle dans un projet JabbarRoot.
 * La compilation inclut l'analyse des fichiers, l'application des règles d'ignore
 * et la génération d'un rapport de compilation.
 * @see {@link BrickConstructorService} pour la logique de construction des briques
 * @see {@link StatisticsService} pour la génération des rapports
 * @see {@link ProjectService} pour la gestion des projets
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { 
    BrickConstructorService, 
    StatisticsService, 
    ProjectService, 
    StructureGenerationOptions
} from '@jabbarroot/core';
import type { BrickCompilationReport } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';

/**
 * Commande pour compiler une brique individuelle dans un projet JabbarRoot
 * 
 * ## Fonctionnalités
 * - Compile le contenu d'une brique spécifique
 * - Applique les règles d'ignore du projet et de la brique
 * - Génère un rapport de compilation
 * - Rafraîchit l'interface utilisateur après compilation
 * 
 * ## Points d'attention
 * - Nécessite qu'une brique soit sélectionnée dans l'interface
 * - Le projet parent doit être correctement configuré
 * - Les règles d'ignore sont appliquées pendant la compilation
 */
export class CompileBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.CompileBrick',
        title: 'Compile Brick Individually',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'brickConstructorService',
        'statisticsService',
        'projectService',
        'ignoreService',
        'treeDataProvider'
    ] as const;

    /**
     * Exécute la commande de compilation d'une brique
     * @param services - Conteneur d'injection de dépendances
     * @param brickItem - Élément d'arborescence de la brique à compiler
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new CompileBrickCommand();
     * await command.execute(services, brickItem);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem: BrickTreeItem | undefined
    ): Promise<void> {
        const statisticsService = services.get('statisticsService') as StatisticsService;
        const projectService = services.get('projectService') as ProjectService;
        const ignoreService = services.get('ignoreService') as IgnoreService;

        // Vérification stricte du type et de la validité de brickItem
        if (!brickItem || !this.isValidBrickSelection(brickItem)) {
            vscode.window.showWarningMessage('Veuillez sélectionner une brique valide à compiler.');
            return;
        }

        // À ce stade, TypeScript sait que brickItem est défini et valide
        const brickToCompile = brickItem.brick;
        const parentProject = await projectService.getProject(brickToCompile.projectId);
        if (!parentProject) {
            vscode.window.showErrorMessage(`Projet parent (ID: ${brickToCompile.projectId}) introuvable.`);
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `JabbarRoot: Compilation de la brique "${brickToCompile.name}"...`,
            cancellable: false,
        }, async (progress) => {
            try {
                progress.report({ message: 'Préparation des options...' });
                const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, brickToCompile);
                const structureGenOptions: StructureGenerationOptions = {
                    maxDepth: parentProject.options.defaultBrickIncludeProjectTreeMaxDepth ?? 7,
                    shouldIgnore: ignorePredicate,
                };

                progress.report({ message: 'Génération du rapport de compilation...' });
                const report: BrickCompilationReport = await statisticsService.generateBrickReport(
                    brickToCompile,
                    parentProject,
                    structureGenOptions
                );

                // Afficher le rapport de compilation à l'utilisateur
                const title = `JabbarRoot: Brique "${report.brickName}" compilée`;
                const originalInfo = `${report.totalOriginalSize.toLocaleString()} chars | ~${report.totalOriginalTokens.toLocaleString()} tokens`;
                const finalInfo = `${report.totalCompressedSize.toLocaleString()} chars | ~${report.totalCompressedTokens.toLocaleString()} tokens`;
                const savedInfo = `Économie: ${report.totalReductionPercent}% (${(report.totalOriginalTokens - report.totalCompressedTokens).toLocaleString()} tokens)`;
                const message = `${title}\nOriginal: ${originalInfo}\nFinal: ${finalInfo}\n${savedInfo}\n${report.motivation}`;
                
                const actionShowAndCopy = '👁️ Afficher & Copier';
                const actionCopyOnly = '📋 Copier';

                const choice = await vscode.window.showInformationMessage(
                    message, 
                    { modal: true }, 
                    actionShowAndCopy, 
                    actionCopyOnly
                );

                if (choice === actionShowAndCopy || choice === actionCopyOnly) {
                    await vscode.env.clipboard.writeText(report.compiledContent);
                    if (choice === actionCopyOnly) {
                        vscode.window.setStatusBarMessage(`JabbarRoot: Contenu de "${report.brickName}" copié !`, 5000);
                    }
                }

                if (choice === actionShowAndCopy) {
                    const document = await vscode.workspace.openTextDocument({
                        content: report.compiledContent,
                        language: 'markdown',
                    });
                    await vscode.window.showTextDocument(document, { preview: true });
                }

            } catch (error) {
                console.error(`Erreur lors de la compilation de la brique "${brickToCompile.name}":`, error);
                vscode.window.showErrorMessage(`Échec de la compilation: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }

    /**
     * Vérifie si la sélection de brique est valide
     * @param brickItem - Élément d'arborescence de la brique à vérifier
     * @returns {boolean} true si la brique est valide, false sinon
     */
    private isValidBrickSelection(brickItem: BrickTreeItem | undefined): boolean {
        // Vérification robuste du type et du contexte
        if (!brickItem || typeof brickItem !== 'object') {
            return false;
        }
        
        // Vérification du contextValue et de l'objet brick
        return 'contextValue' in brickItem && 
               brickItem.contextValue === 'jabbarrootBrick' && 
               'brick' in brickItem && 
               !!brickItem.brick?.id;
    }
}

export default new CompileBrickCommand();
