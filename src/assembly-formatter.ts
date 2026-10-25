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
import { Label, Line, LineType, Opcode, Operand } from "./assembly-analyzer";
import { countTrailingOccurrencesOfCharacter } from "./util";
import {
    CONFIG_FORMATTER_ENABLED,
    CONFIG_FORMATTER_PREFIX,
    CONFIG_FORMATTER_USE_LOWER_CASE,
    CONFIG_FORMATTER_USE_SPACE_AFTER_COMMAS,
    LANGUAGE_ID
} from "./constants";

interface FormatterOneSettings {
    tabSpaces: number;
    useLowerCase: boolean;
    useSpaceAfterCommas: boolean;
    stripComments?: boolean;
}

class FormatterOne {
    private _lines: Line[];
    private _formatted: string;
    // private _unformattedLines: { index: string, text: string }[];
    private _maxLabelCharacterLength!: number;
    private _maxOpcodeCharacterLength!: number;
    private _maxOperandsCharacterLength!: number;
    constructor(text: string, private settings: FormatterOneSettings) {
        this._lines = Line.parseLines(text);
        // this._formatted = "";
        // this._unformattedLines = [];
        this.calculateMaxCharacterLengths();
        this._formatted = this.parse();
    }
    private get paddingLabel(): number {
        return this._maxLabelCharacterLength;
    }
    private get paddingOpcode(): number {
        return this._maxOpcodeCharacterLength;
    }
    private get paddingOperands(): number {
        return this._maxOperandsCharacterLength;
    }
    private get useLowerCase(): boolean {
        return this.settings.useLowerCase;
    }
    private get useSpaceAfterCommas(): boolean {
        return this.settings.useSpaceAfterCommas;
    }
    private get tabSpaces(): number {
        return this.settings.tabSpaces;
    }
    private get stripComments(): boolean {
        return this.settings.stripComments ?? false;
    }
    private calculateMaxCharacterLengths(): void {
        this._maxLabelCharacterLength = this._lines
            .filter(line => line.lineType === LineType.labeled)
            .map(line => line.label?.length ?? 0)
            .reduce((a, c) => a < c ? c : a, 0);

        this._maxOpcodeCharacterLength = this._lines
            .filter(line => line.isValid)
            .filter(line => line.opcode !== undefined) // this is because could be "labeled" or "opcode"
            .map(line => line.opcode!.length)
            .reduce((a, c) => a < c ? c : a, 0);

        // TODO: Need to watch to make sure that operand number formatting 
        // will not change the length
        this._maxOperandsCharacterLength = this._lines
            .filter(line => line.isValid)
            .filter(line => line.operands !== undefined && line.operands.length > 0 && !line.stringLiteral)
            .map(line => {
                const operands = line.operands!.map(o => new Operand(o));
                if (!operands.every(o => o.isValid)) {
                    throw new Error("expecting operands to be valid");
                }
                return operands.map(o => o.format(false)).join(",").length;
            })
            .reduce((a, c) => a < c ? c : a, 0);
    }
    private parse(): string {
        const textLines: string[] = [];
        for (const line of this._lines) {
            if (!line.isValid) {
                textLines.push(line.text);
                continue;
            }
            let out: string = "";

            let n: number = 0;
            if (line.label) {
                const label = new Label(line.label);
                if (!label.isValid) {
                    throw new Error("expecting valid label");
                }
                const text = label.format(this.useLowerCase);
                out += text;
                n = text.length;
            }

            out += "".padStart(this.paddingLabel - n + this.tabSpaces, " ");
            n = 0;

            if (line.opcode) {
                const opcode = new Opcode(line.opcode);
                if (!opcode.isValid) {
                    throw new Error("expecting valid opcode");
                }
                const text = opcode.format(this.useLowerCase);
                out += text;
                n = text.length;
            }

            out += "".padStart(this.paddingOpcode - n + this.tabSpaces, " ");
            n = 0;

            if (line.operands && line.operands.length > 0) {
                const operands = line.operands.map(o => new Operand(o));
                if (!operands.every(o => o.isValid)) {
                    throw new Error("expecting valid operands");
                }
                const text = operands
                    .map(o => o.format(this.useLowerCase))
                    .join(this.useSpaceAfterCommas ? ", " : ",");
                out += text;
                n = text.length;
            }

            if (line.stringLiteral) { // This still needs to come before the spacing, because it's an operand.
                out += line.stringLiteral;
            }

            out += "".padStart(this.paddingOperands - n + this.tabSpaces, " ");
            n = 0;

            if (line.lineType === LineType.comment) {
                out = line.text;
            } else if (line.comment && !this.stripComments) {
                if (line.stringLiteral) {
                    // TODO: Make sure this works
                    out = out.trimEnd();
                    const padding: number = countTrailingOccurrencesOfCharacter(line.stringLiteral, " ");
                    out += "".padStart(padding, " ") + "; " + line.comment.trim();
                } else {
                    out += `; ${line.comment.trim()}`;
                }
            }

            textLines.push(out);
        }

        return textLines.map(text => text.trimEnd()).join("\n");
    }
    get formattedText(): string {
        return this._formatted;
    }
}

export const formatText = (text: string, stripComment?: boolean): string => {
    const tabSize = vscode.window.activeTextEditor?.options.tabSize;
    if (!tabSize || typeof tabSize !== "number") {
        return text;
    }
    // TODO: For now we'll get the scope from the active editor, if any.
    // It's a valid assumption given that we know how this helper will be used,
    // but it's not ideal. Moreover, it would be better to not have this helper
    // at all and solve the problem using another approach, but it's OK for now.
    const config = vscode.workspace.getConfiguration(CONFIG_FORMATTER_PREFIX, vscode.window.activeTextEditor?.document);
    if (!config.get<boolean>(CONFIG_FORMATTER_ENABLED, false)) {
        return text;
    }
    const formatter = new FormatterOne(text, {
        tabSpaces: tabSize,
        useLowerCase: config.get<boolean>(CONFIG_FORMATTER_USE_LOWER_CASE, false),
        useSpaceAfterCommas: config.get<boolean>(CONFIG_FORMATTER_USE_SPACE_AFTER_COMMAS, false),
        stripComments: stripComment ?? false
    });
    return formatter.formattedText;
};

class AssemblyDocumentFormatter implements vscode.DocumentFormattingEditProvider {
    constructor() {

    }
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        if (token.isCancellationRequested) {
            return undefined;
        }

        const config = vscode.workspace.getConfiguration(CONFIG_FORMATTER_PREFIX, document);
        const isFormatterEnabled = config.get<boolean>(CONFIG_FORMATTER_ENABLED, false);
        if (!isFormatterEnabled) {
            return undefined;
        }

        const text = document.getText();
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));

        const formatter = new FormatterOne(document.getText(), {
            tabSpaces: options.tabSize,
            useLowerCase: config.get<boolean>(CONFIG_FORMATTER_USE_LOWER_CASE, false),
            useSpaceAfterCommas: config.get<boolean>(CONFIG_FORMATTER_USE_SPACE_AFTER_COMMAS, false)
        });
        let formattedText = formatter.formattedText;

        if (options.insertSpaces) {
            formattedText = formattedText.replaceAll("\t", " ".repeat(options.tabSize));
        }

        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }
}

export const registerDocumentFormatter = (): vscode.Disposable => {
    return vscode.languages.registerDocumentFormattingEditProvider(
        LANGUAGE_ID, new AssemblyDocumentFormatter()
    );
};

