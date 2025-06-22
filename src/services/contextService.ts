// src/services/contextService.ts
import * as vscode from 'vscode';
import { ProgrammableContext } from '../models/programmableContext';
import { randomUUID } from 'crypto';

const STORAGE_KEY = 'jabbaRoot.contexts';

// Interface pour la testabilité et l'injection de dépendances
export interface IContextService {
    readonly onDidChange: vscode.Event<void>;
    getContexts(): ProgrammableContext[];
    getContext(id: string): ProgrammableContext | undefined;
    createContext(name: string, files: vscode.Uri[], options: Partial<ProgrammableContext['options']>): Promise<ProgrammableContext>;
    deleteContext(contextId: string): Promise<void>;
    // Méthode pour permettre le rafraîchissement manuel depuis l'extérieur si nécessaire
    refresh(): void;
}

export class ContextService implements IContextService {
    private _onDidChange: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChange: vscode.Event<void> = this._onDidChange.event;

    private contexts: Map<string, ProgrammableContext> = new Map();

    constructor(private workspaceState: vscode.Memento) {
        this.loadContexts();
    }

    public refresh(): void {
        this._onDidChange.fire();
    }

    private loadContexts(): void {
        const storedContexts = this.workspaceState.get<string>(STORAGE_KEY);
        if (storedContexts) {
            try {
                const parsedContexts: ProgrammableContext[] = JSON.parse(storedContexts);
                this.contexts = new Map(parsedContexts.map(c => [c.id, c]));
            } catch (e) {
                console.error("JabbaRoot: Erreur lors du chargement des contextes", e);
                this.contexts = new Map();
            }
        }
    }

    private async saveContexts(): Promise<void> {
        const contextArray = Array.from(this.contexts.values());
        await this.workspaceState.update(STORAGE_KEY, JSON.stringify(contextArray));
        this._onDidChange.fire(); // Notifier les écouteurs d'un changement
    }

    public getContexts(): ProgrammableContext[] {
        return Array.from(this.contexts.values());
    }

    public getContext(id: string): ProgrammableContext | undefined {
        return this.contexts.get(id);
    }

    public async createContext(name: string, files: vscode.Uri[], options: Partial<ProgrammableContext['options']>): Promise<ProgrammableContext> {
        const newContext: ProgrammableContext = {
            id: randomUUID(),
            name: name,
            files_scope: files.map(uri => uri.fsPath), // Convertir les Uris en chaînes de caractères
            options: {
                include_project_tree: options.include_project_tree ?? false,
                compression_level: options.compression_level ?? 'standard',
                special_sections: options.special_sections ?? {},
            },
            metadata: {
                createdAt: new Date().toISOString(),
            },
        };
        this.contexts.set(newContext.id, newContext);
        await this.saveContexts();
        return newContext;
    }

    public async deleteContext(contextId: string): Promise<void> {
        if (this.contexts.has(contextId)) {
            this.contexts.delete(contextId);
            await this.saveContexts();
        }
    }
}