// --- FICHIER : packages/core/src/services/concurrency/worker-task.ts ---

import { parentPort } from 'worker_threads';
import { Language, SyntaxNode } from 'web-tree-sitter';
import Parser = require('web-tree-sitter'); // CORRECTION : Import CJS-compatible
import * as path from 'path';

// Définition d'une structure de retour claire pour le worker
interface SemanticSymbol {
    name: string;
    kind: 'class' | 'function' | 'interface' | 'const' | 'module';
    isExported: boolean;
}

interface SemanticAnalysisPayload {
    filePath: string;
    language: string;
    dependencies: string[];
    symbols: SemanticSymbol[];
    error?: string;
    stack?: string;
}

// Fonction récursive pour parcourir l'AST
function traverseAst(node: SyntaxNode, results: { dependencies: Set<string>, symbols: Map<string, SemanticSymbol> }) {
    // Extraction des dépendances (imports/requires)
    if (node.type === 'import_statement' && node.childForFieldName('source')) {
        const sourceNode = node.childForFieldName('source')!;
        if (sourceNode.type === 'string_literal') {
            results.dependencies.add(sourceNode.text.slice(1, -1));
        }
    } else if (node.type === 'call_expression' && node.childForFieldName('function')?.text === 'require') {
        const arg = node.childForFieldName('arguments')?.children[1];
        if (arg?.type === 'string_literal') {
            results.dependencies.add(arg.text.slice(1, -1));
        }
    }

    // Extraction des déclarations et exports
    let isExported = node.parent?.type === 'export_statement';
    let declarationNode = isExported ? node.childForFieldName('declaration') || node : node;
    
    if (node.type === 'export_statement' && !declarationNode) {
        const namedExports = node.descendantsOfType('identifier');
        for(const id of namedExports) {
            if(results.symbols.has(id.text)) {
                results.symbols.get(id.text)!.isExported = true;
            }
        }
    }

    let symbol: SemanticSymbol | undefined;
    switch (declarationNode.type) {
        case 'class_declaration':
        case 'function_declaration':
        case 'interface_declaration':
            const nameNode = declarationNode.childForFieldName('name');
            if (nameNode) {
                symbol = {
                    name: nameNode.text,
                    kind: declarationNode.type.split('_')[0] as any,
                    isExported: isExported
                };
            }
            break;
    }

    if (symbol && !results.symbols.has(symbol.name)) {
        results.symbols.set(symbol.name, symbol);
    }

    // Appel récursif sur les enfants
    node.children?.forEach((child: SyntaxNode) => {
        traverseAst(child, results);
    });
}


const runAnalysis = async (filePath: string, fileContent: string, language: string | null, parsersPath: string): Promise<SemanticAnalysisPayload> => {
    if (!language) {
        return { filePath, language: 'unknown', dependencies: [], symbols: [], error: "Language not specified for analysis." };
    }

    try {
        await Parser.init();
        const parser = new Parser();
        const wasmPath = path.join(parsersPath, `tree-sitter-${language}.wasm`);
        const Lang = await Language.load(wasmPath);
        parser.setLanguage(Lang);
        const tree = parser.parse(fileContent);

        if (!tree?.rootNode) {
            return {
                filePath,
                language: language || 'unknown',
                dependencies: [],
                symbols: [],
                error: 'Failed to parse file: could not generate syntax tree'
            };
        }

        const analysisResults = {
            dependencies: new Set<string>(),
            symbols: new Map<string, SemanticSymbol>()
        };

        traverseAst(tree.rootNode, analysisResults);

        return {
            filePath,
            language,
            dependencies: Array.from(analysisResults.dependencies),
            symbols: Array.from(analysisResults.symbols.values()),
        };
    } catch (e: any) {
        return {
            filePath,
            language,
            dependencies: [],
            symbols: [],
            error: e.message,
            stack: e.stack
        };
    }
};

parentPort?.on('message', async (task) => {
    const { filePath, fileContent, language, parsersPath } = task;
    const result = await runAnalysis(filePath, fileContent, language, parsersPath);
    parentPort?.postMessage(result);
});