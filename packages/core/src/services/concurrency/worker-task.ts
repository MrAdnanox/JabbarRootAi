import { parentPort } from 'worker_threads';
import { Parser, Language } from 'web-tree-sitter';
import * as path from 'path';

const runAnalysis = async (filePath: string, fileContent: string, parsersPath: string): Promise<any> => {
    const getLanguageFromPath = (fp: string): string | null => {
        const ext = path.extname(fp).toLowerCase(); // Convertir en minuscule pour la robustesse
        switch (ext) {
            case '.ts':
            case '.tsx':
                return 'typescript';
            case '.js':
            case '.jsx':
            case '.mjs':
            case '.cjs':
                return 'javascript';
            // On pourrait ajouter d'autres langages ici à l'avenir (python, go, etc.)
            default:
                return null;
        }
    };

    const language = getLanguageFromPath(filePath);
    
    // CORRECTION : Si le langage n'est pas supporté, on retourne simplement null.
    // Le thread principal saura ignorer ce résultat.
    if (!language) {
        // console.log(`[Worker] Fichier non supporté, ignoré : ${filePath}`);
        return null; 
    }

    try {
        await Parser.init();
        const parser = new Parser();
        const wasmPath = path.join(parsersPath, `tree-sitter-${language}.wasm`);
        const Lang = await Language.load(wasmPath);
        parser.setLanguage(Lang);
        const tree = parser.parse(fileContent);
        
        // Logique d'analyse sémantique (placeholder pour l'instant)
        const symbols = fileContent.match(/export\s+(class|function|const)\s+(\w+)/g) || [];
        
        const result = {
            filePath,
            symbols: symbols.map(s => s.split(' ').pop()),
            ast_size: fileContent.length, // Placeholder
        };
        return result;
    } catch (e: any) {
        // Retourner un objet conforme au schéma SemanticAnalysisResult
        return { 
            filePath: filePath,
            language: language || undefined,
            error: e.message, 
            stack: e.stack 
        };
    }
};

parentPort?.on('message', async (task) => {
    const { filePath, fileContent, parsersPath } = task;
    const result = await runAnalysis(filePath, fileContent, parsersPath);
    parentPort?.postMessage(result);
});