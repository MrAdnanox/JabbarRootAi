// packages/core/src/services/structureGeneration.service.ts

import { IFileSystem, DirectoryEntry } from '@jabbarroot/types';

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

    let entries: DirectoryEntry[];
    try {
      entries = await this.fs.readDirectory(currentDirPath);
    } catch (error) {
      // Si on ne peut pas lire le dossier (ex: permissions), on s'arrête là pour cette branche.
      tree.push(`${prefix}└── ??? (unreadable)`);
      return;
    }
    
    // ÉTAPE 1 : Filtrer TOUTES les entrées (fichiers et dossiers) qui doivent être ignorées
    const processableEntries = entries.filter((entry: DirectoryEntry) => {
      const entryPath = `${currentDirPath}/${entry.name}`;
      const relativePath = this.fs.getRelativePath(rootPath, entryPath);
      // Le prédicat est appliqué ici une seule fois par entrée
      return !shouldIgnore(relativePath);
    });

    // ÉTAPE 2 : Trier les entrées restantes
    const sortedEntries = processableEntries.sort((a: DirectoryEntry, b: DirectoryEntry) => {
        if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    // ÉTAPE 3 : Itérer sur les entrées triées et filtrées
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const isLast = i === sortedEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      tree.push(`${prefix}${connector}${entry.name}`);

      if (entry.isDirectory) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const newPath = `${currentDirPath}/${entry.name}`;
        // La récursion se fait sur le chemin du dossier. La vérification d'ignorance
        // pour ce dossier a déjà été faite à l'étape 1.
        await this.buildTree(rootPath, newPath, shouldIgnore, tree, newPrefix, depth + 1, maxDepth);
      }
    }
  }
}