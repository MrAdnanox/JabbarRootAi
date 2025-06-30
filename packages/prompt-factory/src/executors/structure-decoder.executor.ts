// packages/prompt-factory/src/executors/structure-decoder.executor.ts
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { ArchitecturalReport, ArchitecturalReportSchema } from '../schemas/ArchitecturalReport.schema';
import { ZodError } from 'zod';

// ... (BrickComplianceError reste identique)
export class BrickComplianceError extends Error {
  constructor(public readonly attempts: { error: string }[]) {
    super(`The brick failed to produce a compliant output after ${attempts.length} attempts.`);
    this.name = 'BrickComplianceError';
  }
}

export class StructureDecoderExecutor {
  private readonly MAX_ATTEMPTS = 3;
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string = 'gemini-2.5-flash';

  // LE CHANGEMENT CRUCIAL EST ICI
  constructor(
    apiKey: string,
    private readonly systemPromptContent: string // Le prompt est maintenant injecté
  ) {
    if (!apiKey) throw new Error("API Key for Gemini is required.");
    if (!systemPromptContent) throw new Error("System prompt content is required.");
    this.genAI = new GoogleGenerativeAI(apiKey);
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
    const errorHistory: { error: string }[] = [];

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      const userPrompt = this.buildUserPrompt(fileTree, lastError);
      
      // Le prompt système est maintenant la propriété de la classe
      const fullPrompt = `${this.systemPromptContent}\n\n${userPrompt}`;

      try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const rawJsonText = response.text();
        const jsonData = JSON.parse(rawJsonText);
        const validationResult = ArchitecturalReportSchema.safeParse(jsonData);

        if (validationResult.success) {
          return validationResult.data;
        } else {
          lastError = validationResult.error;
          errorHistory.push({ error: `Attempt ${attempt}: Zod validation failed. Details: ${validationResult.error.message}` });
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('Unknown API or parsing error');
        errorHistory.push({ error: `Attempt ${attempt}: ${lastError.message}` });
      }
    }

    throw new BrickComplianceError(errorHistory);
  }

  // ... (buildUserPrompt reste identique)
  private buildUserPrompt(fileTree: string, error: ZodError | Error | null): string {
    let prompt = `Analyze the following file tree and produce the JSON architectural report.\n\n--- PROJECT TREE ---\n${fileTree}`;
    if (error) {
      prompt += `\n\n--- PREVIOUS ATTEMPT FAILED ---\nYour last response failed Zod schema validation. You MUST correct it.\nError details: ${error.message}\n\nPlease provide a new, valid JSON response that strictly adheres to the schema.`;
    }
    return prompt;
  }
}