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
import { LANGUAGE_ID } from "./constants";

class AssemblyLabelRenameProvider implements vscode.RenameProvider {
    constructor(private dataSource: AssemblyDocumentAnalysisDataSource) { }
    prepareRename(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string; }> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }
        const word = document.getText(range);
        const definitionRange = this.dataSource.getLabelDefinition(document, word);
        return definitionRange ? range : undefined; // We only make sure the token exists
    }
    provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.WorkspaceEdit> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }
        const word = document.getText(range);
        // NOTE: The LC-3 ISA Assembly language does not support linkage, so
        // we always know that the definition and the references are in the
        // same document.
        const referenceRanges = this.dataSource.getLabelReferences(document, word).map(range => {
            return new vscode.Location(document.uri, range);
        }).map(ref => ref.range);
        const definitionRange = this.dataSource.getLabelDefinition(document, word);
        if (definitionRange) {
            referenceRanges.push(definitionRange);
        }

        const edit = new vscode.WorkspaceEdit();
        referenceRanges.forEach(referenceRange => {
            edit.replace(document.uri, referenceRange, newName);
        });

        return edit;
    }
}

export const registerAssemblyLabelRenameProvider = (dataSource: AssemblyDocumentAnalysisDataSource): vscode.Disposable => {
    return vscode.languages.registerRenameProvider(
        LANGUAGE_ID, new AssemblyLabelRenameProvider(dataSource)
    );
};
