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

import * as vscode from 'vscode';
import {
    AssemblyDiagnosticsUpdater,
    AssemblyProcessNotificationBroadcaster,
    AssemblyValidator,
    OutputAppender
} from './interfaces';
import { filterOutTerminalColoringCodes } from './util';
import { WasmAssemblerWorkerClientPool } from './wasm-assembler-worker';
import { COMMAND_ASSEMBLE, COMMAND_VALIDATE } from './constants';

const REGEX_ERROR: RegExp = /^(.+?):(\d+):(\d+):\s*error:\s*(.+)$/i;
const REGEX_ERROR_FALLBACK: RegExp = /^.*?\s+(\/[^\s]+\.[a-zA-Z0-9]+)\b.*$/i;
const REGEX_ERROR_FALLBACK_DESCRIPTION: RegExp = /^error:\s*(.+)$/i;

// TODO:
// The patterns used in this file don't really make sense. Refactoring
// is needed. The validation command needs the diagnostics manager, and
// the validator class is needed by the diagnostic manager. I don't like
// that. But it's like that because I started the project with this
// file being for the command and then realized that a failed validation 
// should write to the diagnostics. And the diagnostic manager itself is
// registering listeners to watch for file changes and "openings" to perform
// validation. So I need to review both the command and the diagnostic manager.
// And that was before using the Wasm assembler. This file was copy-pasted
// from `assembly-validation.ts`, which was using a host-specific binary
// of lc3-assembler. But now we don't even need that, as we have the Wasm
// version.

class AssemblerOutputValidator {
    private _stdout?: string;
    private _assemblyErrors: AssemblerOutputValidator.AssemblyError[] = [];
    private _validated: boolean = false;
    private _data?: Uint8Array;
    private _createdObjectFilePath?: string;
    private _failed: boolean = false;
    get wasSuccessful(): boolean {
        if (!this._validated) {
            throw new Error(`'validate' method was never called`);
        }
        return !this._failed;
        // return this._assemblyErrors.length === 0;
    }
    get assemblyErrors(): AssemblerOutputValidator.AssemblyError[] {
        if (!this._validated) {
            throw new Error(`'validate' method was never called`);
        }
        return this._assemblyErrors.map(e => ({ ...e }));
    }
    get stdout(): string | undefined {
        return this._stdout;
    }
    get data(): Uint8Array | undefined {
        return this._data;
    }
    get createdObjectFileUri(): vscode.Uri | undefined {
        if (!this._createdObjectFilePath) {
            return undefined;
        }
        return vscode.Uri.file(this._createdObjectFilePath);
    }
    constructor(
        readonly document: vscode.TextDocument,
        private clientWorkerPool: WasmAssemblerWorkerClientPool,
        private saveFile: boolean
    ) { }
    private get fsPath(): string {
        return this.document.uri.fsPath;
    }
    private get filteredLines(): string[] {
        if (this._stdout === undefined) {
            throw new Error("expecting '_stdout' to be defined");
        }
        return this._stdout.split(/\r?\n/).map(filterOutTerminalColoringCodes);
    }
    private parseStdoutForError(): void {
        if (!this._failed) {
            throw new Error(`This should not be called unless we have a failure`);
        }
        // Actually, there can be multiple errors, so I should iterate and test all lines
        // The identifiers is what gets flags, so when presenting, I would 
        // need to search till the end of the identifier to be able to outline
        // I also think I should return the whole output?!
        const lines = this.filteredLines;
        for (const line of lines) {
            const match = line.match(REGEX_ERROR);
            if (match) {
                const [_, filePath, line, position, errorMessage] = match;
                // TODO: Could validate Number parsing and throw upon NaN
                const lineValue: number = Number.parseInt(line!, 10) - 1;
                const positionValue: number = Number.parseInt(position!, 10) - 1;
                this._assemblyErrors.push({ filePath: filePath!, line: lineValue, position: positionValue, message: errorMessage! });
            }
        }

        // NOTE: It turns out that the assembler is not always outputting useful
        // error messages for all failures. For instance, using `1.1` will fail 
        // on the second pass, without diagnostic error messages. So this is a way
        // of letting the user know about the error. Note that the new `this._failed`
        // flag is used here to confirm a failure, although, in theory, we already know
        // since else we wouldn't be "parsing".
        if (this._assemblyErrors.length === 0 && this._failed) {
            if (lines.length === 0) {
                console.error(new Error(`Expecting at least a line...`));
                return;
            }
            const line = lines[0]!;
            const match = line.match(REGEX_ERROR_FALLBACK);
            if (!match) {
                console.error(new Error(`Failed to extract file path`));
                return;
            }
            const [, filePath,] = match;
            let message: string = "failed to assemble (cause unspecified by assembler)";
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i]!.match(REGEX_ERROR_FALLBACK_DESCRIPTION);
                if (match) {
                    message = match[1]!;
                    break;
                }
            }
            this._assemblyErrors.push({ filePath: filePath!, line: 0, position: 1, message });
        }
    }
    validate(callback: (self: this) => void): void {
        if (this._validated) {
            callback(this);
            return;
        }
        this._validated = true;
        this.clientWorkerPool.process(this.fsPath, this.saveFile).then(result => {
            this._stdout = result.text;
            if (!result.success) {
                this._failed = true;
                this.parseStdoutForError();
            } else {
                this._failed = false;
                this._data = result.data;
                this._createdObjectFilePath = result.createdObjectFilePath;
            }
            callback(this);
        });
    }
    validateAsyncNoThrow(): Promise<Uint8Array | undefined> {
        return new Promise(resolve => {
            this.validate(() => {
                resolve(this.data);
            });
        });
    }
}

