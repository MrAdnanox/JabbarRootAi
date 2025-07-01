// apps/vscode-extension/src/commands/doc/generateReadme.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
// Importation directe depuis le Coeur Cognitif !
import { DocumentationService } from '@jabbarroot/prompt-factory';

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
    projects.map(p => ({
      label: p.name,
      description: p.projectRootPath,
      project: p,
      detail: `ID: ${p.id} | Chemin: ${p.projectRootPath}`
    })),
    { 
      title: 'Sélectionnez le projet pour générer le README',
      ignoreFocusOut: true
    }
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
    // 1. Récupération de la clé API
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée. Veuillez l\'ajouter dans `jabbarroot.gemini.apiKey`.');
      return;
    }
    
    // 2. Sélection du projet
    const project = await selectProject(projectService);
    if (!project) {
      return;
    }

    // 3. Démarrage du processus de génération avec suivi de progression
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarDoc: Generate README for "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Invocation of GenericAgentExecutor...' });
        
        // 3.1. Préparation du Cœur Cognitif...' });
        
        // APPEL DIRECT AU SERVICE DU PROMPT-FACTORY
        const startTime = Date.now();
        const readmeContent = await documentationService.generateReadme(project, apiKey);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('JabbReadme [registerGenerateReadmeCommand]: README generated successfully', {
          contentLength: readmeContent?.length || 0,
          duration: `${duration}s`
        });

        progress.report({ message: 'Preparing to display...' });
        const document = await vscode.workspace.openTextDocument({ 
          content: readmeContent, 
          language: 'markdown' 
        });
        
        await vscode.window.showTextDocument(document, { 
          preview: false, 
          viewColumn: vscode.ViewColumn.Beside 
        });
        
        // 3.4. Finalisation
        progress.report({ increment: 40 });
        const successMsg = `JabbarDoc: README generated successfully for "${project.name}" in ${duration}s !`;
        console.log('JabbReadme [registerGenerateReadmeCommand]: ' + successMsg);
        vscode.window.showInformationMessage(successMsg);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullError = `Error JabbarDoc: ${errorMessage}`;
        
        console.error('JabbReadme [registerGenerateReadmeCommand]: ' + fullError, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        });
        
        vscode.window.showErrorMessage(`Error JabbarDoc: ${errorMessage}`);
        throw error; // Propager pour le suivi des erreurs
      }
    });
    
    console.log('JabbReadme [registerGenerateReadmeCommand]: Command finished.');
  });
}