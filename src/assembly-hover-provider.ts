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
import { LC3_ISA_SYMBOLS, SymbolInfo } from "./assembly-symbols";
import { Value as AnalyzerValue, ValueType as AnalyzerValueType } from "./assembly-analyzer";
import { AssemblyDocumentAnalysisDataSource } from "./interfaces";
import { LANGUAGE_ID } from "./constants";

const NUMBER_REGULAR_EXPRESSION: RegExp = /(?<![a-zA-Z0-9_])(#?-?[0-9]+|x[0-9a-fA-F]+|b[01]+)(?![a-zA-Z0-9_])/i;

const ASCII_LOOKUP: string[] = [
    "Null", "Start of Heading", "Start of Text", "End of Text", "End of Transmission", "Enquiry", "Acknowledge", "Bell, Alert",
    "Backspace", "Horizontal Tab", "Line Feed", "Vertical Tab", "Form Feed", "Carriage Return", "Shift Out", "Shift In",
    "Data Link Escape", "Device Control 1 (XON)", "Device Control 2", "Device Control 3 (XOFF)", "Device Control 4", "Negative Acknowledge", "Synchronous Idle", "End of Transmission Block",
    "Cancel", "End of Medium", "Substitute", "Escape", "File Separator", "Group Separator", "Record Separator", "Unit Separator",
    "Space", "!", "\"", "#", "$", "%", "&", "'",
    "(", ")", "*", "+", ",", "-", ".", "/",
    "0", "1", "2", "3", "4", "5", "6", "7",
    "8", "9", ":", ";", "<", "=", ">", "?",
    "@", "A", "B", "C", "D", "E", "F", "G",
    "H", "I", "J", "K", "L", "M", "N", "O",
    "P", "Q", "R", "S", "T", "U", "V", "W",
    "X", "Y", "Z", "[", "\\", "]", "^", "_",
    "`", "a", "b", "c", "d", "e", "f", "g",
    "h", "i", "j", "k", "l", "m", "n", "o",
    "p", "q", "r", "s", "t", "u", "v", "w",
    "x", "y", "z", "{", "|", "}", "~", "Delete"
];

class AssemblyHoverProvider implements vscode.HoverProvider {
    constructor(
        private dataSource: AssemblyDocumentAnalysisDataSource,
        private formatter: (text: string) => string
    ) { }
    provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        symbolBlock: {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                break symbolBlock;
            }

            if (this.dataSource.isSymbolInsideComment(document, range)) {
                break symbolBlock;
            }

            let word = document.getText(range).toLowerCase();

            if (range && range.start.character > 0) {
                const updatedRange = new vscode.Range(
                    new vscode.Position(range.start.line, range.start.character - 1),
                    range.end
                );
                const text = document.getText(updatedRange);
                if (text.startsWith(".")) {
                    word = "." + word;
                }
            }

            const symbolInfo: SymbolInfo | undefined = LC3_ISA_SYMBOLS[word];
            if (symbolInfo) {
                return new vscode.Hover(new vscode.MarkdownString(symbolInfo.markdownDocumentation));
            }
        }

        numberBlock: {
            // TODO: regular expression
            const range = document.getWordRangeAtPosition(position, NUMBER_REGULAR_EXPRESSION);
            if (!range) {
                break numberBlock;
            }
            if (this.dataSource.isSymbolInsideComment(document, range)) {
                break numberBlock;
            }
            const word = document.getText(range).toLowerCase();
            const value = new AnalyzerValue(word);
            if (value.isValid) {
                // TODO: Could create a table here.
                const out = new vscode.MarkdownString(`### Numerical value\n`);
                out.appendMarkdown(`* **Decimal (signed):** ${value.valueSigned}\n`);
                out.appendMarkdown(`* **Decimal (unsigned):** ${value.valueUnsigned}\n`);
                out.appendMarkdown(`* **Hexadecimal:** 0${value.format(AnalyzerValueType.hexadecimal, true)}\n`);
                out.appendMarkdown(`* **Binary:** 0${value.format(AnalyzerValueType.binary, true)}\n`);
                if (value.value >= 0 && value.value <= 127) {
                    out.appendMarkdown(`* **ASCII:** ${ASCII_LOOKUP[value.value]}`);
                }
                return new vscode.Hover(out);
            }
        }

        labelBlock: {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                break labelBlock;
            }
            if (this.dataSource.isSymbolInsideComment(document, range)) {
                break labelBlock;
            }
            const word = document.getText(range).toLowerCase();
            const info = this.dataSource.getLabelInfo(document, word);
            if (info) {
                // TODO: Ideally there would be a better way here. I don't like
                // the idea of having to read back the raw value from the markdown
                // string object, format it again, and create a new markdown string object.
                // Maybe (at least) the `getInfo` method should not even return a markdown string object
                // in the first place, since we are not using it.
                const md = new vscode.MarkdownString(this.formatter(info.value));
                return new vscode.Hover(md);
                // return new vscode.Hover(info);
            }
        }

        return undefined;
    }
}

export const registerAssemblyHoverProvider = (dataSource: AssemblyDocumentAnalysisDataSource, formatter: (text: string) => string): vscode.Disposable => {
    return vscode.languages.registerHoverProvider(
        LANGUAGE_ID, new AssemblyHoverProvider(dataSource, formatter)
    );
};
