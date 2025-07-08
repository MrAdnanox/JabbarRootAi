// packages/prompt-factory/src/executors/structure-decoder.executor.ts
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { ArchitecturalReportV2 as ArchitecturalReport, ArchitecturalReportSchemaV2 } from '@jabbarroot/types';
import { ZodError } from 'zod';

export class BrickComplianceError extends Error {
  constructor(public readonly attempts: { attempt: number, prompt: string, rawResponse: string, error: string }[]) {
    // AMÉLIORATION : Le message d'erreur inclut maintenant un résumé des tentatives.
    const summary = attempts.map(a => `\n  Tentative ${a.attempt}: ${a.error}`).join('');
    super(`La brique n'a pas pu produire une sortie conforme après ${attempts.length} tentatives.${summary}`);
    this.name = 'BrickComplianceError';
  }
}

export class StructureDecoderExecutor {
  private readonly MAX_ATTEMPTS = 3;
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string = 'gemini-2.5-flash'; // Utilisation de la version 1.5-flash, plus courante

  constructor(
    apiKey: string,
    private readonly systemPromptContent: string
  ) {
    if (!apiKey) {throw new Error("API Key for Gemini is required.");}
    if (!systemPromptContent) {throw new Error("System prompt content is required.");}
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // NOUVELLE MÉTHODE DE BLINDAGE
  private extractJson(rawText: string): string {
    console.log('[Executor] Nettoyage de la réponse brute...');
    // Cherche un bloc de code JSON ```json ... ```
    const match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      console.log('[Executor] Bloc JSON trouvé et extrait.');
      return match[1].trim();
    }
    // Si pas de bloc, on retourne le texte en espérant qu'il soit du JSON pur
    console.log('[Executor] Aucun bloc JSON détecté, utilisation du texte brut.');
    return rawText.trim();
  }

  public async execute(fileTree: string): Promise<ArchitecturalReport> {
    const generationConfig: GenerationConfig = {
      responseMimeType: 'application/json',
    };
    
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: generationConfig
    });

    let lastError: ZodError | Error | null = null;
    const errorHistory: { attempt: number, prompt: string, rawResponse: string, error: string }[] = [];

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      const userPrompt = this.buildUserPrompt(fileTree, lastError);
      const fullPrompt = `${this.systemPromptContent}\n\n${userPrompt}`;
      let rawJsonText = ''; // Pour le logging

      // INSTRUMENTATION : Log du prompt envoyé
      console.log(`\n--- [Executor] Tentative ${attempt} : Envoi du Prompt ---`);
      console.log(fullPrompt);
      console.log(`--- Fin du Prompt ---`);

      try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        rawJsonText = response.text();

        // INSTRUMENTATION : Log de la réponse BRUTE reçue
        console.log(`\n--- [Executor] Tentative ${attempt} : Réponse Brute Reçue ---`);
        console.log(rawJsonText);
        console.log(`--- Fin de la Réponse Brute ---`);

        // BLINDAGE : Nettoyage de la réponse
        const cleanedJsonText = this.extractJson(rawJsonText);
        
        const jsonData = JSON.parse(cleanedJsonText);
        const validationResult = ArchitecturalReportSchemaV2.safeParse(jsonData);

        if (validationResult.success) {
          console.log(`[Executor] Tentative ${attempt} réussie !`);
          return validationResult.data;
        } else {
          lastError = validationResult.error;
          const errorMsg = `Échec de la validation Zod: ${validationResult.error.message}`;
          errorHistory.push({ 
            attempt, 
            prompt: fullPrompt, 
            rawResponse: rawJsonText, 
            error: errorMsg 
          });
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('Erreur inconnue');
        const errorMsg = `Erreur de parsing JSON ou de l'API: ${lastError.message}`;
        errorHistory.push({ 
          attempt, 
          prompt: fullPrompt, 
          rawResponse: rawJsonText, 
          error: errorMsg 
        });
      }
    }

    throw new BrickComplianceError(errorHistory);
  }

  private buildUserPrompt(fileTree: string, error: ZodError | Error | null): string {
    let prompt = `Analyze the following file tree and produce the JSON architectural report.\n\n--- PROJECT TREE ---\n${fileTree}`;
    if (error) {
      prompt += `\n\n--- PREVIOUS ATTEMPT FAILED ---\nYour last response failed Zod schema validation. You MUST correct it.\nError details: ${error.message}\n\nPlease provide a new, valid JSON response that strictly adheres to the schema.`;
    }
    return prompt;
  }
}