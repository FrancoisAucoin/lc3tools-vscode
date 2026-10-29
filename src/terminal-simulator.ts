/*
    Copyright 2026 François Aucoin
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import * as vscode from "vscode";
import { join as pathJoin } from "node:path";
import { tmpdir as osTmpdir } from "node:os";
import { writeFile, readdir, mkdtemp } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
    COMMAND_RUN_SIMULATOR_FOR_MULTIPLE_SOURCES,
    COMMAND_RUN_SIMULATOR,
    COMMAND_VALIDATE,
    CONFIG_SIMULATOR_LOG_LEVEL,
    CONFIG_SIMULATOR_OPEN_TERMINAL_IN_EDITOR_AREA,
    CONFIG_SIMULATOR_PREFIX,
    EXTENSION_SHORT_NAME,
    WASM_DIRECTORY,
    WASM_SIMULATOR_FILE,
    WASM_SIMULATOR_RUNNER,
} from "./constants";
import { createNodeBackedPseudoTerminal } from "./node-backed-pseudo-terminal";

const getFileName = (uri?: vscode.Uri): string | undefined => {
    if (!uri) {
        return undefined;
    }
    const pathComponents = uri.fsPath.split("/");
    const name = (pathComponents.length > 0 ? pathComponents[pathComponents.length - 1]! : "[no name]");
    return name;
};

const startTerminal = ({ fileURIs, jsModulePath, jsRunnerPath, terminalName, configurationScope }: {
    fileURIs: vscode.Uri[],
    jsRunnerPath: string,
    jsModulePath: string,
    terminalName?: string,
    configurationScope?: vscode.ConfigurationScope
}) => {
    // TODO: Right now we are assuming that all files come from the same workspace. That
    // is not unreasonable, but I would need to double-check whether it's actually possible,
    // at the UI level, to select and submit files from different workspaces.
    // Follow-up: I have checked and it is indeed possible to select files from different 
    // workspaces by using the explorer view and then "rick-clicking". What will happen is that
    // the context menu will appear for the right-clicked item, and that item, as I understand it,
    // will be the first inside the array (I actually need to confirm this; it may not be true). The main
    // problem here is that only the first file in the array is used to determine the "configuration scope",
    // so the user could be confused if using different configurations in their workspaces.
    const config = vscode.workspace.getConfiguration(CONFIG_SIMULATOR_PREFIX, configurationScope);
    const openTerminalInEditorArea = config.get<boolean>(CONFIG_SIMULATOR_OPEN_TERMINAL_IN_EDITOR_AREA, false);
    const logLevel = config.get<number>(CONFIG_SIMULATOR_LOG_LEVEL, 0);

    const name = terminalName ?? fileURIs.map(uri => getFileName(uri) ?? "?").join("_");

    let args = [jsModulePath, ...fileURIs.map(uri => uri.fsPath)];
    if (logLevel) {
        args.push(`--print-level=${logLevel}`);
    }

    const terminal = createNodeBackedPseudoTerminal({
        name: `Simulator: ${name}`,
        nodeEntryPointModule: jsRunnerPath,
        args,
        location: openTerminalInEditorArea ? {
            viewColumn: vscode.ViewColumn.Active,
            preserveFocus: false,
        } : undefined
    });

    terminal.show();
};

const createTemporaryFile = async (data: Uint8Array): Promise<{ uri: vscode.Uri }> => {
    const basePath = await mkdtemp(pathJoin(osTmpdir(), EXTENSION_SHORT_NAME + "-"));
    const filePath = pathJoin(basePath, randomUUID() + ".obj");
    await writeFile(filePath, data);
    return { uri: vscode.Uri.file(filePath) };
};

const validateAndAssembleInMemoryAndStartTerminal = async ({
    fileURIs,
    jsRunnerPath,
    jsModulePath
}: {
    fileURIs: vscode.Uri[],
    jsRunnerPath: string,
    jsModulePath: string,
}) => {
    const validated: ({ uri: vscode.Uri, data: Uint8Array, isObject: boolean } | undefined)[] = await Promise.all(fileURIs.map(async uri => {
        if (/(\.obj)$/i.test(uri.fsPath)) {
            return { uri, data: new Uint8Array(0), isObject: true };
        }
        // TODO: Do I need to try/catch here?
        const data: Uint8Array | undefined = await vscode.commands.executeCommand(COMMAND_VALIDATE, uri);
        if (!data) {
            return undefined;
        }
        return { uri, data, isObject: false };
    }));

    if (!validated.every(item => item !== undefined)) {
        vscode.window.showErrorMessage(`Assembly process failed for some of the selected items. Please check PROBLEMS panel and resolve issues and try again.`);
        return;
    }

    const tmpURIs = await Promise.all(validated.map(async item => {
        if (item.isObject) {
            return item.uri;
        } else {
            return (await createTemporaryFile(item.data)).uri;
        }
    }));

    startTerminal({
        fileURIs: tmpURIs,
        jsModulePath,
        jsRunnerPath,
        terminalName: validated.map(item => getFileName(item.uri) ?? "?").join(" | "),
        configurationScope: fileURIs[0]
    });
};

export const registerCommands = (basePath: string): vscode.Disposable[] => {
    const jsModulePath = pathJoin(basePath, WASM_DIRECTORY, WASM_SIMULATOR_FILE);
    const jsRunnerPath = pathJoin(basePath, WASM_DIRECTORY, WASM_SIMULATOR_RUNNER);

    const disposableMultiSourceSimulator = vscode.commands.registerCommand(COMMAND_RUN_SIMULATOR_FOR_MULTIPLE_SOURCES, async () => {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage("Please first open a workspace");
            return;
        }

        let workspaceFolder: vscode.WorkspaceFolder | undefined = undefined;
        if (vscode.workspace.workspaceFolders.length === 1) {
            workspaceFolder = vscode.workspace.workspaceFolders[0];
        } else {
            workspaceFolder = await vscode.window.showWorkspaceFolderPick();
        }
        if (!workspaceFolder) {
            return;
        }

        const files = (await readdir(workspaceFolder.uri.fsPath, {
            recursive: true,
            withFileTypes: true
        })).filter(file => {
            if (!file.isFile()) {
                return false;
            }
            return /(\.obj|\.asm|\.lc3-asm|\.bin|\.lc3-bin)$/i.test(file.name);
        });

        const quickPick = vscode.window.createQuickPick();
        quickPick.canSelectMany = true;
        quickPick.items = files.map(file => {
            const item: vscode.QuickPickItem = {
                label: file.name,
                detail: file.parentPath,
            };
            return item;
        });

        const promise = new Promise<boolean>(resolve => {
            quickPick.onDidAccept(() => resolve(quickPick.selectedItems.length > 0));
            quickPick.onDidHide(() => resolve(false));
        });

        quickPick.show();

        if (!(await promise)) {
            return;
        }

        const selectedUris = quickPick.selectedItems.map(item => {
            const path = pathJoin(item.detail!, item.label!);
            return vscode.Uri.file(path);
        });

        await validateAndAssembleInMemoryAndStartTerminal({ fileURIs: selectedUris, jsModulePath, jsRunnerPath });
    });

    const disposableSimulatorForSourceURIs = vscode.commands.registerCommand(COMMAND_RUN_SIMULATOR, async (fileUri?: vscode.Uri, maybeFileUriArray?: vscode.Uri[] | {}) => {
        if (fileUri === undefined) {
            const editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
                vscode.window.showErrorMessage(`${COMMAND_RUN_SIMULATOR} called without arguments?`);
                return;
            }
            fileUri = editor.document.uri;
        }

        // TODO: This gymnastic appears to be required because some events
        // for which only a single item is selected might only have the
        // first parameter defined, while right-clicked (in the file explorer,
        // for example) will have a second parameter that's 
        // an object of the type `{editorGroup: 1, someOtherProperty: "file"}`.
        // But those cases will always have the first parameter corresponding
        // to the file Uri.
        const fileURIs: vscode.Uri[] = (
            Array.isArray(maybeFileUriArray) &&
            maybeFileUriArray.length > 0 &&
            maybeFileUriArray[0]! instanceof vscode.Uri
        ) ? maybeFileUriArray : [fileUri];

        if (!fileURIs || fileURIs.length === 0) {
            vscode.window.showErrorMessage(`Trying to run '${COMMAND_RUN_SIMULATOR}' command without URIs. This should not happen. Please file an issue.`);
            return;
        }

        if (!fileURIs
            .map(uri => uri.fsPath.toLowerCase())
            .every(path => /(\.obj|\.asm|\.lc3-asm|\.bin|\.lc3-bin)$/i.test(path))) {
            vscode.window.showErrorMessage(`Command '${COMMAND_RUN_SIMULATOR}' failed. This should not happen. Please file an issue.`);
            return;
        }

        await validateAndAssembleInMemoryAndStartTerminal({ fileURIs, jsModulePath, jsRunnerPath });
    });

    return [
        disposableMultiSourceSimulator,
        disposableSimulatorForSourceURIs
    ];
};