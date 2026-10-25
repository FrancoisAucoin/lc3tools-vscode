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
import { AssemblyDocumentAnalysisDataSource } from "./interfaces";
import { CONFIG_CODELENSES_ENABLED, CONFIG_PREFIX, LANGUAGE_ID } from "./constants";

const areLabelCodeLensesEnabled = (uri: vscode.Uri): boolean => {
    const config = vscode.workspace.getConfiguration(CONFIG_PREFIX, uri);
    return config.get<boolean>(CONFIG_CODELENSES_ENABLED, true);
};

export class AssemblyCodeLensProvider implements vscode.CodeLensProvider {
    public readonly onDidChangeCodeLenses: vscode.Event<void> | undefined;
    // private _onDidChangeCodeLenses: vscode.EventEmitter<void>;
    constructor(private dataSource: AssemblyDocumentAnalysisDataSource) {
        // this._onDidChangeCodeLenses = new vscode.EventEmitter<void>();
        // this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    }
    provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        if (!areLabelCodeLensesEnabled(document.uri)) {
            return [];
        }
        const codeLenses: vscode.CodeLens[] = [];
        this.dataSource.getLabels(document).forEach(({ text: labelText, range: labelRange }) => {
            const references = this.dataSource.getLabelReferences(document, labelText);
            const command: vscode.Command = {
                title: references.length === 1 ? `1 reference` : `${references.length} references`,
                command: "editor.action.goToLocations",
                arguments: [
                    document.uri,
                    labelRange.start,
                    references.map(ref => new vscode.Location(document.uri, ref.start)),
                    "peek", // goto, gotoAndPeek, peek
                    "No references"
                ]
            };
            codeLenses.push(new vscode.CodeLens(labelRange, command));
        });
        return codeLenses;
    }
    // resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {

    // }
}

export const registerAssemblyCodeLensProvider = (dataSource: AssemblyDocumentAnalysisDataSource): vscode.Disposable => {
    return vscode.languages.registerCodeLensProvider(
        LANGUAGE_ID, new AssemblyCodeLensProvider(dataSource)
    );
};
