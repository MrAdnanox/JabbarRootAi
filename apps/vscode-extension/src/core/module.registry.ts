import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ICommandModule } from './interfaces';
import { ServiceRegistry } from './di/service.registry';

export class ModuleRegistry {
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly container: ServiceRegistry
    ) {}

    public discoverAndRegisterCommands(): void {
        const commandsDir = path.join(this.context.extensionPath, 'dist', 'commands');
        console.log(`[ModuleRegistry] Discovering commands recursively in: ${commandsDir}`);
        if (!fs.existsSync(commandsDir)) {
            console.warn(`[ModuleRegistry] Commands directory not found: ${commandsDir}`);
            return;
        }
        const commandFiles = this.findJsFilesRecursively(commandsDir);
        console.log(`[ModuleRegistry] ${commandFiles.length} command files found to be registered.`);
        for (const filePath of commandFiles) {
            this.loadAndRegisterCommand(filePath);
        }
    }

    private findJsFilesRecursively(dir: string): string[] {
        let files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files = files.concat(this.findJsFilesRecursively(fullPath));
            } else if (item.isFile() && item.name.endsWith('.cjs')) {
                files.push(fullPath);
            }
        }
        return files;
    }

    private loadAndRegisterCommand(filePath: string): void {
        try {
            const module = require(filePath);
            const commandModule = module.default as ICommandModule;
            if (this.isValidCommandModule(commandModule)) {
                const { id } = commandModule.metadata;
                const commandDisposable = vscode.commands.registerCommand(id, (...args: any[]) => {
                    const resolvedDependencies = this.container.resolveMultiple(commandModule.dependencies);
                    commandModule.execute(resolvedDependencies, ...args);
                });
                this._disposables.push(commandDisposable);
            }
        } catch (error) {
            console.error(`[ModuleRegistry] Error loading command from ${filePath}:`, error);
        }
    }

    private isValidCommandModule(module: any): module is ICommandModule {
        return module && typeof module.execute === 'function' && module.metadata && typeof module.metadata.id === 'string';
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}