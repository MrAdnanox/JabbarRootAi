// apps/vscode-extension/src/commands/brick/structureAnalyzer.command.ts

import * as vscode from 'vscode';
import { AnalyzerService } from '@jabbarroot/prompt-factory';
import { 
  StructureGenerationService, 
  ProjectService, 
  JabbarProject
} from '@jabbarroot/core';
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

// L'ordre des dépendances est crucial et doit correspondre à celui dans extension.ts
export function registerStructureAnalyzerCommand(
  analyzerService: AnalyzerService,
  structureService: StructureGenerationService,
  ignoreService: IgnoreService,
  projectService: ProjectService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.brick.structureAnalyzer', async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée.');
      return;
    }

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
        
        // La commande ne fait que générer l'arborescence.
        // Le calcul des stats et la persistance sont délégués aux services du Cœur Cognitif.
        progress.report({ message: 'Génération de l\'arborescence du projet...' });
        const treeReport = await structureService.generate(project.projectRootPath, {
          maxDepth: 8, // Cette valeur pourrait venir des options du projet
          shouldIgnore: shouldIgnore
        });
        const fileTree = treeReport?.tree || '';

        progress.report({ message: 'Invocation de l\'analyseur...' });
        
        // On appelle la méthode d'orchestration principale.
        // La sauvegarde des stats est maintenant une responsabilité interne du service.
        const finalReport = await analyzerService.analyzeStructureAndPersist(
          project, 
          fileTree, 
          apiKey
        );
        
        console.log('[StructureAnalyzerCommand] Analyse de structure et persistance terminées avec succès.');

        progress.report({ message: 'Affichage du rapport JSON...' });
        const reportContent = JSON.stringify(finalReport, null, 2);
        const document = await vscode.workspace.openTextDocument({ content: reportContent, language: 'json' });
        await vscode.window.showTextDocument(document, { preview: false });
        
        await vscode.commands.executeCommand('jabbarroot.refreshProjectView');

        vscode.window.showInformationMessage('Analyse de structure terminée et mémorisée !');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erreur de l'analyseur: ${errorMessage}`, error);
        vscode.window.showErrorMessage(`Erreur de l'analyseur: ${errorMessage}`);
      }
    });
  });
}