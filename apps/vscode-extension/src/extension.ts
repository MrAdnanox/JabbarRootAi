import * as vscode from 'vscode';
// CORRECTION : Ajouter l'extension .js aux imports relatifs.
import { getProjectRootPath } from './utils/workspace.js';
import { ExtensionBootstrapper } from './core/bootstrapper.js';

const log = (message: string, data?: unknown): void => {
  console.log(`JabbarRoot: ${message}`, data || '');
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log('Démarrage...');
  const projectRootPath = getProjectRootPath();
  if (!projectRootPath) {
    vscode.window.showWarningMessage('Ouvre un dossier de travail pour activer JabbarRoot.');
    return;
  }
  try {
    const { dispose } = await ExtensionBootstrapper.activate(context, projectRootPath);
    context.subscriptions.push({ dispose });
    log('Prêt');
    vscode.window.showInformationMessage('JabbarRoot: Prêt');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    log(`ERREUR: ${errorMessage}`, error);
    vscode.window.showErrorMessage(`Erreur JabbarRoot: ${errorMessage}`);
  }
}

export function deactivate(): void {
  log('Arrêt...');
}