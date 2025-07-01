// FICHIER À REMPLACER: apps/vscode-extension/src/commands/brick/structureAnalyzer.command.ts

import * as vscode from 'vscode';
import { AnalyzerService } from '@jabbarroot/prompt-factory';
import { getProjectRootPath } from '../../utils/workspace';
import { 
  StructureGenerationService, 
  ProjectService, 
  JabbarProject, 
  StatisticsService 
} from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';
import * as path from 'path';
import * as fs from 'fs';

function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

async function selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
  const projects = await projectService.getAllProjects();
  if (projects.length === 0) {
    vscode.window.showWarningMessage('JabbarRoot: Aucun projet trouvé. Veuillez en créer un d\'abord.');
    return undefined;
  }
  if (projects.length === 1) {
    return projects[0];
  }
  const picked = await vscode.window.showQuickPick(
    projects.map(p => ({ label: p.name, description: p.projectRootPath, project: p })),
    { title: 'Sélectionnez le projet pour l\'analyse de structure' }
  );
  return picked?.project;
}

export function registerStructureAnalyzerCommand(
  analyzerService: AnalyzerService,
  structureService: StructureGenerationService,
  ignoreService: IgnoreService,
  projectService: ProjectService,
  statisticsService: StatisticsService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.brick.structureAnalyzer', async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée.');
      return;
    }

    // CORRECTION : On sélectionne un projet utilisateur, on ne crée plus de projet temporaire.
    const project = await selectProject(projectService);
    if (!project) {
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarRoot: Analyse de la structure pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Préparation des règles d\'ignorance...' });
        const shouldIgnore = await ignoreService.createIgnorePredicate(project);

        // ÉTAPE 1 : Calculer les statistiques de structure
        progress.report({ message: 'Calcul des statistiques de structure...' });
        const statsReport = await statisticsService.generateStructureStats(
          project.projectRootPath, 
          shouldIgnore
        );
        
        // Sauvegarder le rapport de statistiques
        const statsDir = path.join(project.projectRootPath, '.jabbarroot_data', 'reports');
        await fs.promises.mkdir(statsDir, { recursive: true });
        const statsFilePath = path.join(statsDir, 'structure-stats.json');
        await fs.promises.writeFile(
          statsFilePath, 
          JSON.stringify(statsReport, null, 2),
          'utf-8'
        );

        progress.report({ message: 'Génération de l\'arborescence du projet...' });
        const treeReport = await structureService.generate(project.projectRootPath, {
          maxDepth: 8,
          shouldIgnore: shouldIgnore
        });
        const fileTree = treeReport?.tree || '';

        progress.report({ message: 'Invocation de l\'analyseur...' });
        // On passe le projet, l'arborescence, les statistiques et la clé API à l'analyseur
        const report = await analyzerService.analyzeStructure(
          project, 
          fileTree, 
          JSON.stringify(statsReport, null, 2),
          apiKey
        );

        progress.report({ message: 'Affichage du rapport JSON...' });
        const reportContent = JSON.stringify(report, null, 2);
        const document = await vscode.workspace.openTextDocument({ content: reportContent, language: 'json' });
        await vscode.window.showTextDocument(document, { preview: false });
        
        // Rafraîchir la vue pour afficher les nouveaux artefacts
        await vscode.commands.executeCommand('jabbarroot.refreshProjectView');

        vscode.window.showInformationMessage('Analyse de structure terminée et mémorisée !');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Erreur de l'analyseur: ${errorMessage}`);
      }
    });
  });
}