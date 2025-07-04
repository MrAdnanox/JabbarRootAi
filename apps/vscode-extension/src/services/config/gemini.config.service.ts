// apps/vscode-extension/src/services/config/gemini.config.service.ts
import * as vscode from 'vscode';
import { Result, Success, Failure } from '../../core/result/result';
import { ApiKeyNotConfiguredError } from '../../core/result/errors';
import { IService } from '../../core/interfaces';

export class GeminiConfigService implements IService {
  public async getApiKey(): Promise<Result<string, ApiKeyNotConfiguredError>> {
    const config = vscode.workspace.getConfiguration('jabbarroot');
    const apiKey = config.get<string>('gemini.apiKey');
    return apiKey && apiKey.trim() !== ''
      ? new Success(apiKey)
      : new Failure(new ApiKeyNotConfiguredError());
  }
}