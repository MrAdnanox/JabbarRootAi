// FICHIER À REMPLACER: apps/vscode-extension/src/commands/brick/structureAnalyzer.command.ts

import * as vscode from 'vscode';
import { AnalyzerService } from '@jabbarroot/prompt-factory';
import { getProjectRootPath } from '../../utils/workspace';
import { StructureGenerationService, ProjectService, JabbarProject } from '@jabbarroot/core';
import { IgnoreService } from '../../services/ignore.service';

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
  projectService: ProjectService // S'assurer que c'est bien injecté
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

        progress.report({ message: 'Génération de l\'arborescence du projet...' });
        const treeReport = await structureService.generate(project.projectRootPath, {
          maxDepth: 8,
          shouldIgnore: shouldIgnore
        });
        const fileTree = treeReport?.tree || '';

        progress.report({ message: 'Invocation de l\'analyseur...' });
        // CORRECTION : On passe le projet sélectionné à l'analyseur
        const report = await analyzerService.analyzeStructure(project, fileTree, apiKey);

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