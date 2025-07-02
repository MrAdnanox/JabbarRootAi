// apps/vscode-extension/src/services/ignore.service.ts
import * as vscode from 'vscode';
import { minimatch } from 'minimatch';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';
import { JabbarProject, BrickContext } from '@jabbarroot/core';
import * as path from 'path';

/**
 * Service responsable de la logique d'ignorance des fichiers,
 * utilisant la bibliothèque `minimatch` de manière standard.
 * Gère les règles d'ignorance provenant de différentes sources :
 * - Règles par défaut
 * - Fichier .gitignore
 * - Configuration du projet
 * - Contexte de la brique (optionnel)
 */
export class IgnoreService {
    // Cache pour les patterns déjà chargés
    private readonly patternCache = new Map<string, string[]>();
    
    // Règles d'ignorance par défaut (globs standards)
    private readonly DEFAULT_IGNORE = [
        // Dossiers racines à ignorer (sans préfixe **/)
        '.git',
        'node_modules',
        'dist',
        'build',
        'env',
        'venv',
        'coverage',
        'target',
        'bin',
        'obj',
        'out',
        'tmp',
        'temp',
        'logs',
        
        // Règles globales avec préfixe **/ pour les sous-dossiers
        '**/.git/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/env/**',
        '**/venv/**',
        '**/coverage/**',
        '**/target/**',
        '**/bin/**',
        '**/obj/**',
        '**/out/**',
        '**/tmp/**',
        '**/temp/**',
        '**/logs/**',
        
        // Fichiers système et temporaires
        '**/.DS_Store',
        '**/Thumbs.db',
        '**/*.log',
        '**/.vscode/**',
        '**/.idea/**',
        '**/__pycache__/**',
        '**/.pytest_cache/**',
        '**/.mypy_cache/**',
        '**/.env',
        '**/.env.*',
        '**/*.tmp',
        '**/*.temp',
        '**/*.swp',
        '**/*.swo',
        '**/~*',
        
        // Dépendances et caches
        '**/vendor/**',
        '**/bower_components/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.cache/**',
        '**/composer.phar',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/pnpm-lock.yaml',
        
        // Build et compilation
        '**/*.class',
        '**/*.jar',
        '**/*.war',
        '**/*.exe',
        '**/*.dll',
        '**/*.so',
        '**/*.dylib',
        '**/*.o',
        '**/*.obj',
        '**/*.pyc',
        '**/*.pyo',
        '**/*.pyd',
        
        // Documentation générée
        '**/docs/_build/**',
        '**/site/**',
        '**/_site/**',
        
        // Tests et couverture
        '**/test-results/**',
        '**/allure-results/**',
        '**/jest/**',
        '**/.nyc_output/**',
        
        // Sauvegardes et versions
        '**/*.bak',
        '**/*.backup',
        '**/*.orig',
        '**/*.rej',
        
        // Environnements virtuels Python
        '**/Scripts/**',
        '**/Lib/**',
        '**/Include/**',
        '**/pyvenv.cfg',
        
        // Fichiers de configuration sensibles
        '**/.secrets',
        '**/secrets/**',
        '**/*.key',
        '**/*.pem',
        '**/*.p12',
        '**/*.pfx',
        
        // Fichiers volumineux
        '**/*.iso',
        '**/*.dmg',
        '**/*.zip',
        '**/*.tar.gz',
        '**/*.rar',
        '**/*.7z',
        
        // Fichiers spécifiques aux OS
        '**/desktop.ini',
        '**/.Spotlight-V100',
        '**/.Trashes',
        '**/ehthumbs.db',
        
        // Fichiers d'éditeurs
        '**/*.sublime-workspace',
        '**/*.sublime-project',
        '**/.brackets.json',
        '**/.tern-project'
    ];

    constructor(private readonly fs: VscodeFileSystemAdapter) {}

    /**
     * Charge les patterns d'ignorance depuis un fichier
     */
    private async loadPatternsFromFile(projectRootPath: string, relativeFilePath: string): Promise<string[]> {
        const cacheKey = `${projectRootPath}:${relativeFilePath}`;
        
        // Vérifier le cache d'abord
        if (this.patternCache.has(cacheKey)) {
            return this.patternCache.get(cacheKey)!;
        }

        const absoluteFilePath = path.join(projectRootPath, relativeFilePath);
        try {
            const content = await this.fs.readFile(absoluteFilePath);
            const patterns = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            
            // Mettre en cache les résultats
            this.patternCache.set(cacheKey, patterns);
            return patterns;
        } catch (error) {
            // En cas d'erreur, retourner un tableau vide et mettre en cache
            this.patternCache.set(cacheKey, []);
            return [];
        }
    }

