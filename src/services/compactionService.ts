// src/services/compactionService.ts
import * as vscode from 'vscode';
import { ProgrammableContext } from '../models/programmableContext';
import * as path from 'path';
export class CompactionService {

    private flexReplacements: Record<string, string> = {
        "implementation": "impl", "configuration": "config", "optimization": "optim",
        "performance": "perf", "recommendation": "rec", "description": "desc",
        "validation": "valid", "monitoring": "monit", "analysis": "anlys",
        "complexity": "cplx", "vulnerability": "vuln", "security": "sec",
        // Ajoutez d'autres remplacements du script ici
    };
    /**
    Orchestre la compilation complète d'un contexte.
    */
    public async compileContext(context: ProgrammableContext): Promise<string> {
        
        let compiledOutput: string[] = [];
    // 1. Ajout de l'arborescence du projet (si demandé)
    if (context.options.include_project_tree) {
        const tree = await this.generateProjectTree();
        compiledOutput.push("--- PROJECT TREE ---", tree, "--- END PROJECT TREE ---");
    }
    
    // 2. Ajout du contenu des fichiers
    compiledOutput.push("\n--- FILE CONTENTS ---");
    for (const fileUriString of context.files_scope) {
        try {
        const fileUri = vscode.Uri.parse(fileUriString);
        const contentBytes = await vscode.workspace.fs.readFile(fileUri);
        const content = Buffer.from(contentBytes).toString('utf8');
        const relativePath = vscode.workspace.asRelativePath(fileUri);
        compiledOutput.push(`--- FILE: ${relativePath} ---`, content);
        } catch (error) {
        console.error(`JabbaRoot: Failed to read file ${fileUriString}`, error);
        compiledOutput.push(`--- ERROR: Failed to read file ${fileUriString} ---`);
        }
    }
    
    // 3. Appliquer la compression selon le niveau du contexte
    const rawContext = compiledOutput.join('\n\n');
    return this.compress(rawContext, context.options.compression_level);
    }
    /**
    Compresse un texte donné en utilisant la logique FlexCompactor.
    */
    public compress(text: string, level: 'none' | 'standard' | 'extreme'): string {
        if (level === 'none' || !text) {
            return text;
        }
        let workingText = text;

        // Appliquer les remplacements sémantiques
        for (const [long, short] of Object.entries(this.flexReplacements)) {
        const pattern = new RegExp(`\\b${long}\\b`, 'gi');
        workingText = workingText.replace(pattern, short);
        }

        // Simplification de la suppression des espaces (version standard)
        if (level === 'standard' || level === 'extreme') {
        workingText = workingText.replace(/\s*([,:{}\[\]()])\s*/g, '$1');
        workingText = workingText.split('\n').map(line => line.trim()).filter(line => line).join(' ');
        }

        if (level === 'extreme') {
        // Ajouter ici les logiques plus agressives de flexUltraCompress si nécessaire
        workingText = workingText.replace(/\s{2,}/g, ' ');
        }

        return workingText.trim();
    }
    private async generateProjectTree(): Promise<string> {
        const files = await vscode.workspace.findFiles('/*', '/node_modules/**');
        if (!vscode.workspace.workspaceFolders) return "No workspace open.";
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const tree: any = {};

        files.forEach(file => {
            const relativePath = path.relative(rootPath, file.fsPath);
            const parts = relativePath.split(path.sep);
            let currentLevel = tree;
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    currentLevel[part] = null; // C'est un fichier
                } else {
                    currentLevel[part] = currentLevel[part] || {};
                    currentLevel = currentLevel[part];
                }
            });
        });

        return this.formatTree(tree);
    }
    private formatTree(tree: any, indent = ''): string {

        let result = '';
        const entries = Object.entries(tree);
        entries.forEach(([key, value], index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            result += indent + connector + key + "\n";
            if (value !== null) { // C'est un dossier
                const newIndent = indent + (isLast ? ' ' : '│ ');
                result += this.formatTree(value, newIndent);
            }
        });
        return result;
    }
}