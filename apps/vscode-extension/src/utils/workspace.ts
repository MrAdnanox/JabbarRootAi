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
    const files: vscode.Uri[] = [];
    const queue: vscode.Uri[] = [folderUri];

    while (queue.length > 0) {
        const currentUri = queue.shift()!;
        const relativePath = vscode.workspace.asRelativePath(currentUri.fsPath, false);

        if (shouldIgnore(relativePath)) {
            continue;
        }

        const entries = await vscode.workspace.fs.readDirectory(currentUri);
        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(currentUri, name);
            const entryRelativePath = vscode.workspace.asRelativePath(entryUri.fsPath, false);

            if (shouldIgnore(entryRelativePath)) {
                continue;
            }

            if (type === vscode.FileType.Directory) {
                queue.push(entryUri);
            } else if (type === vscode.FileType.File) {
                files.push(entryUri);
            }
        }
    }
    return files;
}