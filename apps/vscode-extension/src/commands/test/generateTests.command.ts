// apps/vscode-extension/src/commands/test/generateTests.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { UnitTestGeneratorService } from '../../services';

// Helper pour permettre à l'utilisateur de choisir un projet si plusieurs existent
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
    { title: 'Sélectionnez le projet pour générer les tests unitaires' }
  );
  return picked?.project;
}

// Fonction pour récupérer la clé API de manière sécurisée
function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

export function registerGenerateTestsCommand(
  projectService: ProjectService,
  testGenerator: UnitTestGeneratorService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.test.generateTests', async () => {
    console.log('JabbLog [generateTests]: Commande appelée');
    
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée. Veuillez l\'ajouter dans `jabbarroot.gemini.apiKey`.');
      return;
    }
    
    console.log('JabbLog [generateTests]: Sélection du projet...');
    const project = await selectProject(projectService);
    if (!project) return;
    
    console.log('JabbLog: Projet sélectionné pour génération de tests', { projectId: project.id });

    console.log('JabbLog: Démarrage de la génération des tests...');
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarTest: Génération des tests unitaires pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Analyse du code source...' });
        
        progress.report({ message: 'Contact de l\'Agent de Test...' });
        const testContent = await testGenerator.generateTests(project, apiKey);

        // Afficher le résultat final dans un nouvel onglet
        progress.report({ message: 'Finalisation...' });
        const document = await vscode.workspace.openTextDocument({
          content: testContent,
          language: 'typescript' // À adapter selon le langage du projet
        });
        await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });
        
        vscode.window.showInformationMessage(`JabbarTest: Tests unitaires pour "${project.name}" générés avec succès !`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('JabbLog [generateTests]: Erreur lors de la génération', { error: errorMessage });
        vscode.window.showErrorMessage(`Erreur JabbarTest: ${errorMessage}`);
      }
    });
  });
}
