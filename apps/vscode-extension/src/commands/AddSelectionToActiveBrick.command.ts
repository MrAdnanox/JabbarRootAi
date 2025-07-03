// apps/vscode-extension/src/commands/AddSelectionToActiveBrick.command.ts

/**
 * @file Commande pour ajouter des fichiers à la brique active JabbarRoot
 * @module AddSelectionToActiveBrickCommand
 * @description Permet d'ajouter des fichiers ou dossiers sélectionnés à la brique active.
 * Gère la sélection multiple, la récursion dans les dossiers et le respect des règles d'ignore.
 * @see {@link BrickService} pour la gestion des briques
 * @see {@link ProjectService} pour la gestion des projets
 * @see {@link IgnoreService} pour la gestion des règles d'ignore
 */

import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../core/interfaces';
import { BrickService, ProjectService } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { getFilesRecursively } from '../utils/workspace';

/**
 * Commande pour ajouter des fichiers ou dossiers à la brique active
 * 
 * ## Fonctionnalités
 * - Ajoute des fichiers ou dossiers sélectionnés à la brique active
 * - Gère la sélection multiple et la récursion dans les dossiers
 * - Respecte les règles d'ignore du projet et de la brique
 * - Rafraîchit automatiquement la vue après l'ajout
 * 
 * ## Points d'attention
 * - Nécessite qu'une brique de collecte soit définie
 * - Seuls les fichiers non ignorés sont ajoutés
 * - Les doublons sont automatiquement évités
 */
export class AddSelectionToActiveBrickCommand implements ICommandModule {
    /**
     * Métadonnées de la commande
     * @property {string} id - Identifiant unique de la commande (format: 'jabbarroot.NomCommande')
     * @property {string} title - Titre affiché dans l'interface
     * @property {string} category - Catégorie de la commande
     */
    public readonly metadata = {
        id: 'jabbarroot.AddSelectionToActiveBrick',
        title: 'JabbarRoot: Ajouter la sélection à la brique active',
        category: 'jabbarroot' as const,
    };

    /**
     * Dépendances requises par la commande
     * @readonly
     */
    public readonly dependencies = [
        'projectService',
        'brickService',
        'ignoreService'
    ] as const;

    /**
     * Exécute la commande d'ajout de sélection à la brique active
     * @param services - Conteneur d'injection de dépendances
     * @param mainUri - URI principale de la sélection
     * @param selectedUris - Tableau des URIs sélectionnées
     * @returns {Promise<void>}
     * 
     * @example
     * ```typescript
     * const command = new AddSelectionToActiveBrickCommand();
     * await command.execute(services, mainUri, selectedUris);
     * ```
     */
    public async execute(
        services: Map<keyof ServiceCollection, IService>,
        mainUri: vscode.Uri,
        selectedUris: vscode.Uri[]
    ): Promise<void> {
        const projectService = services.get('projectService') as ProjectService;
        const brickService = services.get('brickService') as BrickService;
        const ignoreService = services.get('ignoreService') as IgnoreService;

        // Gestion des cas où selectedUris est vide
        const uris = selectedUris?.length > 0 ? selectedUris : [mainUri];
        if (!uris?.length) {
            vscode.window.showWarningMessage('Aucune sélection valide détectée.');
            return;
        }

        const targetBrick = await brickService.getDefaultTargetBrick();
        if (!targetBrick) {
            vscode.window.showWarningMessage("Aucune brique de collecte n'est définie. Faites un clic droit sur une brique et choisissez 'Définir comme brique de collecte'.");
            return;
        }

        const parentProject = await projectService.getProject(targetBrick.projectId);
        if (!parentProject) {
            vscode.window.showErrorMessage(`Projet parent de la brique de collecte introuvable.`);
            return;
        }

        const shouldIgnore = await ignoreService.createIgnorePredicate(parentProject, targetBrick);
        const allRelativeFilePaths: Set<string> = new Set();

        for (const uri of uris) {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.type === vscode.FileType.Directory) {
                const nestedFiles = await getFilesRecursively(uri, shouldIgnore, parentProject.projectRootPath);
                nestedFiles.forEach(f => allRelativeFilePaths.add(vscode.workspace.asRelativePath(f.fsPath, false)));
            } else if (stat.type === vscode.FileType.File) {
                const relativePath = vscode.workspace.asRelativePath(uri.fsPath, false);
                if (!shouldIgnore(relativePath)) {
                    allRelativeFilePaths.add(relativePath);
                }
            }
        }

        const finalPaths = Array.from(allRelativeFilePaths);
        if (finalPaths.length === 0) {
            vscode.window.showInformationMessage('Aucun fichier à ajouter (tous les fichiers sélectionnés sont peut-être ignorés ou déjà présents).');
            return;
        }

        try {
            // Ajout effectif des chemins à la brique
            await brickService.addPathsToBrick(targetBrick.id, finalPaths);
            
            // Notification de succès
            const message = finalPaths.length > 1 
                ? `${finalPaths.length} éléments ajoutés à la brique : ${targetBrick.name}`
                : `1 élément ajouté à la brique : ${targetBrick.name}`;
                
            vscode.window.showInformationMessage(message);
            
            // Rafraîchissement de la vue
            await vscode.commands.executeCommand('jabbarroot.RefreshProjectView');
        } catch (error) {
            console.error('Erreur lors de l\'ajout des éléments à la brique :', error);
            vscode.window.showErrorMessage(
                `Erreur lors de l'ajout des éléments à la brique : ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

export default new AddSelectionToActiveBrickCommand();
