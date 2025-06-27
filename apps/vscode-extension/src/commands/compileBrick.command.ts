// apps/vscode-extension/src/commands/compileBrick.command.ts
import * as vscode from 'vscode';
import {
    BrickConstructorService,
    StatisticsService,
    ProjectService,
    BrickContext,
    JabbarProject,
    StructureGenerationOptions,
    BrickCompilationReport
} from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { ProjectTreeDataProvider } from '../providers/projectTreeDataProvider';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

export function registerCompileBrickCommand(
    brickConstructorService: BrickConstructorService,
    statisticsService: StatisticsService,
    projectService: ProjectService,
    ignoreService: IgnoreService,
    treeDataProvider: ProjectTreeDataProvider // Pour rafraîchir si besoin, ou pas nécessaire pour cette commande
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.compileBrick', async (brickItem?: BrickTreeItem) => {
        if (!brickItem || !(brickItem instanceof BrickTreeItem)) {
            vscode.window.showWarningMessage('Veuillez sélectionner une brique à compiler.');
            return;
        }
        const brickToCompile = brickItem.brick;

        const parentProject = await projectService.getProject(brickToCompile.projectId);
        if (!parentProject) {
            vscode.window.showErrorMessage(`Projet parent (ID: ${brickToCompile.projectId}) introuvable pour la brique "${brickToCompile.name}".`);
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `JabbarRoot: Compilation de la brique "${brickToCompile.name}"...`,
                cancellable: false, // ou true si on implémente l'annulation
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Préparation des options...' });
                    const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, brickToCompile);
                    const structureGenOptions: StructureGenerationOptions = {
                        maxDepth: parentProject.options.defaultBrickIncludeProjectTreeMaxDepth ?? 7,
                        shouldIgnore: ignorePredicate,
                    };

                    progress.report({ message: 'Génération du rapport de compilation...' });
                    // Utilisation de la nouvelle méthode du service de statistiques
                    const report: BrickCompilationReport = await statisticsService.generateBrickReport(
                        brickToCompile,
                        parentProject,
                        structureGenOptions
                    );

                    // Formatage du message pour la notification
                    const title = `JabbarRoot: Brique "${report.brickName}" compilée`;
                    const originalInfo = `${report.totalOriginalSize.toLocaleString()} chars | ~${report.totalOriginalTokens.toLocaleString()} tokens`;
                    const finalInfo = `${report.totalCompressedSize.toLocaleString()} chars | ~${report.totalCompressedTokens.toLocaleString()} tokens`;
                    const savedInfo = `Économie: ${report.totalReductionPercent}% (${(report.totalOriginalTokens - report.totalCompressedTokens).toLocaleString()} tokens)`;

                    const message = `${title}\nOriginal: ${originalInfo}\nFinal: ${finalInfo}\n${savedInfo}\n${report.motivation}`;

                    // Actions de la notification
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
                            vscode.window.setStatusBarMessage(
                                `JabbarRoot: Contenu de "${report.brickName}" copié !`, 
                                5000
                            );
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
                    vscode.window.showErrorMessage(
                        `Échec de la compilation: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        );
    });
}