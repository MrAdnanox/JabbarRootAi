// apps/vscode-extension/src/core/module.registry.ts

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ICommandModule } from './interfaces';
import { DIContainer } from './di.container';

export class ModuleRegistry {
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly container: DIContainer
    ) {}

    // --- DÉBUT DE LA NOUVELLE LOGIQUE RÉCURSIVE ---
    /**
     * Démarre la découverte récursive des commandes.
     */
    public discoverAndRegisterCommands(): void {
        const commandsDir = path.join(this.context.extensionPath, 'dist', 'commands');
        console.log(`[ModuleRegistry] Discovering commands recursively in: ${commandsDir}`);

        if (!fs.existsSync(commandsDir)) {
            console.warn(`[ModuleRegistry] Commands directory not found: ${commandsDir}`);
            return;
        }

        const commandFiles = this.findJsFilesRecursively(commandsDir);
        for (const filePath of commandFiles) {
            this.loadAndRegisterCommand(filePath);
        }
    }

    /**
     * Trouve tous les fichiers .js dans un répertoire et ses sous-dossiers.
     * @param dir Le répertoire de départ.
     * @returns Une liste des chemins complets.
     */
    private findJsFilesRecursively(dir: string): string[] {
        let files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files = files.concat(this.findJsFilesRecursively(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
        return files;
    }

    /**
     * Charge un module de commande depuis un chemin de fichier et l'enregistre.
     * @param filePath Le chemin complet du fichier de commande.
     */
    private loadAndRegisterCommand(filePath: string): void {
        try {
            const module = require(filePath);
            const commandModule = module.default as ICommandModule;

            if (this.isValidCommandModule(commandModule)) {
                const { id, title } = commandModule.metadata;
                console.log(`[ModuleRegistry] Registering command: ${id} ('${title}') from ${path.basename(filePath)}`);

                const commandDisposable = vscode.commands.registerCommand(id, (...args: any[]) => {
                    const resolvedDependencies = this.container.resolveMultiple(commandModule.dependencies);
                    commandModule.execute(resolvedDependencies, ...args);
                });

                this._disposables.push(commandDisposable);
            } else {
                console.warn(`[ModuleRegistry] Invalid or no default export in file: ${filePath}`);
            }
        } catch (error) {
            console.error(`[ModuleRegistry] Error loading command from ${filePath}:`, error);
        }
    }
    // --- FIN DE LA NOUVELLE LOGIQUE RÉCURSIVE ---
    
    private isValidCommandModule(module: any): module is ICommandModule {
        return module && typeof module.execute === 'function' && module.metadata && typeof module.metadata.id === 'string';
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}