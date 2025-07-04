// apps/vscode-extension/src/core/result/errors.ts
export class ApiKeyNotConfiguredError extends Error {
    constructor() {
      super("La clé API Gemini n'est pas configurée dans les paramètres.");
      this.name = 'ApiKeyNotConfiguredError';
    }
  }