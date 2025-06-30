// apps/vscode-extension/src/commands/doc/generateReadme.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { DocumentationService } from '../../services/documentation.service';

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
    { title: 'Sélectionnez le projet pour générer le README' }
  );
  return picked?.project;
}

// Fonction pour récupérer la clé API de manière sécurisée
function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

export function registerGenerateReadmeCommand(
  projectService: ProjectService,
  documentationService: DocumentationService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.doc.generateReadme', async () => {
    console.log('JabbLog [generateReadme]: Commande appelée');
    
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée. Veuillez l\'ajouter dans `jabbarroot.gemini.apiKey`.');
      return;
    }
    
    console.log('JabbLog [generateReadme]: Sélection du projet...');
    const project = await selectProject(projectService);
    if (!project) return;
    
    console.log('JabbLog: Projet sélectionné', { projectId: project.id });

    console.log('JabbLog: Démarrage de la génération end-to-end...');
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarDoc: Génération du README pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Assemblage du contexte...' });
        
        // C'est ici que la boucle est fermée
        progress.report({ message: 'Contact de l\'Agent Cognitif...' });
        const readmeContent = await documentationService.generateReadme(project, apiKey);

        // Afficher le résultat final
        progress.report({ message: 'Finalisation...' });
        const document = await vscode.workspace.openTextDocument({
          content: readmeContent,
          language: 'markdown'
        });
        await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });
        
        vscode.window.showInformationMessage(`JabbarDoc: README pour "${project.name}" généré avec succès !`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('JabbLog [generateReadme]: Erreur lors de la génération', { error: errorMessage });
        vscode.window.showErrorMessage(`Erreur JabbarDoc: ${errorMessage}`);
      }
    });
  });
}