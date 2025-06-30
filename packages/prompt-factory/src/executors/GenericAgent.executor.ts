// packages/prompt-factory/src/executors/GenericAgent.executor.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, SafetySetting } from '@google/generative-ai';

export class GenericAgentExecutor {
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("API Key for Gemini is required.");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async execute(systemPrompt: string, userContext: string): Promise<string> {
    const generationConfig: GenerationConfig = {
      temperature: 0.7,
      topP: 1,
      topK: 1,
      maxOutputTokens: 8192,
    };
    
    const safetySettings: SafetySetting[] = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    // CORRECTION : Les configurations sont passées ici
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: generationConfig, // Déplacé ici
      safetySettings: safetySettings      // Déplacé ici
    });

    try {
      // CORRECTION : L'appel n'a plus qu'un seul argument
      const result = await model.generateContent(userContext);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API Gemini:", error);
      throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}