// src/test/suite/extension.integration.test.ts

/*
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IContextService } from '../../services/contextService';
import { ContextTreeDataProvider, ContextTreeItem } from '../../providers/contextTreeDataProvider';
import { ProgrammableContext } from '../../models/programmableContext';

const createMockContextService = (): sinon.SinonStubbedInstance<IContextService> => {
  // Create a stub that matches the exact signature expected by vscode.Event
  const onDidChangeStub = sinon.stub<
    [listener: (e: void) => any, thisArgs?: any, disposables?: vscode.Disposable[] | undefined],
    vscode.Disposable
  >();

  // Create an event-like function that matches vscode.Event signature
  const eventLike = (
    listener: (e: void) => any,
    thisArgs?: any,
    disposables?: vscode.Disposable[]
  ): vscode.Disposable => {
    return onDidChangeStub(listener, thisArgs, disposables);
  };

  // Merge the stub properties with the event function
  const mockEvent = Object.assign(eventLike, onDidChangeStub) as vscode.Event<void> & sinon.SinonStub<
    [listener: (e: void) => any, thisArgs?: any, disposables?: vscode.Disposable[] | undefined],
    vscode.Disposable
  >;

  return {
    getContexts: sinon.stub(),
    getContext: sinon.stub(),
    createContext: sinon.stub(),
    deleteContext: sinon.stub(),
    refresh: sinon.stub(),
    onDidChange: mockEvent,
  };
};

const getMockExtensionContext = (subscriptions: vscode.Disposable[]): vscode.ExtensionContext => {
  const memento: vscode.Memento & { setKeysForSync(keys: readonly string[]): void } = {
    get: <T>(key: string): T | undefined => undefined,
    update: async (key: string, value: any): Promise<void> => {},
    keys: (): readonly string[] => [],
    setKeysForSync: (keys: readonly string[]): void => {},
  };

  return {
    subscriptions,
    workspaceState: memento,
    globalState: memento,
    extensionUri: vscode.Uri.file(''),
    storageUri: vscode.Uri.file(''),
    globalStorageUri: vscode.Uri.file(''),
    logUri: vscode.Uri.file(''),
    extensionPath: '',
    storagePath: '',
    globalStoragePath: '',
    logPath: '',
    asAbsolutePath: (p: string) => p,
    secrets: {
      get: async () => undefined,
      store: async () => {},
      delete: async () => {},
      onDidChange: new vscode.EventEmitter<any>().event
    },
    extensionMode: vscode.ExtensionMode.Test,
    environmentVariableCollection: {
      getScoped: (s: any) => undefined,
      description: undefined
    } as any,
    extension: {
      id: 'test.ext',
      extensionPath: '',
      isActive: false,
      packageJSON: {},
      extensionKind: vscode.ExtensionKind.Workspace,
      exports: {},
      activate: () => Promise.resolve({})
    } as any,
    languageModelAccessInformation: {
      getAccessInformation: (id: string) => Promise.resolve(undefined)
    } as any,
  };
};

suite('Extension Integration Test Suite', () => {
  let mockContextService: sinon.SinonStubbedInstance<IContextService>;
  let showInputBoxStub: sinon.SinonStub;
  let showOpenDialogStub: sinon.SinonStub;
  let showQuickPickStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let contextServiceInstance: IContextService;
  let commandDisposables: vscode.Disposable[];

  suiteSetup(async () => {
    // Create the mock service
    mockContextService = createMockContextService();
    contextServiceInstance = mockContextService;
    commandDisposables = [];

    // Register commands once for the entire suite
    const createContextCommand = vscode.commands.registerCommand('jabbaRoot.createContext', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Nom du contexte'
      });
      if (!name) return;

      const files = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true
      });
      if (!files || files.length === 0) return;

      const compressionLevel = await vscode.window.showQuickPick(
        ['standard', 'high', 'low'],
        { placeHolder: 'Niveau de compression' }
      );
      if (!compressionLevel) return;

      const includeProjectTree = await vscode.window.showQuickPick(
        ['Oui', 'Non'],
        { placeHolder: 'Inclure l\'arbre du projet?' }
      );
      if (!includeProjectTree) return;

      const options = {
        compression_level: compressionLevel as 'standard' | 'high' | 'low',
        include_project_tree: includeProjectTree === 'Oui'
      };

      await contextServiceInstance.createContext(name, files, options as Partial<ProgrammableContext['options']>);
    });

    const deleteContextCommand = vscode.commands.registerCommand('jabbaRoot.deleteContext', async (contextItem: ContextTreeItem) => {
      const confirmation = await vscode.window.showWarningMessage(
        `Voulez-vous vraiment supprimer le contexte "${contextItem.label}"?`,
        'Supprimer',
        'Annuler'
      );
      
      if (confirmation === 'Supprimer') {
        await contextServiceInstance.deleteContext(contextItem.context.id);
      }
    });

    commandDisposables.push(createContextCommand, deleteContextCommand);
  });

  setup(() => {
    // Reset all stubs before each test
    sinon.resetHistory();
    
    // Reset the mock service call history
    if (mockContextService) {
      mockContextService.deleteContext.resetHistory();
      mockContextService.createContext.resetHistory();
    }

    // Setup fresh stubs for each test
    showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
    showOpenDialogStub = sinon.stub(vscode.window, 'showOpenDialog');
    showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
    showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
    showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
  });

  teardown(() => {
    // Restore all stubs after each test
    sinon.restore();
  });

  suiteTeardown(() => {
    // Clean up command registrations after all tests
    commandDisposables.forEach(d => d.dispose());
    commandDisposables = [];
  });

  test('doit appeler createContext avec les bons arguments', async () => {
    // Arrange: Setup input responses
    showInputBoxStub.resolves('Nouveau Contexte');
    const fileUri = vscode.Uri.file('/dossier/fichier.js');
    showOpenDialogStub.resolves([fileUri]);
    showQuickPickStub.onFirstCall().resolves('standard');
    showQuickPickStub.onSecondCall().resolves('Oui');

    // Setup mock response
    const expectedContext: ProgrammableContext = {
      id: 'test-id',
      name: 'Nouveau Contexte',
      files_scope: ['/dossier/fichier.js'],
      options: {
        compression_level: 'standard',
        include_project_tree: true,
        special_sections: {}
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    };
    mockContextService.createContext.resolves(expectedContext);

    // Act: Execute the command
    await vscode.commands.executeCommand('jabbaRoot.createContext');

    // Assert: Verify the service was called with correct arguments
    assert.ok(
      mockContextService.createContext.calledOnce,
      "createContext should be called once"
    );

    const [name, files, options] = mockContextService.createContext.getCall(0).args;
    assert.strictEqual(name, 'Nouveau Contexte', "Name should match");
    assert.ok(Array.isArray(files), "Files should be an array");
    assert.strictEqual(files.length, 1, "Should have one file");
    assert.strictEqual(files[0].fsPath, '/dossier/fichier.js', "File path should match");
    assert.deepStrictEqual(options, {
      compression_level: 'standard',
      include_project_tree: true
    }, "Options should match");
  });

  /*
  test('doit appeler la suppression après confirmation', async () => {
    // Arrange: Create a mock context item
    const fakeContextItem = new ContextTreeItem({
      id: '123',
      name: 'Test',
      files_scope: [],
      options: {
        compression_level: 'standard',
        include_project_tree: false,
        special_sections: {}
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    });

    // Setup user confirmation
    showWarningMessageStub.resolves('Supprimer');

    // Act: Execute the delete command
    await vscode.commands.executeCommand('jabbaRoot.deleteContext', fakeContextItem);

    // Assert: Verify the service was called with correct ID
    assert.ok(
      mockContextService.deleteContext.calledOnceWith('123'),
      "deleteContext should be called with the correct ID"
    );
  });


  test('ne doit pas supprimer si l\'utilisateur annule', async () => {
    // Reset the mock before this test
    mockContextService.deleteContext.resetHistory();
    
    // Arrange: Create a mock context item
    const fakeContextItem = new ContextTreeItem({
      id: '456',
      name: 'Test Cancel',
      files_scope: [],
      options: {
        compression_level: 'standard',
        include_project_tree: false,
        special_sections: {}
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    });

    // Setup user cancellation - user clicks "Annuler"
    showWarningMessageStub.resolves('Annuler');

    // Act: Execute the delete command
    await vscode.commands.executeCommand('jabbaRoot.deleteContext', fakeContextItem);

    // Assert: Verify the service was NOT called
    assert.strictEqual(
      mockContextService.deleteContext.callCount, 
      0,
      "deleteContext should not be called when user cancels"
    );
  });

  test('ne doit pas supprimer si l\'utilisateur ferme le dialogue', async () => {
    // Reset the mock before this test
    mockContextService.deleteContext.resetHistory();
    
    // Arrange: Create a mock context item
    const fakeContextItem = new ContextTreeItem({
      id: '789',
      name: 'Test Dismiss',
      files_scope: [],
      options: {
        compression_level: 'standard',
        include_project_tree: false,
        special_sections: {}
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    });

    // Setup user dismissing dialog (undefined means user closed dialog without selecting)
    showWarningMessageStub.resolves(undefined);

    // Act: Execute the delete command
    await vscode.commands.executeCommand('jabbaRoot.deleteContext', fakeContextItem);

    // Assert: Verify the service was NOT called
    assert.strictEqual(
      mockContextService.deleteContext.callCount, 
      0,
      "deleteContext should not be called when user dismisses dialog"
    );
  });
});
*/