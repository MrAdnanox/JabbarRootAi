import * as vscode from 'vscode';
import { IService } from '../../core/interfaces';

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

  // CORRECTION : La signature de 'task' accepte maintenant le paramètre 'progress'.
  public async withProgress<T>(
    title: string, 
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
  ): Promise<T> {
    return await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `JabbarRoot: ${title}`,
      cancellable: false
    }, async (progress) => { // L'API de VS Code nous donne l'objet 'progress' ici.
      // CORRECTION : Nous passons l'objet 'progress' à la tâche fournie.
      return await task(progress);
    });
  }

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