// apps/vscode-extension/src/commands/addSelectionToActiveBrick.command.ts
import * as vscode from 'vscode';
import { BrickService, ProjectService } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { getFilesRecursively } from '../utils/workspace';
import { getProjectRootPath } from '../utils/workspace';

export function registerAddSelectionToActiveBrickCommand(
    projectService: ProjectService,
    brickService: BrickService,
    ignoreService: IgnoreService
): vscode.Disposable {
    return vscode.commands.registerCommand(
        'jabbarroot.addSelectionToActiveBrick',
        async (mainUri: vscode.Uri, selectedUris: vscode.Uri[]) => {
            const uris = selectedUris && selectedUris.length > 0 ? selectedUris : [mainUri];
            if (!uris || uris.length === 0) return;

            // 1. Vérifier si une brique cible est définie
            const targetBrick = await brickService.getDefaultTargetBrick();
            if (!targetBrick) {
                vscode.window.showWarningMessage("Aucune brique de collecte n'est définie. Faites un clic droit sur une brique et choisissez 'Définir comme brique de collecte'.");
                return;
            }
            
            // 2. Récupérer le projet parent pour le contexte (rootPath, règles d'ignore)
            const parentProject = await projectService.getProject(targetBrick.projectId);
            if (!parentProject) {
                vscode.window.showErrorMessage(`Projet parent de la brique de collecte introuvable.`);
                return;
            }

            // 3. Créer le prédicat d'ignorance
            console.log('[JabbarRoot] Création du prédicat d\'ignorance...');
            const shouldIgnore = await ignoreService.createIgnorePredicate(parentProject, targetBrick);
            
            // 4. Traiter la sélection pour obtenir une liste de chemins de fichiers RELATIFS
            console.log(`[JabbarRoot] Traitement de ${uris.length} URI(s) sélectionnée(s)`);
            const allRelativeFilePaths: Set<string> = new Set();
            
            for (const uri of uris) {
                console.log(`[JabbarRoot] Traitement de l'URI: ${uri.fsPath}`);
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    console.log(`[JabbarRoot] Type de l'élément: ${vscode.FileType[stat.type]}`);
                    
                    if (stat.type === vscode.FileType.Directory) {
                        console.log(`[JabbarRoot] Parcours du dossier: ${uri.fsPath}`);
                        const nestedFiles = await getFilesRecursively(uri, shouldIgnore, parentProject.projectRootPath);
                        console.log(`[JabbarRoot] ${nestedFiles.length} fichiers trouvés dans le dossier`);
                        
                        nestedFiles.forEach(f => {
                            const relativePath = vscode.workspace.asRelativePath(f.fsPath, false);
                            console.log(`[JabbarRoot] Fichier trouvé: ${relativePath}`);
                            allRelativeFilePaths.add(relativePath);
                        });
                    } else if (stat.type === vscode.FileType.File) {
                        const relativePath = vscode.workspace.asRelativePath(uri.fsPath, false);
                        console.log(`[JabbarRoot] Vérification du fichier: ${relativePath}`);
                        
                        if (!shouldIgnore(relativePath)) {
                            console.log(`[JabbarRoot] Fichier à ajouter: ${relativePath}`);
                            allRelativeFilePaths.add(relativePath);
                        } else {
                            console.log(`[JabbarRoot] Fichier ignoré (règles d'ignorance): ${relativePath}`);
                        }
                    }
                } catch (error) {
                    console.error(`[JabbarRoot] Erreur lors du traitement de ${uri.fsPath}:`, error);
                }
            }

            const finalPaths = Array.from(allRelativeFilePaths);
            console.log('[JabbarRoot] Fichiers à ajouter:', finalPaths);
            console.log('[JabbarRoot] Règles d\'ignorage:', await ignoreService.createIgnorePredicate(parentProject, targetBrick));
            
            if (finalPaths.length === 0) {
                console.log('[JabbarRoot] Aucun fichier à ajouter. URIs sélectionnées:', uris);
                vscode.window.showInformationMessage('Aucun fichier à ajouter (tous les fichiers sélectionnés sont peut-être ignorés ou déjà présents).');
                return;
            }

            // 5. Appeler le service avec la liste finale
            await brickService.addPathsToBrick(targetBrick.id, finalPaths);
            
            // 6. Notifier et rafraîchir
            vscode.window.showInformationMessage(`${finalPaths.length} chemin(s) ajouté(s) à la brique : ${targetBrick.name}`);
            await vscode.commands.executeCommand('jabbarroot.refreshProjectView');
        }
    );
}