// src/services/structureGeneration.service.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from 'minimatch';

interface GenerationReport {
  tree: string;
  stats: Record<string, any>;
}

export class StructureGenerationService {
  private readonly DEFAULT_IGNORE = ['.git', '.DS_Store', '*.log', '.vscode', '.idea', 'node_modules', '__pycache__', 'dist', 'build', '.env'];

  public async generate(startUri: vscode.Uri, maxDepth: number = 7): Promise<GenerationReport | null> {
    const projectRoot = await this.findProjectRoot(startUri);
    if (!projectRoot) {
      vscode.window.showErrorMessage("JabbaRoot: Racine du projet non trouvée (.git ou .gitignore manquant).");
      return null;
    }

    const ignorePatterns = await this.loadIgnorePatterns(projectRoot);
    const stats = this.createInitialStats();
    
    const tree: string[] = [`${path.basename(projectRoot.fsPath)}/`];
    await this.buildTree(projectRoot, projectRoot, ignorePatterns, tree, stats, "", 0, maxDepth);

    return {
      tree: tree.join('\n'),
      stats: this.finalizeStats(stats),
    };
  }

  private async loadIgnorePatterns(projectRoot: vscode.Uri): Promise<string[]> {
    let patterns = [...this.DEFAULT_IGNORE];
    const gitignoreUri = vscode.Uri.joinPath(projectRoot, '.gitignore');
    const jabbaIgnoreUri = vscode.Uri.joinPath(projectRoot, '.JabbarRootIgnore');

    for (const uri of [gitignoreUri, jabbaIgnoreUri]) {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const filePatterns = Buffer.from(content)
              .toString('utf-8')
              .split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.startsWith('#'));
            patterns.push(...filePatterns);
        } catch { /* Fichier non trouvé */ }
    }
    return patterns;
  }

  private shouldIgnore(relativePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Handle directory patterns
      if (pattern.endsWith('/')) {
        return minimatch(relativePath + '/', pattern) || minimatch(relativePath, pattern.slice(0, -1));
      }
      // Handle negation patterns
      if (pattern.startsWith('!')) {
        return !minimatch(relativePath, pattern.slice(1));
      }
      return minimatch(relativePath, pattern);
    });
  }

  private async buildTree(
    root: vscode.Uri, 
    currentDir: vscode.Uri, 
    ignorePatterns: string[], 
    tree: string[], 
    stats: any, 
    prefix: string, 
    depth: number, 
    maxDepth: number
  ) {
    if (depth >= maxDepth) {
      tree.push(prefix + "└── ... (profondeur max)");
      return;
    }

    const entries = await vscode.workspace.fs.readDirectory(currentDir);
    const sortedEntries = entries.sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : a[1] === vscode.FileType.Directory ? -1 : 1));

    const processableEntries = sortedEntries.filter(entry => {
      const entryPath = vscode.Uri.joinPath(currentDir, entry[0]);
      const relativePath = path.relative(root.fsPath, entryPath.fsPath).replace(/\\/g, '/');
      return !this.shouldIgnore(relativePath, ignorePatterns);
    });

    for (let i = 0; i < processableEntries.length; i++) {
      const [name, type] = processableEntries[i];
      const isLast = i === processableEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      tree.push(`${prefix}${connector}${name}`);
      
      const newUri = vscode.Uri.joinPath(currentDir, name);
      if (type === vscode.FileType.Directory) {
        stats.total_dirs++;
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        await this.buildTree(root, newUri, ignorePatterns, tree, stats, newPrefix, depth + 1, maxDepth);
      } else if (type === vscode.FileType.File) {
        this.processFileStats(newUri, name, stats);
      }
    }
  }

  private processFileStats(uri: vscode.Uri, name: string, stats: any) {
    stats.total_files++;
    const ext = path.extname(name);
    stats.file_extensions[ext] = (stats.file_extensions[ext] || 0) + 1;
  }
  
  private createInitialStats = () => ({ total_files: 0, total_dirs: 0, file_extensions: {} });
  private finalizeStats = (stats: any) => stats;

  private async findProjectRoot(startUri: vscode.Uri): Promise<vscode.Uri | null> {
    let current = startUri;
    for (let i = 0; i < 10; i++) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(current, '.git'));
            return current;
        } catch {}
        try {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(current, 'package.json'));
            return current;
        } catch {}

        const parent = vscode.Uri.file(path.dirname(current.fsPath));
        if (parent.fsPath === current.fsPath) {
            return startUri;
        }
        current = parent;
    }
    return startUri;
  }
}