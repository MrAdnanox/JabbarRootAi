import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectService, BrickService, StatisticsService, BrickCompilationReport } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { NotificationService } from '../services/ui/notification.service';

export class CompileProjectCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.CompileProject',
        title: 'jabbarroot: Compile Project',
        category: 'jabbarroot' as const,
    };
    public readonly dependencies = [
        'projectService',
        'brickService',
        'statisticsService',
        'ignoreService',
        'notificationService'
    ] as const;

    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        projectItem?: ProjectTreeItem
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const statisticsService = services.get('statisticsService') as StatisticsService;
        const ignoreService = services.get('ignoreService') as IgnoreService;
        const notificationService = services.get('notificationService') as NotificationService;

        if (!projectItem || projectItem.contextValue !== 'jabbarrootProject') {
            notificationService.showError('Veuillez lancer cette commande depuis la vue JabbarRoot sur un projet.');
            return;
        }

        const project = projectItem.project;
        let finalContext = `--- COMPILED PROJECT: ${project.name} ---\n\n`;
        const allReports: BrickCompilationReport[] = [];
        let activeBricksCount = 0;

        await notificationService.withProgress(`Compilation du projet "${project.name}"...`, async () => {
            const activeBricks = [];
            for (const brickId of project.brickContextIds) {
                const brick = await brickService.getBrick(brickId);
                if (brick && brick.isActiveForProjectCompilation) {
                    activeBricks.push(brick);
                }
            }
            activeBricksCount = activeBricks.length;
            if (activeBricksCount === 0) {
                notificationService.showWarning(`Le projet "${project.name}" n'a aucune brique active à compiler.`);
                return;
            }

            for (const brick of activeBricks) {
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

        if (activeBricksCount > 0) {
            const summary = this.generateSummary(project.name, activeBricksCount, allReports);
            finalContext = summary + finalContext;
            const document = await vscode.workspace.openTextDocument({ content: finalContext, language: 'markdown' });
            await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });
            notificationService.showInfo(`Projet "${project.name}" compilé avec succès avec ${activeBricksCount} brique(s) active(s).`);
        }
    }

    private generateSummary(projectName: string, brickCount: number, reports: BrickCompilationReport[]): string {
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
        return `
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
    }
}

export default new CompileProjectCommand();