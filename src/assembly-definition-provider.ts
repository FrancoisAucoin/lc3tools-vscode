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

class AssemblyDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private dataSource: AssemblyDocumentAnalysisDataSource) { }
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }
        if (this.dataSource.isSymbolInsideComment(document, range)) {
            return undefined;
        }
        const word = document.getText(range);
        const definitionRange = this.dataSource.getLabelDefinition(document, word);
        if (!definitionRange) {
            return undefined;
        }
        // NOTE: The LC-3 ISA Assembly language does not support linkage, so
        // we always know that the definition and the references are in the
        // same document.
        return new vscode.Location(document.uri, definitionRange);
    }
}

export const registerAssemblyDefinitionProvider = (dataSource: AssemblyDocumentAnalysisDataSource): vscode.Disposable => {
    return vscode.languages.registerDefinitionProvider(
        LANGUAGE_ID,
        new AssemblyDefinitionProvider(dataSource)
    );
};