    /**
     * Normalise un pattern pour la correspondance de chemins
     */
    private normalizePattern(pattern: string): string {
        // Supprimer les espaces et les retours à la ligne
        let normalized = pattern.trim();
        
        // Remplacer les séparateurs Windows par des séparateurs Unix
        normalized = normalized.replace(/\\/g, '/');
        
        // Si le pattern commence par ./, le remplacer par **/
        if (normalized.startsWith('./')) {
            normalized = '**/' + normalized.substring(2);
        }
        
        // Si c'est un pattern de dossier, s'assurer qu'il se termine par /**
        if (normalized.endsWith('/')) {
            normalized += '**';
        }
        
        return normalized;
    }

    /**
     * Crée un prédicat d'ignorance basé sur les règles du projet et éventuellement d'une brique
     * 
     * @param project Le projet Jabbar contenant les règles d'ignorance
     * @param brick Contexte optionnel de la brique pour des règles spécifiques
     * @returns Une fonction qui détermine si un chemin doit être ignoré
     */
    public async createIgnorePredicate(
        project: JabbarProject,
        brick?: BrickContext
    ): Promise<(relativePath: string) => boolean> {
        try {
            // 1. Récupérer les patterns de base
            const patterns: string[] = [...this.DEFAULT_IGNORE];

            // 2. Charger les patterns du .gitignore
            const gitignorePatterns = await this.loadPatternsFromFile(project.projectRootPath, '.gitignore');
            patterns.push(...gitignorePatterns);

            // 3. Ajouter les patterns spécifiques au projet
            if (project.options.projectIgnorePatterns) {
                patterns.push(...project.options.projectIgnorePatterns);
            }

            // 4. Ajouter les patterns spécifiques à la brique si elle existe
            if (brick?.options?.brickIgnorePatterns) {
                patterns.push(...brick.options.brickIgnorePatterns);
            }

            // 5. Charger les patterns depuis les fichiers d'ignorance du projet
            if (project.options.projectIgnoreFiles) {
                for (const file of project.options.projectIgnoreFiles) {
                    const filePatterns = await this.loadPatternsFromFile(project.projectRootPath, file);
                    patterns.push(...filePatterns);
                }
            }

            // 6. Charger les patterns depuis les fichiers d'ignorance de la brique
            if (brick?.options?.brickIgnoreFiles) {
                for (const file of brick.options.brickIgnoreFiles) {
                    const filePatterns = await this.loadPatternsFromFile(project.projectRootPath, file);
                    patterns.push(...filePatterns);
                }
            }

            // 7. Normaliser et dédupliquer les patterns
            const normalizedPatterns: string[] = patterns.map(p => this.normalizePattern(p));
            const uniquePatterns: string[] = Array.from(new Set(normalizedPatterns));
            
            // 8. Séparer les règles d'ignorance des règles de négation
            const ignorePatterns: string[] = uniquePatterns.filter(p => !p.startsWith('!'));
            const unignorePatterns: string[] = uniquePatterns
                .filter(p => p.startsWith('!'))
                .map(p => p.substring(1));

            // 9. Créer le prédicat d'ignorance
            return (filePathToCheck: string): boolean => {
                // Normaliser le chemin à vérifier
                const normalizedPath = filePathToCheck
                    .replace(/\\/g, '/')  // Remplacer les backslashes par des slashes
                    .replace(/^\//, '');   // Supprimer le slash initial s'il existe

                // Vérifier si le chemin correspond à une règle d'ignorance
                const isIgnored = ignorePatterns.some(pattern => 
                    minimatch(normalizedPath, pattern, { 
                        dot: true,        // Inclure les fichiers cachés
                        matchBase: false,  // Nécessite un match complet du chemin
                        nocomment: true,   // Ignorer les commentaires
                        nocase: true       // Insensible à la casse
                    })
                );

                // Si le chemin n'est pas ignoré, on peut s'arrêter là
                if (!isIgnored) {
                    return false;
                }

                // Vérifier si le chemin est explicitement ré-inclus par une règle de négation
                const isUnignored = unignorePatterns.some(pattern => 
                    minimatch(normalizedPath, pattern, { 
                        dot: true,
                        matchBase: false,
                        nocomment: true,
                        nocase: true
                    })
                );

                // Le chemin est ignoré s'il correspond à une règle d'ignorance
                // et ne correspond à aucune règle de ré-inclusion
                const shouldBeIgnored = isIgnored && !isUnignored;

                // Journalisation pour le débogage
                if (shouldBeIgnored) {
                    console.log(`[JabbarRoot] Fichier ignoré: ${normalizedPath}`);
                }

                return shouldBeIgnored;
            };
        } catch (error) {
            console.error('[JabbarRoot] Erreur lors de la création du prédicat d\'ignorance:', error);
            // En cas d'erreur, retourner un prédicat qui n'ignore rien
            return () => false;
        }
    }
}