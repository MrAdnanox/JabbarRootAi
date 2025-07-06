// packages/prompt-factory/src/services/ordo-ab-chao/SemanticAnalysisService.ts

// CORRECTION : Importer 'Language' comme un export nommé distinct.
import { Parser, Language } from 'web-tree-sitter';
import * as path from 'path';
import { SemanticAnalysisResult } from './types';

const PARSERS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '.jabbarroot_data', 'system', 'parsers');

export class SemanticAnalysisService {
    private static parsers: Map<string, Parser> = new Map();
    private static initializationPromise: Promise<void> | null = null;
    private static languageLoadingPromises: Map<string, Promise<Parser>> = new Map();

    constructor() {
        if (!SemanticAnalysisService.initializationPromise) {
            SemanticAnalysisService.initializationPromise = Parser.init();
        }
    }

    private async getParser(language: string): Promise<Parser> {
        await SemanticAnalysisService.initializationPromise;

        if (SemanticAnalysisService.parsers.has(language)) {
            return SemanticAnalysisService.parsers.get(language)!;
        }

        if (SemanticAnalysisService.languageLoadingPromises.has(language)) {
            return SemanticAnalysisService.languageLoadingPromises.get(language)!;
        }

        const loadingPromise = (async (): Promise<Parser> => {
            const wasmPath = path.join(PARSERS_PATH, `tree-sitter-${language}.wasm`);
            try {
                // CORRECTION : Appeler Language.load() directement.
                const langObject = await Language.load(wasmPath);
                const parser = new Parser();
                parser.setLanguage(langObject);
                SemanticAnalysisService.parsers.set(language, parser);
                SemanticAnalysisService.languageLoadingPromises.delete(language);
                return parser;
            } catch (error) {
                SemanticAnalysisService.languageLoadingPromises.delete(language);
                console.error(`[SemanticAnalysisService] Failed to load grammar for ${language} from ${wasmPath}`, error);
                throw new Error(`Grammar for ${language} not available.`);
            }
        })();

        SemanticAnalysisService.languageLoadingPromises.set(language, loadingPromise);
        return loadingPromise;
    }

    private getLanguageFromPath(filePath: string): string | null {
        const ext = path.extname(filePath);
        switch (ext) {
            case '.ts':
            case '.tsx':
                return 'typescript';
            case '.js':
            case '.jsx':
                return 'javascript';
            default:
                return null;
        }
    }

    public async analyze(filePath: string, fileContent: string): Promise<SemanticAnalysisResult> {
        const language = this.getLanguageFromPath(filePath);
        if (!language) {
            throw new Error(`Unsupported file type for semantic analysis: ${filePath}`);
        }

        const parser = await this.getParser(language);
        const tree = parser.parse(fileContent);

        // TODO: Implémenter la logique d'extraction des symboles et dépendances
        const symbols: any[] = [];
        const dependencies: string[] = [];

        return {
            filePath,
            language,
            symbols,
            dependencies,
        };
    }
}