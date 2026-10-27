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
import { LC3_ISA_SYMBOLS } from "./assembly-symbols";
import { AssemblyDocumentAnalysisDataSource } from "./interfaces";
import {
    LANGUAGE_ID,
    CONFIG_FORMATTER_PREFIX,
    CONFIG_FORMATTER_USE_LOWER_CASE
} from "./constants";


class AssemblyCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private dataSource: AssemblyDocumentAnalysisDataSource) { }
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {

        const config = vscode.workspace.getConfiguration(CONFIG_FORMATTER_PREFIX, document);
        const useUpperCase = !config.get<boolean>(CONFIG_FORMATTER_USE_LOWER_CASE, false);

        const items: vscode.CompletionItem[] = [];

        Object.keys(LC3_ISA_SYMBOLS).forEach(key => {
            const symbolInfo = LC3_ISA_SYMBOLS[key]!;
            {
                const item = new vscode.CompletionItem(useUpperCase ? symbolInfo.name.uppercase : symbolInfo.name.lowercase);
                item.documentation = new vscode.MarkdownString(symbolInfo.markdownDocumentation);
                if (symbolInfo.type === "opcode" || symbolInfo.type === "trap") {
                    // TODO
                    // For trap, we could add a 'trap' suffix to the title,
                    // to hint the user that's looking for a particular trap.
                    // For instance, `getc (trap x20)` in the title. Can I do
                    // that? The goal would be to have convenient filtering of 
                    // trap aliases. I'm not sure we can do that, however...
                    item.kind = vscode.CompletionItemKind.Function;
                }
                if (symbolInfo.type === "pseudo-opcode") {
                    const range = document.getWordRangeAtPosition(position);
                    if (range && range.start.character > 0) {
                        const updatedRange = new vscode.Range(
                            new vscode.Position(range.start.line, range.start.character - 1),
                            range.end
                        );
                        const text = document.getText(updatedRange);
                        if (text.startsWith(".")) {
                            item.range = updatedRange;
                        }
                    }
                }
                items.push(item);
            }
            if (symbolInfo.snippetSuffix) {
                const item = new vscode.CompletionItem(useUpperCase ? symbolInfo.name.uppercase : symbolInfo.name.lowercase);
                item.documentation = new vscode.MarkdownString(symbolInfo.markdownDocumentation);
                item.kind = vscode.CompletionItemKind.Snippet;
                item.insertText = new vscode.SnippetString(`${useUpperCase ? symbolInfo.name.uppercase : symbolInfo.name.lowercase}${symbolInfo.snippetSuffix}`);
                items.push(item);
            }
        });

        {
            this.dataSource.getLabels(document).forEach(({ text, markdown }) => {
                const item = new vscode.CompletionItem(useUpperCase ? text.toUpperCase() : text.toLowerCase());
                item.documentation = markdown;
                item.kind = vscode.CompletionItemKind.Reference;
                items.push(item);
            });
        }

        return items;

        // TODO: I had to comment this out for now because it caused issues for some completions.
        // return items.map(item => {
        //     // NOTE: This is OK because it will be ignored if the user has disabled formatting.
        //     item.command = { command: "editor.action.formatDocument", title: "Format Document" };
        //     return item;
        // });
    }
}

export const registerCompletionProvider = (dataSource: AssemblyDocumentAnalysisDataSource): vscode.Disposable => {
    return vscode.languages.registerCompletionItemProvider(
        LANGUAGE_ID,
        new AssemblyCompletionProvider(dataSource)
    );
};