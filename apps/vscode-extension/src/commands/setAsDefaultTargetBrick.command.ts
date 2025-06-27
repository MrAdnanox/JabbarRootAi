
import * as vscode from 'vscode';
import { BrickService } from '@jabbarroot/core';
import { BrickTreeItem } from '../providers/projectTreeItem.factory';

export function registerSetAsDefaultTargetBrickCommand(
    brickService: BrickService
): vscode.Disposable {
    return vscode.commands.registerCommand('jabbarroot.setAsDefaultTargetBrick', async (item: BrickTreeItem) => {
        if (!item || !item.brick) {
            vscode.window.showErrorMessage('No brick selected to set as default target.');
            return;
        }

        try {
            await brickService.setAsDefaultTarget(item.brick.id);
            vscode.window.showInformationMessage(`Brick "${item.brick.name}" is now the default target for additions.`);
            await vscode.commands.executeCommand('jabbarroot.refreshProjectView');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Error setting default target: ${errorMessage}`);
        }
    });
}
