import * as vscode from 'vscode';
import { IService } from '../../core/interfaces';

// Nouvelle interface pour les actions
export interface NotificationAction {
    title: string;
}

export class NotificationService implements IService {
  public showInfo(message: string): void {
    vscode.window.showInformationMessage(`JabbarRoot: ${message}`);
  }

  public showWarning(message: string): void {
    vscode.window.showWarningMessage(`JabbarRoot: ${message}`);
  }

  public showError(message: string, error?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Erreur inconnue');
    console.error(`[JabbarRoot ERROR] ${message}:`, error);
    vscode.window.showErrorMessage(`JabbarRoot: ${message} - ${errorMessage}`);
  }

  public async withProgress<T>(title: string, task: () => Promise<T>): Promise<T> {
    return await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarRoot: ${title}`,
      cancellable: false
    }, async () => { // On retire l'argument 'progress' s'il n'est pas utilisé pour simplifier
      return await task();
    });
  }

  /**
   * Affiche une notification d'information avec des boutons d'action.
   * @param message Le message principal à afficher.
   * @param actions Les actions proposées à l'utilisateur.
   * @returns Le titre de l'action cliquée, ou undefined si la notification est fermée.
   */
  public async showInfoWithActions(message: string, actions: NotificationAction[]): Promise<string | undefined> {
    const actionTitles = actions.map(a => a.title);
    const result = await vscode.window.showInformationMessage(
        `JabbarRoot: ${message}`,
        { modal: true },
        ...actionTitles
    );
    return result;
  }
}