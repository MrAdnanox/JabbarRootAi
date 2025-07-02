// apps/vscode-extension/src/commands/doc/generateReadme.command.ts
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { DocumentationService, AnalyzerService } from '@jabbarroot/prompt-factory'; // Importer AnalyzerService

// Cette fonction est maintenant redondante car le workflow l'exigera.
// On la garde pour une expérience utilisateur fluide.
async function ensureArchitecturalReportExists(project: JabbarProject, analyzerService: AnalyzerService): Promise<boolean> {
    const artefactBrick = await analyzerService.findArtefactBrick(project);
    if (!artefactBrick) {
        const response = await vscode.window.showWarningMessage(
            `Le rapport architectural pour le projet "${project.name}" est introuvable. Il est nécessaire pour générer un README de qualité.`,
            { modal: true },
            "Analyser la structure maintenant"
        );
        if (response === "Analyser la structure maintenant") {
            await vscode.commands.executeCommand('jabbarroot.brick.structureAnalyzer');
            // Vérifier à nouveau après l'exécution
            const newArtefactBrick = await analyzerService.findArtefactBrick(project);
            return !!newArtefactBrick;
        }
        return false;
    }
    return true;
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
    { title: 'Sélectionnez le projet pour générer le README' }
  );
  return picked?.project;
}

function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

export function registerGenerateReadmeCommand(
  projectService: ProjectService,
  documentationService: DocumentationService,
  analyzerService: AnalyzerService // Injecter AnalyzerService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.doc.generateReadme', async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API Gemini non configurée. Veuillez l\'ajouter dans `jabbarroot.gemini.apiKey`.');
      return;
    }

    const project = await selectProject(projectService);
    if (!project) {
      return;
    }
    
    // Étape de pré-vérification pour une meilleure UX
    const canProceed = await ensureArchitecturalReportExists(project, analyzerService);
    if (!canProceed) {
        vscode.window.showErrorMessage("Génération du README annulée car le rapport architectural est manquant.");
        return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarDoc: Génération du README pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Invocation de l\'agent Ambassadeur...' });
        const startTime = Date.now();

        // L'appel au service est maintenant la seule opération complexe
        const readmeContent = await documentationService.generateReadme(project, apiKey);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`JabbReadme: README généré. Longueur: ${readmeContent?.length}, Durée: ${duration}s`);
        
        progress.report({ message: 'Affichage du document...' });

        // Affichage du résultat final, qui est maintenant le vrai contenu du README
        const document = await vscode.workspace.openTextDocument({ content: readmeContent, language: 'markdown' });
        await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });

        const successMsg = `JabbarDoc: README généré avec succès pour "${project.name}" en ${duration}s !`;
        vscode.window.showInformationMessage(successMsg);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erreur JabbarDoc: ${errorMessage}`, error);
        vscode.window.showErrorMessage(`Erreur JabbarDoc: ${errorMessage}`);
      }
    });
  });
}