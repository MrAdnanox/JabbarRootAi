// apps/vscode-extension/src/services/ui/dialog.service.ts

import * as vscode from 'vscode';
import { JabbarProject, ProjectService } from '@jabbarroot/core';
import { IService } from '../../core/interfaces';

// Interface pour les options de la boîte de dialogue
export interface AskQuestionOptions {
  prompt: string;
  placeHolder?: string;
  validateInput?: (value: string) => string | undefined | null;
}

// Interface pour les options de confirmation
export interface ConfirmationOptions {
    title: string;
    detail?: string;
    confirmActionLabel: string;
}

// Interface pour les items du QuickPick
export interface QuickPickItem<T> extends vscode.QuickPickItem {
    data: T; // La donnée sous-jacente que l'on veut récupérer
}

export interface QuickPickOptions<T> {
    title: string;
    placeholder?: string;
    items: QuickPickItem<T>[];
}

export class DialogService implements IService {
  constructor(private readonly projectService: ProjectService) {}

  public async showProjectPicker(): Promise<JabbarProject | undefined> {
    const projects = await this.projectService.getAllProjects();
    if (projects.length === 0) {
      return undefined;
    }

    const items = projects.map(project => ({
      label: project.name,
      description: project.projectRootPath,
      project
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Sélectionnez un projet',
      ignoreFocusOut: true
    });

    return selected?.project;
  }

  public async showConfigureApiKeyDialog(): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      'Clé API Gemini non configurée. Cliquez pour ouvrir les paramètres.', 
      { modal: true },
      'Ouvrir les Paramètres'
    );
    if (result === 'Ouvrir les Paramètres') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'jabbarroot.gemini.apiKey');
      return true;
    }
    return false;
  }

  /**
   * Affiche une boîte de dialogue pour poser une question à l'utilisateur.
   * @param options Les options de la question.
   * @returns La réponse de l'utilisateur ou undefined s'il annule.
   */
  public async askQuestion(options: AskQuestionOptions): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: options.prompt,
      placeHolder: options.placeHolder,
      validateInput: options.validateInput,
      ignoreFocusOut: true // Important pour ne pas fermer la boîte de dialogue accidentellement
    });
  }

  /**
   * Affiche un sélecteur de dossier natif.
   * @param options Options pour le dialogue, comme le titre.
   * @returns Le chemin du dossier sélectionné, ou undefined si annulé.
   */
  public async showFolderPicker(options: { title: string }): Promise<string | undefined> {
    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;

    const uris = await vscode.window.showOpenDialog({
      title: options.title,
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: defaultUri,
      openLabel: 'Sélectionner ce dossier'
    });

    if (uris && uris.length > 0) {
      return uris[0].fsPath;
    }
    return undefined;
  }

  /**
   * Affiche un dialogue de confirmation modal.
   * @param options Les options du dialogue.
   * @returns `true` si l'utilisateur a confirmé, `false` sinon.
   */
  public async showConfirmationDialog(options: ConfirmationOptions): Promise<boolean> {
    const selection = await vscode.window.showWarningMessage(
        options.title,
        {
            modal: true,
            detail: options.detail
        },
        options.confirmActionLabel
    );
    return selection === options.confirmActionLabel;
  }

  /**
   * Affiche un dialogue de sélection rapide (QuickPick) générique.
   * @param options Les options pour le QuickPick.
   * @returns La donnée de l'item sélectionné, ou undefined si annulé.
   */
  public async showQuickPick<T>(options: QuickPickOptions<T>): Promise<T | undefined> {
    const picked = await vscode.window.showQuickPick(options.items, {
        title: options.title,
        placeHolder: options.placeholder,
        matchOnDescription: true,
        matchOnDetail: true
    });
    return picked?.data;
  }
}