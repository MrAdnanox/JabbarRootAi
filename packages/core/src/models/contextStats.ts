// src/models/contextStats.ts

/**
 * Définit la structure d'un objet de statistiques de contexte.
 * Cet objet est calculé à la volée et n'est pas persisté, servant de 
 * Data Transfer Object (DTO) entre les services et la couche de présentation.
 */
export interface ContextStats {
    /** Le nombre de caractères dans le contexte non compressé. */
    originalChars: number;
    
    /** Le nombre de caractères dans le contexte après compression. */
    compressedChars: number;
    
    /** Le nombre de caractères économisés par la compression. */
    savedChars: number;
    
    /** Le pourcentage de réduction de taille (ex: 35 pour 35%). */
    reductionPercent: number;
  
    /** Une estimation du nombre de tokens avant compression. */
    originalTokensApprox: number;
    
    /** Une estimation du nombre de tokens après compression. */
    compressedTokensApprox: number;
    
    /** Une estimation du nombre de tokens économisés. */
    savedTokensApprox: number;
  
    /** Un message qualitatif sur l'efficacité de la compression. */
    motivation: string;
  }