// src/models/programmableContext.ts

/**
 * Définit la structure d'un Contexte Programmable.
 * C'est l'objet de configuration central manipulé par l'utilisateur et le système.
 */
export interface ProgrammableContext {
    /** Un identifiant unique et stable pour le contexte (ex: UUID). */
    id: string;
  
    /** Le nom lisible et modifiable par l'utilisateur. */
    name: string;
  
    /** La liste des fichiers et dossiers inclus dans le périmètre du contexte. */
    files_scope: string[];
  
    /** Les directives de traitement pour la génération du contexte. */
    options: {
      include_project_tree: boolean;
      compression_level: "none" | "standard" | "extreme";
      special_sections: Record<string, string[]>;
    };
    
    /** Les métadonnées internes pour le suivi. */
    metadata: {
      createdAt: string; // Date au format ISO 8601
    };
  }