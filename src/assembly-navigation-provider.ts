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

class AssemblyNavigationProvider implements vscode.DocumentSymbolProvider {
    constructor(private dataSource: AssemblyDocumentAnalysisDataSource) { }
    provideDocumentSymbols(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        return this.dataSource.getLabels(document).map(({ text, range }) => {
            const symbol = new vscode.DocumentSymbol(
                text.toUpperCase(),
                "",
                vscode.SymbolKind.Constant,
                range,
                range
            );
            return symbol;
        });
    }
}

export const registerAssemblyNavigationProvider = (dataSource: AssemblyDocumentAnalysisDataSource): vscode.Disposable => {
    return vscode.languages.registerDocumentSymbolProvider(
        LANGUAGE_ID,
        new AssemblyNavigationProvider(dataSource)
    );
};