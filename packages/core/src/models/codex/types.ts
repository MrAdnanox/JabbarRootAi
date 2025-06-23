// src/models/codex/types.ts

// --------------- CORE MODULES ---------------

export interface Role {
    id: string;
    name: string;
    description: string;
  }
  
  export interface Law {
    id: string; // ex: "law_1"
    label: string; // ex: "LAW 1"
    name: string;
    description: string;
  }
  
  export interface Stance {
    id: string;
    name: string;
    activation: string;
    mission: string;
    deliverables: string;
  }
  
  // --------------- PROTOCOLS (Designed for future UI generation) ---------------
  
  export interface ProtocolField {
    id: string;
    label: string;
    type: 'static' | 'textarea' | 'metadata';
    template: string; // ex: "**Vision:** [The long term goal...]"
    placeholder?: string;
  }
  
  export interface ProtocolSection {
    id: string;
    name: string;
    fields: ProtocolField[];
  }
  
  export interface Protocol {
    id: string;
    title: string;
    sections: ProtocolSection[];
  }
  
  // --------------- ASSEMBLY STRUCTURES ---------------
  
  /**
   * Le Codex tel qu'il existe en mémoire après chargement et fusion.
   * C'est l'état d'exécution de JabbarRoot.
   */
  export interface LoadedCodex {
    version: string;
    profileName: string;
    roles: Role[];
    laws: Law[];
    stances: Stance[];
    protocols: Record<string, Protocol>; // ex: { 'surgical': Protocol, 'transition': Protocol }
  }
  
  /**
   * Représente la structure d'un fichier de profil sur le disque.
   * Permissif (tous les champs sont optionnels) pour permettre la surcharge.
   */
  export interface ProfileFile {
    extends?: string; // ex: "default"
    version?: string;
    profileName?: string;
    roles?: Role[];
    laws?: Law[];
    stances?: Stance[];
    protocols?: Record<string, Protocol>;
  }
  
  /**
   * Représente le contenu du fichier manifest.json.
   */
  export interface ManifestFile {
    activeProfile: string; // chemin relatif vers le fichier de profil .json
  }