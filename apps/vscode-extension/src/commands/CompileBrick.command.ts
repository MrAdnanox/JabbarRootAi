import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { StatisticsService, ProjectService, StructureGenerationOptions } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';
import { NotificationService } from '../services/ui/notification.service';

export class CompileBrickCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.CompileBrick',
        title: 'Compile Brick Individually',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'statisticsService',
        'projectService',
        'ignoreService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        brickItem?: BrickTreeItem
    ): Promise<void> {
        const statisticsService = services.get('statisticsService') as StatisticsService;
        const projectService = services.get('projectService') as ProjectService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!brickItem || brickItem.contextValue !== 'jabbarrootBrick') {
            notificationService.showWarning('Veuillez sélectionner une brique valide à compiler.');
            return;
        }

        const brickToCompile = brickItem.brick;
        const parentProject = await projectService.getProject(brickToCompile.projectId);
        if (!parentProject) {
            notificationService.showError(`Projet parent (ID: ${brickToCompile.projectId}) introuvable.`);
            return;
        }

        await notificationService.withProgress(`Compilation de la brique "${brickToCompile.name}"...`, async () => {
            try {
                const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, brickToCompile);
                const structureGenOptions: StructureGenerationOptions = {
                    maxDepth: parentProject.options.defaultBrickIncludeProjectTreeMaxDepth ?? 7,
                    shouldIgnore: ignorePredicate,
                };

                const report = await statisticsService.generateBrickReport(
                    brickToCompile,
                    parentProject,
                    structureGenOptions
                );

                const title = `Brique "${report.brickName}" compilée`;
                const originalInfo = `${report.totalOriginalSize.toLocaleString()} chars | ~${report.totalOriginalTokens.toLocaleString()} tokens`;
                const finalInfo = `${report.totalCompressedSize.toLocaleString()} chars | ~${report.totalCompressedTokens.toLocaleString()} tokens`;
                const savedInfo = `Économie: ${report.totalReductionPercent}% (${(report.totalOriginalTokens - report.totalCompressedTokens).toLocaleString()} tokens)`;
                const message = `${title}\nOriginal: ${originalInfo}\nFinal: ${finalInfo}\n${savedInfo}\n${report.motivation}`;
                
                const actionShowAndCopy = '👁️ Afficher & Copier';
                const actionCopyOnly = '📋 Copier';

                const choice = await notificationService.showInfoWithActions(message, [
                    { title: actionShowAndCopy },
                    { title: actionCopyOnly }
                ]);

                if (choice === actionShowAndCopy || choice === actionCopyOnly) {
                    await vscode.env.clipboard.writeText(report.compiledContent);
                    if (choice === actionCopyOnly) {
                        // Utiliser une notification standard pour le statut "copié"
                        notificationService.showInfo(`Contenu de "${report.brickName}" copié !`);
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
                notificationService.showError(`Échec de la compilation de la brique "${brickToCompile.name}"`, error);
            }
        });
    }
}

export default new CompileBrickCommand();