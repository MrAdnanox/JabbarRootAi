// packages/core/src/services/structureGeneration.service.ts

import { IFileSystem, DirectoryEntry } from '../interfaces/IFileSystem';

export interface GenerationReport {
  tree: string;
  // Les stats peuvent être étendues plus tard
}

export interface StructureGenerationOptions {
  maxDepth?: number;
  // La fonction pour ignorer est maintenant injectée
  shouldIgnore: (relativePath: string) => boolean;
}

/**
 * Service pur responsable de la génération d'une arborescence de projet.
 * Ne dépend que d'une abstraction du système de fichiers (IFileSystem).
 */
export class StructureGenerationService {
  constructor(private readonly fs: IFileSystem) {}

  public async generate(
    startPath: string,
    options: StructureGenerationOptions
  ): Promise<GenerationReport | null> {
    const { maxDepth = 7, shouldIgnore } = options;

    const projectName = startPath.split(/[\\/]/).pop() || '';
    const tree: string[] = [`${projectName}/`];

    await this.buildTree(
      startPath,
      startPath,
      shouldIgnore,
      tree,
      "",
      0,
      maxDepth
    );

    return {
      tree: tree.join('\n'),
    };
  }

  private async buildTree(
    rootPath: string,
    currentDirPath: string,
    shouldIgnore: (relativePath: string) => boolean,
    tree: string[],
    prefix: string,
    depth: number,
    maxDepth: number
  ): Promise<void> {
    if (depth >= maxDepth) {
      tree.push(`${prefix}└── ... (max depth reached)`);
      return;
    }

    const entries = await this.fs.readDirectory(currentDirPath);
    
    // Trier les entrées : dossiers en premier, puis par ordre alphabétique
    const sortedEntries = entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    const processableEntries = sortedEntries.filter(entry => {
      const entryPath = `${currentDirPath}/${entry.name}`;
      const relativePath = this.fs.getRelativePath(rootPath, entryPath);
      return !shouldIgnore(relativePath);
    });

    for (let i = 0; i < processableEntries.length; i++) {
      const entry = processableEntries[i];
      const isLast = i === processableEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      tree.push(`${prefix}${connector}${entry.name}`);

      if (entry.isDirectory) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const newPath = `${currentDirPath}/${entry.name}`;
        await this.buildTree(rootPath, newPath, shouldIgnore, tree, newPrefix, depth + 1, maxDepth);
      }
    }
  }
}