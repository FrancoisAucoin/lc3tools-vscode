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
import { AssemblyDiagnosticsUpdater, AssemblyValidator } from './interfaces';
import { LANGUAGE_ID, CONFIG_PREFIX, CONFIG_VALIDATE_ON_SAVE } from "./constants";

const shouldValidateOnSave = (uri: vscode.Uri): boolean => {
    const config = vscode.workspace.getConfiguration(CONFIG_PREFIX, uri);
    return config.get<boolean>(CONFIG_VALIDATE_ON_SAVE, true);
};

export class AssemblyDiagnosticManager implements AssemblyDiagnosticsUpdater {
    private collection: vscode.DiagnosticCollection; // It's possible that I don't event need that at all
    private monitoredDocuments: Set<vscode.Uri>;
    constructor(private context: vscode.ExtensionContext, private validator: AssemblyValidator) {
        this.monitoredDocuments = new Set<vscode.Uri>();
        this.collection = vscode.languages.createDiagnosticCollection(LANGUAGE_ID);
        context.subscriptions.push(this.collection);
        this.createSubscriptions();
    }
    private clearDiagnostics(uri: vscode.Uri): void {
        if (this.monitoredDocuments.delete(uri)) {
            this.collection.delete(uri);
        }
    }
    private createSubscriptions(): void {
        {
            const disposable = vscode.workspace.onDidCloseTextDocument(event => {
                if (event.languageId === LANGUAGE_ID) {
                    this.clearDiagnostics(event.uri);
                }
            });
            this.context.subscriptions.push(disposable);
        }
        {
            const disposable = vscode.workspace.onDidSaveTextDocument(event => {
                if (event.languageId === LANGUAGE_ID && shouldValidateOnSave(event.uri)) {
                    this.validateDocument(event.uri);
                }
            });
            this.context.subscriptions.push(disposable);
        }
        {
            const disposable = vscode.workspace.onDidOpenTextDocument(event => {
                if (event.languageId === LANGUAGE_ID && shouldValidateOnSave(event.uri)) {
                    this.validateDocument(event.uri);
                }
            });
            this.context.subscriptions.push(disposable);
        }
    }
    private async validateDocument(documentUri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(documentUri);
            const result = await this.validator.validateAsyncNoThrow(document);
            this.updateDiagnostics(document, result ?? []);
        } catch (error) {
            console.error(error);
        }
    }
    updateDiagnostics(document: vscode.TextDocument, assemblyErrors: AssemblyDiagnosticsUpdater.AssemblyError[]): void {
        this.clearDiagnostics(document.uri);
        if (assemblyErrors.length === 0) {
            return;
        }
        this.monitoredDocuments.add(document.uri);
        const diagnostics: vscode.Diagnostic[] = [];
        assemblyErrors.forEach(error => {
            const start = new vscode.Position(error.line, error.position);
            let endPosition = findEndOfToken(document.getText(), start) ?? (error.position + 1);
            const end = new vscode.Position(error.line, endPosition);
            const range = new vscode.Range(start, end);
            const diagnostic = new vscode.Diagnostic(
                range,
                error.message,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        });
        this.collection.set(document.uri, diagnostics);
    }
    clear(): void {
        this.collection.clear();
    }
}

const findEndOfToken = (text: string, position: vscode.Position): number | undefined => {
    const lines = text.split("\n");
    if (position.line >= lines.length) {
        return undefined;
    }
    const line = lines[position.line];
    if (line === undefined || position.character >= line.length) {
        return undefined;
    }
    const s = line.substring(position.character);
    // s.match(/[^a-zA-Z0-9_]/) // \W does that
    const m = s.match(/\W/) || undefined;
    const index = m?.index;
    if (index === undefined) {
        return line.length;
    }
    return index + position.character;
};