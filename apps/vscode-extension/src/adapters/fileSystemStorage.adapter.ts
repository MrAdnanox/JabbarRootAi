// packages/vscode-extension/src/adapters/fileSystemStorage.adapter.ts
import * as vscode from 'vscode'; // Pour IFileSystem qui utilise vscode.Uri, etc.
import * as path from 'path';
import { IFileSystem, IStorage } from '@jabbarroot/core'; // Assurez-vous que les paths sont corrects

export class FileSystemStorageAdapter implements IStorage {
    private baseStoragePath: string;

    constructor(
        private readonly fs: IFileSystem, // Doit être une instance de VscodeFileSystemAdapter
        projectRootPath: string, // Chemin racine du VRAI projet utilisateur
        storageDirectoryName: string // Nom du dossier sous .jabbarroot, ex: "jabbarroot_data"
    ) {
        // Le stockage se fait DANS le .jabbarroot du projet ouvert par l'utilisateur
        this.baseStoragePath = path.join(projectRootPath, '.jabbarroot', storageDirectoryName);
    }

    private async ensureDirectoryExists(filePathBeingWritten: string): Promise<void> {
        // S'assurer que le dossier parent du fichier existe, pas juste baseStoragePath
        const dirOfFile = path.dirname(filePathBeingWritten);
        // Tenter de lire le répertoire. Si une erreur est levée, il n'existe pas.
        // Cette logique de création de répertoire doit être récursive si fs.createDirectory ne l'est pas.
        // VscodeFileSystemAdapter.createDirectory EST récursif.
        try {
            await this.fs.readDirectory(dirOfFile);
        } catch (error) {
            await this.fs.createDirectory(dirOfFile);
        }
    }

    async get<T>(key: string): Promise<T | undefined> {
        const filePath = path.join(this.baseStoragePath, `${key}.json`);
        try {
            const content = await this.fs.readFile(filePath);
            return JSON.parse(content) as T;
        } catch (error) {
            // console.warn(`[FSA.get] Failed to read or parse ${filePath}:`, error);
            return undefined; // Fichier non trouvé ou erreur de parse
        }
    }

    async update<T>(key: string, value: T): Promise<void> {
        const filePath = path.join(this.baseStoragePath, `${key}.json`);

        if (value === undefined || value === null) { // Suppression explicite si value est undefined/null
            try {
                await this.fs.deleteFile(filePath);
            } catch (error) {
                // Ignorer si le fichier n'existe pas déjà
                // console.warn(`[FSA.update - delete] Failed to delete ${filePath}:`, error);
            }
        } else {
            await this.ensureDirectoryExists(filePath); // S'assurer que le dossier de base existe
            const content = JSON.stringify(value, null, 2); // Indenté pour la lisibilité
            try {
                await this.fs.writeFile(filePath, content);
            } catch (error) {
                console.error(`[FSA.update - write] Failed to write ${filePath}:`, error);
                throw error; // Projeter l'erreur si l'écriture échoue
            }
        }
    }
}