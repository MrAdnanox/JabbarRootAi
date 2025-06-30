// apps/vscode-extension/src/commands/doc/generateReadme.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { DocumentationService } from '../../services/documentation.service';

// Helper pour permettre à l'utilisateur de choisir un projet si plusieurs existent
async function selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
  console.log('JabbReadme [selectProject]: Début de la sélection du projet');
  
  console.log('JabbReadme [selectProject]: Récupération de tous les projets...');
  const projects = await projectService.getAllProjects();
  console.log(`JabbReadme [selectProject]: ${projects.length} projet(s) trouvé(s)`, 
    projects.map(p => ({ id: p.id, name: p.name })));
  
  if (projects.length === 0) {
    console.warn('JabbReadme [selectProject]: Aucun projet trouvé');
    vscode.window.showWarningMessage('JabbarRoot: Aucun projet trouvé. Veuillez en créer un d\'abord.');
    return undefined;
  }
  
  if (projects.length === 1) {
    console.log('JabbReadme [selectProject]: Un seul projet trouvé, sélection automatique', {
      id: projects[0].id,
      name: projects[0].name
    });
    return projects[0];
  }

  console.log('JabbReadme [selectProject]: Affichage du sélecteur de projet');
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
  
  console.log('JabbReadme [selectProject]: Projet sélectionné', 
    picked ? { id: picked.project.id, name: picked.project.name } : 'Aucun');
    
  return picked?.project;
}

// Fonction pour récupérer la clé API de manière sécurisée
function getApiKey(): string | undefined {
  console.log('JabbReadme [getApiKey]: Récupération de la clé API...');
  const apiKey = vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
  console.log('JabbReadme [getApiKey]: Clé API', 
    apiKey ? 'trouvée' : 'non trouvée (vérifiez la configuration)');
  return apiKey;
}

export function registerGenerateReadmeCommand(
  projectService: ProjectService,
  documentationService: DocumentationService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.doc.generateReadme', async () => {
    console.log('JabbReadme [registerGenerateReadmeCommand]: Initialisation de la commande');
    
    // 1. Récupération de la clé API
    console.log('JabbReadme [registerGenerateReadmeCommand]: Vérification de la clé API');
    const apiKey = getApiKey();
    if (!apiKey) {
      const errorMsg = 'Clé API Gemini non configurée. Veuillez l\'ajouter dans `jabbarroot.gemini.apiKey`.';
      console.error('JabbReadme [registerGenerateReadmeCommand]: ' + errorMsg);
      vscode.window.showErrorMessage(errorMsg);
      return;
    }
    
    // 2. Sélection du projet
    console.log('JabbReadme [registerGenerateReadmeCommand]: Début de la sélection du projet');
    const project = await selectProject(projectService);
    if (!project) {
      console.log('JabbReadme [registerGenerateReadmeCommand]: Aucun projet sélectionné, arrêt du processus');
      return;
    }
    
    console.log('JabbReadme [registerGenerateReadmeCommand]: Projet sélectionné', {
      id: project.id,
      name: project.name,
      path: project.projectRootPath,
      brickCount: project.brickContextIds?.length || 0
    });

    // 3. Démarrage du processus de génération avec suivi de progression
    console.log('JabbReadme [registerGenerateReadmeCommand]: Démarrage du processus de génération');
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarDoc: Génération du README pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        // 3.1. Préparation du contexte
        console.log('JabbReadme [registerGenerateReadmeCommand]: Préparation du contexte');
        progress.report({ message: 'Préparation du contexte...', increment: 10 });
        
        // 3.2. Génération du README
        console.log('JabbReadme [registerGenerateReadmeCommand]: Appel au service de documentation');
        progress.report({ 
          message: 'Génération du contenu avec IA...',
          increment: 30 
        });
        
        const startTime = Date.now();
        const readmeContent = await documentationService.generateReadme(project, apiKey);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('JabbReadme [registerGenerateReadmeCommand]: README généré avec succès', {
          contentLength: readmeContent?.length || 0,
          duration: `${duration}s`
        });

        // 3.3. Affichage du résultat
        progress.report({ 
          message: 'Préparation de l\'affichage...',
          increment: 20 
        });
        
        console.log('JabbReadme [registerGenerateReadmeCommand]: Ouverture du document généré');
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
        const successMsg = `JabbarDoc: README pour "${project.name}" généré avec succès en ${duration}s !`;
        console.log('JabbReadme [registerGenerateReadmeCommand]: ' + successMsg);
        vscode.window.showInformationMessage(successMsg);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullError = `Erreur lors de la génération du README: ${errorMessage}`;
        
        console.error('JabbReadme [registerGenerateReadmeCommand]: ' + fullError, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        });
        
        vscode.window.showErrorMessage(`Erreur JabbarDoc: ${errorMessage}`);
        throw error; // Propager pour le suivi des erreurs
      }
    });
    
    console.log('JabbReadme [registerGenerateReadmeCommand]: Processus de génération terminé');
  });
}