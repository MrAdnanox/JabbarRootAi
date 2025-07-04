// apps/vscode-extension/src/extension.ts
/**
 * @file Point d'entrée principal de l'extension VSCode JabbarRoot
 * @module Extension
 * @description Gère le cycle de vie de l'extension, l'initialisation et la configuration
 * 
 * @see {@link ExtensionBootstrapper} - Gestionnaire d'initialisation de l'extension
 * @see {@link ProjectService} - Service principal de gestion des projets
 */

import * as vscode from 'vscode';
import { getProjectRootPath } from './utils/workspace';
import { ExtensionBootstrapper } from './core/bootstrapper';

/**
 * Journalise les messages de l'extension
 * @param {string} message - Message à journaliser
 * @param {unknown} [data] - Données supplémentaires optionnelles
 */
const log = (message: string, data?: unknown): void => {
  console.log(`JabbarRoot: ${message}`, data || '');
};

/**
 * Active l'extension VSCode
 * 
 * ## Fonctionnalités
 * - Initialise le contexte de l'extension
 * - Charge la configuration du projet
 * - Configure les gestionnaires d'événements
 * 
 * ## Points d'attention
 * - Nécessite un dossier de travail valide
 * - Gère les erreurs d'initialisation
 * 
 * @param {vscode.ExtensionContext} context - Contexte d'extension VSCode
 * @returns {Promise<void>}
 */
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

/**
 * Nettoie les ressources lors de la désactivation de l'extension
 * 
 * @returns {void}
 */
export function deactivate(): void {
  log('Arrêt...');
}