// src/services/compactionService.ts

// Les imports de vscode, ProgrammableContext, path, etc. sont supprimés.

export class CompactionService {

    private flexReplacements: Record<string, string> = {
        "implementation": "impl", "configuration": "config", "optimization": "optim",
        "performance": "perf", "recommendation": "rec", "description": "desc",
        "validation": "valid", "monitoring": "monit", "analysis": "anlys",
        "complexity": "cplx", "vulnerability": "vuln", "security": "sec",
    };
    
    constructor() {}

    /**
    * Compresse un texte donné en utilisant une série de règles sémantiques et syntaxiques.
    * @param text La chaîne de caractères à compresser.
    * @param level Le niveau de compression à appliquer.
    * @returns La chaîne de caractères compressée.
    */
    public compress(text: string, level: 'none' | 'standard' | 'extreme'): string {
        if (level === 'none' || !text) {
            return text;
        }
        let workingText = text;

        // Remplacements sémantiques
        for (const [long, short] of Object.entries(this.flexReplacements)) {
            const pattern = new RegExp(`\\b${long}\\b`, 'gi');
            workingText = workingText.replace(pattern, short);
        }

        // Compactage syntaxique
        if (level === 'standard' || level === 'extreme') {
            workingText = workingText.replace(/\s*([,:{}\[\]()])\s*/g, '$1');
            workingText = workingText.split('\n').map(line => line.trim()).filter(line => line).join(' ');
        }

        if (level === 'extreme') {
            workingText = workingText.replace(/\s{2,}/g, ' ');
        }

        return workingText.trim();
    }
}