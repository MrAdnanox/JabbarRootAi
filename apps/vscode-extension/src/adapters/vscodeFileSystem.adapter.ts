// packages/vscode-extension/src/adapters/vscodeFileSystem.adapter.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { DirectoryEntry, IFileSystem } from '@jabbarroot/core';

/**
 * Implémentation de IFileSystem utilisant l'API de VSCode.
 * C'est le pont entre notre logique agnostique et l'environnement VSCode.
 */
export class VscodeFileSystemAdapter implements IFileSystem {
  public async readFile(filePath: string): Promise<string> {
    const uri = vscode.Uri.file(filePath);
    const contentBytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(contentBytes).toString('utf8');
  }

  public async readDirectory(dirPath: string): Promise<DirectoryEntry[]> {
    const uri = vscode.Uri.file(dirPath);
    const entries = await vscode.workspace.fs.readDirectory(uri);
    return entries.map(([name, type]) => ({
      name,
      isDirectory: type === vscode.FileType.Directory,
    }));
  }

  public getRelativePath(rootPath: string, filePath: string): string {
    // Utilise 'path' pour la robustesse sur différents OS
    return path.relative(rootPath, filePath).replace(/\\/g, '/');
  }
}