// apps/vscode-extension/src/services/ui/dialog.service.ts

import * as vscode from 'vscode';
import { JabbarProject, BrickContext } from '@jabbarroot/types';
import { ProjectService } from '@jabbarroot/core';
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

export type AnalysisScopeMode = 'surgical' | 'exploration' | 'exhaustive';

export interface AnalysisScopeModeItem extends vscode.QuickPickItem {
    mode: AnalysisScopeMode;
}

// Interface pour clarifier le type des items du QuickPick
interface BrickQuickPickItem extends vscode.QuickPickItem {
    data: BrickContext;
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
    const selected = await vscode.window.showQuickPick(
        options.items.map(item => ({
            label: item.label,
            description: item.description,
            detail: item.detail,
            picked: item.picked,
            alwaysShow: item.alwaysShow,
            data: item.data
        })),
        {
            title: options.title,
            placeHolder: options.placeholder,
            ignoreFocusOut: true,
            canPickMany: false
        }
    );

    return selected?.data;
  }

  /**
   * Affiche un dialogue de sélection du mode d'analyse.
   * @returns Le mode d'analyse sélectionné, ou undefined si annulé.
   */
  public async showAnalysisScopePicker(): Promise<AnalysisScopeMode | undefined> {
    const items: AnalysisScopeModeItem[] = [
        {
            label: '🎯 Mode Chirurgical',
            description: 'Analyser uniquement les fichiers clés identifiés par l\'IA.',
            mode: 'surgical',
        },
        {
            label: '🧭 Mode Exploration',
            description: 'Sélectionner manuellement les briques à inclure dans l\'analyse.',
            mode: 'exploration',
        },
        {
            label: '💥 Mode Exhaustif',
            description: 'Analyser TOUS les fichiers du projet (peut être long et coûteux).',
            mode: 'exhaustive',
        },
    ];

    const picked = await vscode.window.showQuickPick(items, {
        title: 'Ordo Ab Chaos - Étape 2/3 : Définir la Portée de l\'Analyse',
        placeHolder: 'Choisissez la granularité de l\'analyse sémantique',
        ignoreFocusOut: true,
    });

    return picked?.mode;
  }

  /**
   * Affiche un dialogue de sélection des briques pour le mode Exploration.
   * @param project Le projet en cours.
   * @param brickService Le service de gestion des briques.
   * @returns Les chemins des fichiers sélectionnés, ou undefined si annulé.
   */
  // NOUVELLE MÉTHODE : Sélection des briques pour le mode Exploration
  public async showBrickMultiPicker(project: JabbarProject, brickService: any): Promise<string[] | undefined> {
    const bricks = await brickService.getBricksByProjectId(project.id);
    // CORRECTION : Ajout du type explicite pour 'b'
    const items: BrickQuickPickItem[] = bricks.map((b: BrickContext) => ({
        label: b.name,
        description: `${b.files_scope.length} fichier(s)`,
        picked: !b.name.startsWith('[ARTEFACT]'),
        data: b
    }));

    const selectedItems = await vscode.window.showQuickPick(items, {
        title: 'Mode Exploration - Sélection des Briques',
        placeHolder: 'Cochez les briques à inclure dans l\'analyse',
        canPickMany: true,
        ignoreFocusOut: true
    });

    if (!selectedItems || selectedItems.length === 0) {
        return undefined;
    }

    // CORRECTION : Ajout du type explicite pour 'item'
    const allFilePaths = selectedItems.flatMap((item: BrickQuickPickItem) => item.data.files_scope);
    return [...new Set(allFilePaths)];
  }
}