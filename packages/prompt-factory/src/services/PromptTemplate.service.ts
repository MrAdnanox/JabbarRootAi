// packages/prompt-factory/src/services/PromptTemplate.service.ts
import { IFileSystem } from '@jabbarroot/types';
import * as path from 'path';

export class PromptTemplateService {
  constructor(private readonly fs: IFileSystem) {}

  /**
   * Rendu d'un template avec remplacement des variables
   * @param templateName Nom du template (sans extension)
   * @param projectRoot Racine du projet
   * @param role Rôle/catégorie du template (ex: 'doc', 'test-unit')
   * @param data Données pour le remplacement des variables
   * @returns Le contenu du template avec les variables remplacées
   */
  public async render(
    templateName: string,
    projectRoot: string,
    role: string,
    data: Record<string, string>
  ): Promise<string> {
    // Construction du chemin du template
    const templatePath = path.join(
      projectRoot,
      '.jabbarroot',
      'prompt-factory',
      'agents',
      role,
      `${templateName}.prompt.md`
    );

    console.log(`[PromptTemplate] Chargement du template: ${templatePath}`);

    try {
      // Lecture du contenu du template
      let templateContent = await this.fs.readFile(templatePath);

      // Remplacement des variables {{key}} par leurs valeurs
      for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');
        templateContent = templateContent.replace(placeholder, value);
      }

      return templateContent;
    } catch (error) {
      const errorMessage = `Erreur lors du rendu du template "${role}/${templateName}": ${error instanceof Error ? error.message : String(error)}`;
      console.error('[PromptTemplate]', errorMessage);
      throw new Error(`Template non trouvé ou erreur de rendu: ${role}/${templateName}`);
    }
  }
}