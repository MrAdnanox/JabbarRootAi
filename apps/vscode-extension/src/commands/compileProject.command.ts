// apps/vscode-extension/src/commands/compileProject.command.ts
import * as vscode from 'vscode';
import { ProjectTreeItem } from '../providers/projectTreeItem.factory';
import { ProjectService, BrickService, StatisticsService, BrickCompilationReport } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';

export function registerCompileProjectCommand(
    projectService: ProjectService,
    brickService: BrickService,
    statisticsService: StatisticsService,
    ignoreService: IgnoreService
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.compileProject', async (projectItem?: ProjectTreeItem) => {
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
    });
}

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