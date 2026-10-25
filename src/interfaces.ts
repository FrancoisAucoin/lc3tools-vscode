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

export interface AssemblyDiagnosticsUpdater {
    updateDiagnostics(document: vscode.TextDocument, assemblyErrors: AssemblyDiagnosticsUpdater.AssemblyError[]): void;
}

export interface OutputAppender {
    append(text: string, isError: boolean): void;
}

export interface AssemblyValidator {
    validate(document: vscode.TextDocument, callback: (assemblyErrors?: AssemblyDiagnosticsUpdater.AssemblyError[]) => void): void;
    validateAsyncNoThrow(document: vscode.TextDocument): Promise<AssemblyDiagnosticsUpdater.AssemblyError[] | undefined>;
}

export namespace AssemblyDiagnosticsUpdater {
    export interface AssemblyError {
        line: number;
        position: number;
        message: string;
    }
}

export interface AssemblyDocumentAnalysisDataSource {
    getLabelDefinition(document: vscode.TextDocument, labelText: string): vscode.Range | undefined;
    getLabelReferences(document: vscode.TextDocument, labelText: string): vscode.Range[];
    getLabelInfo(document: vscode.TextDocument, labelText: string): vscode.MarkdownString | undefined;
    isSymbolInsideComment(document: vscode.TextDocument, range: vscode.Range): boolean;
    getLabels(document: vscode.TextDocument): { text: string, range: vscode.Range, markdown?: vscode.MarkdownString }[];
}


export interface AssemblyProcessNotificationBroadcaster {
    broadcastObjectFileCreated(uri: vscode.Uri, configurationScope: vscode.ConfigurationScope): void;
}

