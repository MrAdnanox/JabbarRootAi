import { IStorage, IFileSystem } from '@jabbarroot/core';
import * as path from 'path';

/**
 * Implémentation de IStorage qui persiste les données dans des fichiers JSON
 * au sein d'un répertoire `.jabbarroot` à la racine du projet.
 * 
 * Cette implémentation ne gère qu'une seule "clé" de stockage principale,
 * qui correspond à un répertoire sur le disque.
 */
export class FileSystemStorageAdapter implements IStorage {
  private baseStoragePath: string;

  constructor(
    private readonly fs: IFileSystem,
    private readonly projectRootPath: string,
    private readonly storageKey: string // ex: 'contexts'
  ) {
    this.baseStoragePath = path.join(this.projectRootPath, '.jabbarroot', this.storageKey);
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      // Tente de lire le répertoire. S'il n'existe pas, une erreur sera levée.
      await this.fs.readDirectory(this.baseStoragePath);
    } catch (error) {
      // Si l'erreur indique que le répertoire n'existe pas, on le crée.
      // NOTE: IFileSystem n'a pas de `createDirectory`. C'est une limite à gérer.
      // Pour l'instant, on va devoir l'ajouter à l'interface et à son implémentation.
      // Voir "PROCHAINES ÉTAPES".
      await (this.fs as any).createDirectory(this.baseStoragePath);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    // Dans cette implémentation, `key` est le nom de la collection (ex: "jabbaRoot.contexts")
    // Nous lisons tous les fichiers .json du répertoire `baseStoragePath`.
    await this.ensureDirectoryExists();

    try {
      const entries = await this.fs.readDirectory(this.baseStoragePath);
      const jsonFiles = entries.filter(e => !e.isDirectory && e.name.endsWith('.json'));
      
      const data: Record<string, any> = {};

      for (const file of jsonFiles) {
        const filePath = path.join(this.baseStoragePath, file.name);
        const content = await this.fs.readFile(filePath);
        const id = path.basename(file.name, '.json');
        data[id] = JSON.parse(content);
      }

      return data as T;
    } catch (error) {
      console.error(`[FileSystemStorageAdapter] Failed to get data for key "${key}"`, error);
      return undefined;
    }
  }

  async update<T>(key: string, value: T): Promise<void> {
    // Ici, `value` est l'objet complet des contextes: Record<string, ProgrammableContext>
    await this.ensureDirectoryExists();
    const data = value as Record<string, any>;

    try {
        // Pour être robuste, on lit les fichiers existants pour les supprimer s'ils ne sont plus dans `value`.
        const existingEntries = await this.fs.readDirectory(this.baseStoragePath);
        const existingIds = existingEntries.map(e => path.basename(e.name, '.json'));
        const newIds = Object.keys(data);

        // Supprimer les fichiers qui n'existent plus dans les nouvelles données
        for (const id of existingIds) {
            if (!newIds.includes(id)) {
                const filePathToDelete = path.join(this.baseStoragePath, `${id}.json`);
                await (this.fs as any).deleteFile(filePathToDelete);
            }
        }
        
        // Ecrire/Mettre à jour les fichiers
        for (const id in data) {
            const filePath = path.join(this.baseStoragePath, `${id}.json`);
            const content = JSON.stringify(data[id], null, 2); // Indenté pour la lisibilité
            await this.fs.writeFile(filePath, content);
        }
    } catch (error) {
        console.error(`[FileSystemStorageAdapter] Failed to update data for key "${key}"`, error);
    }
  }
}