// apps/vscode-extension/src/utils/workspace.ts
import * as vscode from 'vscode';
export const getProjectRootPath = (): string | undefined => {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
};