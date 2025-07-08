// packages/core/src/models/project.types.ts

// Le type CompressionLevel est défini localement pour éviter les dépendances circulaires
export type CompressionLevel = 'none' | 'standard' | 'extreme';

/**
 * Options de configuration globales pour un JabbarProject.
 * Définit le comportement de compilation pour le projet dans son ensemble
 * et les options par défaut pour les BrickContexts qu'il contient.
 */
export interface JabbarProjectOptions {
    /** Niveau de compression appliqué lors de la compilation du projet global. 
     *  (Note: la compilation de projet n'est pas encore implémentée) 
     */
    compilationCompressionLevel: CompressionLevel; // Utilise le type importé
    /** Si true, inclut une section PROJECT_TREE lors de la compilation du projet global. 
     *  (Note: la compilation de projet n'est pas encore implémentée) 
     */
    compilationIncludeProjectTree: boolean;

    /** Niveau de compression par défaut pour les briques de ce projet lors de leur compilation individuelle. */
    defaultBrickCompressionLevel: CompressionLevel; // Utilise le type importé
    /** Si true, les briques incluront par défaut un PROJECT_TREE lors de leur compilation individuelle. */
    defaultBrickIncludeProjectTree: boolean;
    /** Profondeur maximale de l'arborescence à inclure lors de la génération du PROJECT_TREE (pour projet ou brique). */
    defaultBrickIncludeProjectTreeMaxDepth?: number;

    /** Chemins (relatifs au projectRootPath) vers des fichiers .jabbarrootignore spécifiques au projet. */
    projectIgnoreFiles?: string[];
    /** Patterns d'ignore glob (style .gitignore) appliqués à l'ensemble du projet. */
    projectIgnorePatterns?: string[];
}

/**
 * Représente un Projet jabbarroot, qui est un conteneur pour les BrickContexts
 * et définit un périmètre de travail (projectRootPath) et des configurations globales.
 */
export interface JabbarProject {
    /** Identifiant unique du projet (UUID). */
    id: string;
    /** Nom lisible du projet. */
    name: string;
    /** Chemin absolu sur le disque vers la racine du projet utilisateur. */
    projectRootPath: string;
    /** Liste des IDs des BrickContexts appartenant à ce projet. */
    brickContextIds: string[];
    /** Options de configuration globales pour ce projet. */
    options: JabbarProjectOptions;
    /** Métadonnées du projet. */
    metadata: {
        createdAt: string; // ISO 8601
        updatedAt: string; // ISO 8601
    };
}

/**
 * Options de configuration spécifiques à un BrickContext.
 * Peuvent surcharger les options par défaut définies dans le JabbarProject parent.
 */
export interface BrickContextOptions {
    /** Niveau de compression pour la compilation individuelle de cette brique.
     * Si non défini, utilise defaultBrickCompressionLevel du projet parent. */
    compilationCompressionLevel?: CompressionLevel; // Utilise le type importé
    /** Si true, inclut une section PROJECT_TREE lors de la compilation individuelle de cette brique.
     * Si non défini, utilise defaultBrickIncludeProjectTree du projet parent. */
    compilationIncludeProjectTree?: boolean;
    // Note : defaultBrickIncludeProjectTreeMaxDepth est utilisé depuis JabbarProjectOptions

    /** Chemins (relatifs au projectRootPath) vers des fichiers .jabbarrootignore spécifiques à la brique. */
    brickIgnoreFiles?: string[];
    /** Patterns d'ignore glob (style .gitignore) appliqués spécifiquement à cette brique. */
    brickIgnorePatterns?: string[];

    /** Sections spéciales existantes. (Ce champ semble être un vestige de ProgrammableContext, 
     *  sa pertinence ici est à évaluer. Pour l'instant, on le garde s'il est utilisé.) 
     *  Si non utilisé, envisager de le supprimer pour simplifier.
     *  
     *  Peut contenir soit une chaîne unique, soit un tableau de chaînes pour chaque section.
     */
    special_sections?: Record<string, string | string[]>; // Rendu optionnel pour plus de flexibilité
}

/**
 * Représente une Brique de Contexte (anciennement ProgrammableContext).
 * C'est une unité de travail focalisée au sein d'un JabbarProject, avec son propre
 * périmètre de fichiers (files_scope) et ses options.
 */
export interface BrickContext {
    /** Identifiant unique de la brique (UUID). */
    id: string;
    /** Identifiant du JabbarProject auquel cette brique appartient. */
    projectId: string;
    /** Nom lisible de la brique. */
    name: string;
    /** Liste des chemins de fichiers (relatifs au projectRootPath du projet parent) inclus dans cette brique. */
    files_scope: string[];
    /** Options de configuration spécifiques à cette brique. */
    options: BrickContextOptions;
    /** Si true, cette brique sera incluse lors de la compilation du projet parent. */
    isActiveForProjectCompilation: boolean;
    /** Si true, cette brique est la cible par défaut pour l'ajout de fichiers. */
    isDefaultTarget: boolean;
    /** Métadonnées de la brique. */
    metadata: {
        createdAt: string; // ISO 8601
        updatedAt: string; // ISO 8601
    };
}