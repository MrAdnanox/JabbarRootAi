// apps/vscode-extension/src/commands/compileBrick.command.ts
import * as vscode from 'vscode';
import {
    BrickConstructorService,
    StatisticsService,
    ProjectService, // Pour récupérer le projet parent
    BrickContext,   // Pour le typage
    JabbarProject,  // Pour le typage
    StructureGenerationOptions, // Options de génération de structure
    ContextStats    // Statistiques de compilation
} from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service'; // Service local à l'extension
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
                    progress.report({ message: 'Préparation des options d\'ignore...' });
                    const ignorePredicate = await ignoreService.createIgnorePredicate(parentProject, brickToCompile);
                    const structureGenOptions: StructureGenerationOptions = {
                        // maxDepth peut venir des options de la brique/projet ou être une constante ici
                        maxDepth: parentProject.options.defaultBrickIncludeProjectTreeMaxDepth ?? 7, // Exemple d'une nouvelle option potentielle
                        shouldIgnore: ignorePredicate,
                    };

                    progress.report({ message: 'Assemblage du contexte de la brique...' });
                    const compiledContext = await brickConstructorService.compileBrick(
                        brickToCompile,
                        parentProject,
                        structureGenOptions
                    );

                    progress.report({ message: 'Calcul des statistiques...' });
                    const stats: ContextStats = await statisticsService.calculateBrickStats(
                        brickToCompile,
                        parentProject,
                        structureGenOptions
                    );

                    // Affichage des résultats et statistiques (similaire à l'ancienne commande)
                    const title = `JabbarRoot: Brique "${brickToCompile.name}" compilée`;
                    const originalSize = `${stats.originalChars.toLocaleString()} chars / ~${stats.originalTokensApprox.toLocaleString()} tokens`;
                    const finalSize = `${stats.compressedChars.toLocaleString()} chars / ~${stats.compressedTokensApprox.toLocaleString()} tokens`;
                    const saved = `${stats.savedChars.toLocaleString()} chars / ~${stats.savedTokensApprox.toLocaleString()} tokens (${stats.reductionPercent}%)`;
                    const motivation = stats.motivation;

                    const message = `${title}\nOriginal: ${originalSize}\nFinal: ${finalSize}\nÉconomie: ${saved}\n${motivation}`;
                    
                    const actionShowAndCopy = '👁️ Afficher & Copier';
                    const actionCopyOnly = '📋 Copier Seulement';
                    const choice = await vscode.window.showInformationMessage(message, { modal: true }, actionShowAndCopy, actionCopyOnly);

                    if (choice === actionShowAndCopy || choice === actionCopyOnly) {
                        await vscode.env.clipboard.writeText(compiledContext);
                        if (choice === actionCopyOnly) {
                            vscode.window.setStatusBarMessage(`JabbarRoot: Brique "${brickToCompile.name}" copiée!`, 5000);
                        }
                    }
                    if (choice === actionShowAndCopy) {
                        const document = await vscode.workspace.openTextDocument({
                            content: compiledContext,
                            language: 'markdown', // Ou un langage plus approprié si le contexte a un format spécifique
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