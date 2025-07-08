// FICHIER À CRÉER : packages/core/src/services/registry/language.registry.service.ts

import { IFileSystem } from '@jabbarroot/types';
import * as path from 'path';

// --- INTERFACES DE DONNÉES ---
export interface LanguageMetadata {
  displayName: string;
  category: 'programming' | 'markup' | 'config' | 'data' | 'template' | 'shell' | 'documentation';
  isCompiled: boolean;
  commonFrameworks?: string[];
}

export interface DevelopmentToolsConfig {
  linter?: string[];
  formatter?: string[];
  debugger?: string[];
  languageServer?: string[];
  repl?: string[];
  documentationGenerator?: string[];
}

// --- LE SERVICE ---
export class LanguageRegistryService {
  private extensionToLanguageMap: Map<string, string> = new Map();
  private languageToParserMap: Map<string, string> = new Map();
  private languageMetadata: Map<string, LanguageMetadata> = new Map();
  private devToolsConfig: Map<string, DevelopmentToolsConfig> = new Map();
  private isInitialized = false;

  constructor(
    private readonly fs: IFileSystem,
    private readonly projectRootPath: string
  ) {}

  private async loadJsonData<T>(fileName: string): Promise<Record<string, T>> {
    const filePath = path.join(this.projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'languages', fileName);
    try {
      const content = await this.fs.readFile(filePath);
      return JSON.parse(content) as Record<string, T>;
    } catch (error) {
      console.error(`[LanguageRegistry] Failed to load configuration file: ${fileName}`, error);
      return {};
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const [extMap, parserMap, metadataModel, devToolsModel] = await Promise.all([
      this.loadJsonData<string>('extension-to-language.map.json'),
      this.loadJsonData<string>('language-to-parser.map.json'),
      this.loadJsonData<LanguageMetadata>('language-metadata.model.json'),
      this.loadJsonData<DevelopmentToolsConfig>('development-tools.config.json')
    ]);

    this.extensionToLanguageMap = new Map(Object.entries(extMap));
    this.languageToParserMap = new Map(Object.entries(parserMap));
    this.languageMetadata = new Map(Object.entries(metadataModel));
    this.devToolsConfig = new Map(Object.entries(devToolsModel));
    
    this.isInitialized = true;
    console.log('[LanguageRegistry] Service initialized successfully.');
  }

  // --- API PUBLIQUE ---

  public getLanguageFromFilename(filename: string): string | null {
    const basename = filename.toLowerCase();
    if (basename === 'dockerfile') return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    
    const extension = path.extname(filename).toLowerCase();
    if (!extension) return null;
    
    return this.extensionToLanguageMap.get(extension) || null;
  }

  public getParserForLanguage(language: string): string | null {
    return this.languageToParserMap.get(language) || null;
  }

  public supportsSemanticAnalysis(language: string): boolean {
    return this.languageToParserMap.has(language);
  }

  public getLanguageMetadata(language: string): LanguageMetadata | null {
    return this.languageMetadata.get(language) || null;
  }

  public getDevelopmentToolsConfig(language: string): DevelopmentToolsConfig | null {
    return this.devToolsConfig.get(language) || null;
  }

  public getToolForLanguage(language: string, toolType: keyof DevelopmentToolsConfig): string[] {
    const config = this.getDevelopmentToolsConfig(language);
    return config?.[toolType] || [];
  }

  public detectProjectLanguage(filenames: string[]): string | null {
    const langCount = new Map<string, number>();
    for (const filename of filenames) {
      const lang = this.getLanguageFromFilename(filename);
      if (lang) {
        const metadata = this.getLanguageMetadata(lang);
        if (metadata?.category === 'programming') {
          langCount.set(lang, (langCount.get(lang) || 0) + 1);
        }
      }
    }
    if (langCount.size === 0) return null;
    return [...langCount.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }

  public getGlobPatternForLanguage(language: string): string | null {
    const extensions = [...this.extensionToLanguageMap.entries()]
      .filter(([, lang]) => lang === language)
      .map(([ext]) => ext.substring(1));
    
    if (extensions.length === 0) return null;
    if (extensions.length === 1) return `**/*.${extensions[0]}`;
    return `**/*.{${extensions.join(',')}}`;
  }

  public isExtensionSupported(extension: string): boolean {
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    return this.extensionToLanguageMap.has(normalizedExt.toLowerCase());
  }

  public searchLanguages(query: string): string[] {
    const searchTerm = query.toLowerCase();
    const results = new Set<string>();
    for (const [lang, metadata] of this.languageMetadata.entries()) {
      if (lang.includes(searchTerm) || metadata.displayName.toLowerCase().includes(searchTerm)) {
        results.add(lang);
      }
    }
    return [...results].sort();
  }
}