namespace AssemblerOutputValidator {
    export interface AssemblyError {
        filePath: string,
        line: number;
        position: number;
        message: string;
    };
}

let _assemblyProcessNotificationBroadcaster: AssemblyProcessNotificationBroadcaster | undefined = undefined;
let _diagnosticsUpdater: AssemblyDiagnosticsUpdater | undefined = undefined;
let _outputAppender: OutputAppender | undefined = undefined;
let _clientWorkerPool: WasmAssemblerWorkerClientPool | undefined = undefined;

const performValidationForUriOrTextDocument = async (fileUriOrTextDocument: vscode.Uri | vscode.TextDocument, saveFile: boolean): Promise<Uint8Array | undefined> => {
    if (!_clientWorkerPool) {
        throw new Error(`Expecting an instance of WasmAssemblerWorkerClientPool`);
    }

    let document: vscode.TextDocument;
    if (fileUriOrTextDocument instanceof vscode.Uri) {
        // TODO: Do I need to try/catch here?
        document = await vscode.workspace.openTextDocument(fileUriOrTextDocument);
    } else {
        document = fileUriOrTextDocument;
    }

    const validator = new AssemblerOutputValidator(
        document,
        _clientWorkerPool,
        saveFile
    );
    return new Promise(resolve => {
        validator.validate(self => {
            if (self.stdout) {
                _outputAppender?.append(self.stdout, !self.wasSuccessful);
            }
            if (self.wasSuccessful) {
                const createdObjectUri = self.createdObjectFileUri;
                if (createdObjectUri) {
                    _assemblyProcessNotificationBroadcaster?.broadcastObjectFileCreated(createdObjectUri, document);
                }
                _diagnosticsUpdater?.updateDiagnostics(self.document, []);
                resolve(self.data);
                return;
            }

            if (_diagnosticsUpdater) {
                _diagnosticsUpdater.updateDiagnostics(self.document, self.assemblyErrors);
            } else {
                console.log(self.assemblyErrors);
            }

            resolve(undefined);
        });
    });
};

const performValidationForActiveEditor = (saveFile: boolean): Promise<Uint8Array | undefined> => {
    if (!_clientWorkerPool) {
        throw new Error(`Expecting an instance of WasmAssemblerWorkerClientPool`);
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return Promise.resolve(undefined);
    }
    return performValidationForUriOrTextDocument(editor.document, saveFile);
};

export class Validator implements AssemblyValidator {
    constructor(
        private outputAppender: OutputAppender,
        private clientWorkerPool: WasmAssemblerWorkerClientPool
    ) { }
    validate(document: vscode.TextDocument, callback: (assemblyErrors?: AssemblyDiagnosticsUpdater.AssemblyError[]) => void): void {
        const validator = new AssemblerOutputValidator(document, this.clientWorkerPool, false);
        validator.validate(self => {
            if (self.stdout) {
                this.outputAppender.append(self.stdout, !self.wasSuccessful);
            }
            if (self.wasSuccessful) {
                callback(undefined);
                return;
            }
            callback(self.assemblyErrors);
        });
    }
    validateAsyncNoThrow(document: vscode.TextDocument): Promise<AssemblyDiagnosticsUpdater.AssemblyError[] | undefined> {
        return new Promise(resolve => {
            this.validate(document, result => {
                resolve(result);
            });
        });
    }
}

export const registerCommands = ({
    diagnosticsUpdater,
    outputAppender,
    clientWorkerPool,
    assemblyProcessNotificationBroadcaster
}: {
    diagnosticsUpdater: AssemblyDiagnosticsUpdater,
    outputAppender: OutputAppender,
    clientWorkerPool: WasmAssemblerWorkerClientPool,
    assemblyProcessNotificationBroadcaster: AssemblyProcessNotificationBroadcaster
}): vscode.Disposable[] => {
    _diagnosticsUpdater = diagnosticsUpdater;
    _outputAppender = outputAppender;
    _clientWorkerPool = clientWorkerPool;
    _assemblyProcessNotificationBroadcaster = assemblyProcessNotificationBroadcaster;

    const disposableValidate = vscode.commands.registerCommand(COMMAND_VALIDATE, (fileUri?: vscode.Uri) => {
        if (fileUri === undefined) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage(`Command '${COMMAND_VALIDATE}' called without arguments. This should not happen. Please file an issue.`);
                return;
            }
            fileUri = editor.document.uri;
        }

        return performValidationForUriOrTextDocument(fileUri, false);
    });

    const disposableAssemble = vscode.commands.registerCommand(COMMAND_ASSEMBLE, () => {
        return performValidationForActiveEditor(true);
    });

    return [
        disposableValidate,
        disposableAssemble
    ];
};