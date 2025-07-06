// packages/core/src/services/concurrency/worker-task.ts
import { parentPort } from 'worker_threads';
// CORRECTION : Utiliser les imports nommés corrects pour web-tree-sitter
import { Parser, Language } from 'web-tree-sitter';
import * as path from 'path';

// Cette fonction sera exécutée dans le worker.
const runAnalysis = async (filePath: string, fileContent: string, parsersPath: string): Promise<any> => {
    
    const getLanguageFromPath = (fp: string): string | null => {
        const ext = path.extname(fp);
        switch (ext) {
            case '.ts': case '.tsx': return 'typescript';
            case '.js': case '.jsx': return 'javascript';
            default: return null;
        }
    };

    const language = getLanguageFromPath(filePath);
    if (!language) {
        return { error: `Unsupported file type: ${filePath}` };
    }

    try {
        // CORRECTION : Appeler init() sur la classe Parser importée
        await Parser.init();
        const parser = new Parser();
        const wasmPath = path.join(parsersPath, `tree-sitter-${language}.wasm`);
        // CORRECTION : Appeler load() sur la classe Language importée
        const Lang = await Language.load(wasmPath);
        parser.setLanguage(Lang);

        const tree = parser.parse(fileContent);
        
        // Logique d'analyse (placeholder)
        const symbols = fileContent.match(/export\s+(class|function|const)\s+(\w+)/g) || [];
        const result = {
            filePath,
            symbols: symbols.map(s => s.split(' ').pop()),
            ast_size: fileContent.length,
        };
        return result;

    } catch (e: any) {
        return { error: e.message, stack: e.stack };
    }
};

// Écouter les messages du thread principal
parentPort?.on('message', async (task) => {
    const { filePath, fileContent, parsersPath } = task;
    const result = await runAnalysis(filePath, fileContent, parsersPath);
    // Renvoyer le résultat au thread principal
    parentPort?.postMessage(result);
});