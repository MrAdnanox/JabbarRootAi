// apps/vscode-extension/src/utils/workspace.ts
import * as vscode from 'vscode';

export const getProjectRootPath = (): string | undefined => {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
};

export async function getFilesRecursively(
    folderUri: vscode.Uri,
    shouldIgnore: (relativePath: string) => boolean,
    rootPath: string // Nécessaire pour calculer le chemin relatif
): Promise<vscode.Uri[]> {
    console.log('[JabbarRoot] getFilesRecursively - Dossier source:', folderUri.fsPath);
    console.log('[JabbarRoot] Racine du projet:', rootPath);
    
    const files: vscode.Uri[] = [];
    const queue: vscode.Uri[] = [folderUri];
    let processedCount = 0;
    const ignoredPaths: string[] = [];

    while (queue.length > 0) {
        const currentUri = queue.shift()!;
        const relativePath = vscode.workspace.asRelativePath(currentUri.fsPath, false);
        
        console.log(`[JabbarRoot] Traitement: ${relativePath} (${currentUri.fsPath})`);

        if (shouldIgnore(relativePath)) {
            console.log(`[JabbarRoot] Ignoré (règle d'ignorance): ${relativePath}`);
            ignoredPaths.push(relativePath);
            continue;
        }

        try {
            const entries = await vscode.workspace.fs.readDirectory(currentUri);
            console.log(`[JabbarRoot] ${entries.length} entrées trouvées dans ${relativePath}`);
            
            for (const [name, type] of entries) {
                const entryUri = vscode.Uri.joinPath(currentUri, name);
                const entryRelativePath = vscode.workspace.asRelativePath(entryUri.fsPath, false);
                
                console.log(`[JabbarRoot] Vérification: ${entryRelativePath} (${entryUri.fsPath})`);

                if (shouldIgnore(entryRelativePath)) {
                    console.log(`[JabbarRoot] Ignoré (règle d'ignorance): ${entryRelativePath}`);
                    ignoredPaths.push(entryRelativePath);
                    continue;
                }

                if (type === vscode.FileType.Directory) {
                    queue.push(entryUri);
                } else if (type === vscode.FileType.File) {
                    console.log(`[JabbarRoot] Fichier à ajouter: ${entryRelativePath}`);
                    files.push(entryUri);
                    processedCount++;
                }
            }
        } catch (error) {
            console.error(`[JabbarRoot] Erreur lors de la lecture du dossier ${relativePath}:`, error);
        }
    }
    
    console.log(`[JabbarRoot] getFilesRecursively terminé. ${processedCount} fichiers trouvés, ${ignoredPaths.length} ignorés.`);
    if (ignoredPaths.length > 0) {
        console.log('[JabbarRoot] Chemins ignorés:', ignoredPaths);
    }
    
    return files;
}