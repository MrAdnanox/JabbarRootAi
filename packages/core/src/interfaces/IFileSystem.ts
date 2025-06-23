// packages/core/src/interfaces/IFileSystem.ts

/**
 * Représente une entrée dans un répertoire.
 */
export interface DirectoryEntry {
    name: string;
    isDirectory: boolean;
  }
  
  /**
   * Définit une interface pour interagir avec un système de fichiers,
   * de manière agnostique à la plateforme (VSCode, Node.js, etc.).
   * Le `core` ne manipule que des chaînes de caractères pour les chemins.
   */
  export interface IFileSystem {
    /**
     * Lit le contenu d'un fichier à partir de son chemin.
     * @param filePath Le chemin absolu du fichier.
     * @returns Le contenu du fichier sous forme de chaîne de caractères.
     */
    readFile(filePath: string): Promise<string>;
  
    /**
     * Lit les entrées d'un répertoire.
     * @param dirPath Le chemin absolu du répertoire.
     * @returns Une liste d'objets `DirectoryEntry` représentant le contenu du répertoire.
     */
    readDirectory(dirPath: string): Promise<DirectoryEntry[]>;
  
    /**
     * Retourne le chemin relatif d'un fichier par rapport à une racine.
     * @param rootPath Le chemin du répertoire racine.
     * @param filePath Le chemin complet du fichier.
     * @returns Le chemin relatif (ex: 'src/services/myService.ts').
     */
    getRelativePath(rootPath: string, filePath: string): string;
  }