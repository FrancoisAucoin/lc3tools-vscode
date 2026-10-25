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

// NOTE ABOUT THIS FILE
// I didn't really have a plan when I started writing this file: I added stuff
// as I went until I got something that worked for my "still-evolving" use case.
// Some method names are misnomers, and some of them are not functioning as one
// would believe. A lot of the TODO comments are no longer relevant. A lot of
// assumptions are made...

import * as vscode from "vscode";
import { AssemblyDocumentAnalysisDataSource } from "./interfaces";
import { splitLineAtComment } from "./util";
import { LANGUAGE_ID } from "./constants";

const OPCODES: string[] = [
    "add",
    "and",
    "br",
    "brn",
    "brz",
    "brp",
    "brzp",
    "brnp",
    "brnz",
    "brnzp",
    "jmp",
    "ret",
    "jsr",
    "jsrr",
    "ld",
    "ldi",
    "ldr",
    "lea",
    "not",
    "rti",
    "st",
    "sti",
    "str",
    "trap",
    "getc",
    "out",
    "puts",
    "in",
    "putsp",
    "halt",
    ".orig",
    ".blkw",
    ".end",
    ".fill",
    ".stringz"
];

const PARAMETERLESS_OPCODES: string[] = [
    ".end",
    "getc",
    "out",
    "puts",
    "in",
    "putsp",
    "halt",
    "ret",
    "rti",
    ".stringz" // NOTE: This is because we remove the string literal (operand) before handling
];

const REGISTERS: string[] = ["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7"];

export enum LineType {
    opcode = "opcode",
    labeled = "labeled",
    comment = "comment",
    other = "other",
    invalidOpcode = "invalidOpcode",
}

export enum ValueType {
    decimal = "decimal",
    hexadecimal = "hexadecimal",
    binary = "binary",
    invalid = "invalid",
}

export class Value {
    private _valueType!: ValueType;
    private _value!: number;
    constructor(
        readonly textValue: string,
    ) {
        this.parse();
    }
    get isValid(): boolean {
        return this.valueType !== ValueType.invalid;
    }
    get valueType(): ValueType {
        return this._valueType;
    }
    get value(): number {
        return this._value;
    }
    get valueSigned(): number {
        const array = new Int16Array(1);
        array[0] = this.value; // This will handle the overflow. I think it's fine given that the validator will fail for an invalid number.
        return array[0];
    }
    get valueUnsigned(): number {
        const array = new Uint16Array(1);
        array[0] = this.value;
        return array[0];
    }
    format(type: ValueType, usePadding: boolean = true): string {
        // TODO
        // This currently does not handle "negative" values and does
        // not enforce 16-bit values (and does not allow smaller-bit
        // values such as imm5, imm9, etc.). Does not handle sign-extended
        // values neither, etc.

        // This block should be replaced by `const value = this.valueUnsigned;`
        const array = new Uint16Array(1);
        array[0] = this.value; // This will handle the overflow. I think it's fine given that the validator will fail for an invalid number.
        const value = array[0];

        switch (type) {
            case ValueType.decimal: // unsigned
                return `#${value}`;
            case ValueType.hexadecimal: {
                let s = value.toString(16);
                if (usePadding) {
                    s = s.padStart(4, "0");
                }
                return `x${s}`;
            }
            case ValueType.binary: {
                let s = value.toString(2);
                if (usePadding) {
                    s = s.padStart(16, "0");
                }
                return `b${s}`;
            }
            default:
                return this.textValue;
        }
    }
    private parse(): void {
        // TODO: This is problematic because a valid token
        // starting with b or x could be intercepted here.
        const text = this.textValue.toLowerCase();
        if (text.startsWith("#")) {
            this._value = Number.parseInt(text.substring(1), 10);
            this._valueType = Number.isNaN(this._value) ? ValueType.invalid : ValueType.decimal;
        } else if (text.startsWith("b")) {
            this._value = Number.parseInt(text.substring(1), 2);
            this._valueType = Number.isNaN(this._value) ? ValueType.invalid : ValueType.binary;
        } else if (text.startsWith("x")) {
            this._value = Number.parseInt(text.substring(1), 16);
            this._valueType = Number.isNaN(this._value) ? ValueType.invalid : ValueType.hexadecimal;
        } else {
            this._value = Number.parseInt(text, 10);
            this._valueType = Number.isNaN(this._value) ? ValueType.invalid : ValueType.decimal;
        }
    }
}

export abstract class BaseText {
    protected _isValid!: boolean;
    constructor(readonly text: string) {
        this.parse();
    }
    get isValid(): boolean {
        return this._isValid;
    }
    protected abstract parse(): void;
    /**
     * Generates a formatted version of the internal text value.
     * 
     * @remark If {@link isValid} is `false`, no formatting occurs.
     * 
     * @param lowercased Whether to lowercase (`true`), uppercase (`false`), or do 
     * nothing (`undefined`).
     * @returns A string containing the formatted text value.
     */
    format(lowercased?: boolean): string {
        if (!this.isValid || lowercased === undefined) {
            return this.text;
        }
        return lowercased ? this.text.toLowerCase() : this.text.toUpperCase();
    }
}

export class Register extends BaseText {
    protected parse(): void {
        const text = this.text.toLowerCase();
        this._isValid = REGISTERS.includes(text);
    }
}

export class Label extends BaseText {
    protected parse(): void {
        const text = this.text.toLowerCase();
        if (
            OPCODES.includes(text) ||
            REGISTERS.includes(text) ||
            !/\w/.test(text)
            // (new Value(text)).isValid
        ) {
            this._isValid = false;
        } else {
            this._isValid = true;
        }
    }
}

export class Opcode extends BaseText {
    protected parse(): void {
        const text = this.text.toLowerCase();
        this._isValid = OPCODES.includes(text);
    }
    format(lowercased?: boolean): string {
        if (!this.isValid) {
            return this.text;
        }
        const out = super.format(lowercased);
        if (!this.text.startsWith("br")) {
            return out;
        }
        return out.substring(0, 2) + this.text.substring(2);
    }
}

export enum OperandType {
    register = "register",
    value = "value",
    label = "label",
    invalid = "invalid",
}

export class Operand {
    private _register?: Register;
    private _value?: Value;
    private _label?: Label;
    get operandType(): OperandType {
        if (this._register) {
            return OperandType.register;
        }
        if (this._value) {
            return OperandType.value;
        }
        if (this._label) {
            return OperandType.label;
        }
        return OperandType.invalid;
    }
    get isValid(): boolean {
        return this.operandType !== OperandType.invalid;
    }
    constructor(readonly text: string) {
        this.parse();
    }
    format(lowercased?: boolean): string {
        if (this._register) {
            return this._register.format(lowercased);
        }
        if (this._value) {
            // return this._value.format(ValueType.hexadecimal, true);
            // TODO: what's better here?
            return this.text;
        }
        if (this._label) {
            return this._label.format(lowercased);
        }
        return this.text;
    }
    private parse(): void {
        {
            const register = new Register(this.text);
            if (register.isValid) {
                this._register = register;
                return;
            }
        }
        {
            const value = new Value(this.text);
            if (value.isValid) {
                this._value = value;
                return;
            }
        }
        {
            const label = new Label(this.text);
            if (label.isValid) {
                this._label = label;
                return;
            }
        }
    }
}

export class Line {
    private _lineType!: LineType;
    private _opcode?: string;
    private _operands?: string[];
    private _stringLiteral?: string;
    private _label?: string;
    constructor(readonly text: string) {
        this.parse();
        this.validate();
    }
    get isValid(): boolean {
        return this.lineType !== LineType.invalidOpcode && this.lineType !== LineType.other;
    }
    get lineType(): LineType {
        return this._lineType;
    }
    get label(): string | undefined {
        return this._label;
    }
    get comment(): string | undefined {
        return this.commentInfo?.text;
    }
    get commentInfo(): { text: string, startIndex: number } | undefined {
        let startIndex: number = 0;
        if (this._stringLiteral) {
            // Since a string literal could technically contain ";" characters, we
            // only want to start searching passed the string literal, to avoid that.
            const i = this.text.indexOf(this._stringLiteral);
            startIndex = i + this._stringLiteral.length;
        }
        const index = this.text.indexOf(`;`, startIndex);
        if (index === -1) {
            return undefined;
        }
        const text = this.text.substring(index + 1).trimEnd();
        return { text, startIndex: index + 1 };
    }
    get opcode(): string | undefined {
        return this._opcode;
    }
    get stringLiteral(): string | undefined {
        return this._stringLiteral;
    }
    get operands(): string[] | undefined {
        if (this._operands === undefined || this._operands.length === 0) {
            return undefined;
        }
        return [...this._operands];
    }
    private validate(): void {
        if (this.lineType === LineType.opcode) {
            if (!OPCODES.includes(this.opcode!)) {
                this._lineType = LineType.invalidOpcode;
            }
        }
    }
    private parse(): void {
        if (!this.text.trim()) {
            // TODO: Should we have an "empty" line type?
            this._lineType = LineType.other;
            return;
        }

        {
            const trimmed = this.text.trim();

            if (trimmed.indexOf(";") === 0) {
                this._lineType = LineType.comment;
                return;
            }
        }

        const { text: textWithoutComment } = splitLineAtComment(this.text);

        let textWithoutCommentAndStringLiteral = textWithoutComment;
        {
            const index = textWithoutComment.indexOf("\"");
            if (index !== -1) {
                textWithoutCommentAndStringLiteral = textWithoutComment.substring(0, index);
                this._stringLiteral = textWithoutComment.substring(index);
            }
        }

        const tokens = textWithoutCommentAndStringLiteral
            .split(/\s/i)
            .filter(text => text.length > 0)
            .map(text => text.toLowerCase());

        const token_list: string[] = [];
        {
            let carry: boolean = false;
            for (const token of tokens) {
                if (token_list.length === 0) {
                    token_list.push(token);
                } else {
                    const i = token_list.length - 1;
                    if (carry) {
                        token_list[i] += token;
                        carry = token.endsWith(",");
                    } else if (token.endsWith(",")) {
                        carry = true;
                        token_list.push(token);
                    } else {
                        token_list.push(token);
                    }
                }
            }
        }

        if (
            token_list.length === 1 &&
            PARAMETERLESS_OPCODES.includes(token_list[0]!)
        ) {
            this._lineType = LineType.opcode;
            this._opcode = token_list[0];
            return;
        }

        if (
            token_list.length === 2 &&
            PARAMETERLESS_OPCODES.includes(token_list[1]!)
        ) {
            this._lineType = LineType.labeled;
            this._label = token_list[0];
            this._opcode = token_list[1];
            return;
        }


        if (token_list.length < 2 || token_list.length > 3) {
            this._lineType = LineType.other;
            return;
        }

        let indexOpcode: number = 0;
        let indexOperands: number = 1;
        this._lineType = LineType.opcode;

        if (token_list.length === 3) {
            this._lineType = LineType.labeled;
            this._label = token_list[0];
            indexOpcode += 1;
            indexOperands += 1;
        }

        this._opcode = token_list[indexOpcode];
        this._operands = token_list[indexOperands]!
            .split(",")
            .filter(op => op.length > 0);
    }

    get summary(): string {
        let out = `LINE: ${this.text}\n`;
        out += `\tType: ${this.lineType}\n`;
        out += `\tLabel: ${this.label ?? "-"}\n`;
        out += `\tOpcode: ${this.opcode ?? "-"}\n`;
        out += `\tOperands: ${(this.operands ?? []).join(",")}\n`;
        out += `\tString literal: ${this._stringLiteral ?? "-"}\n`;
        out += `\tComment: ${this.comment ?? "-"}\n`;
        if (this.isValid) {
            out += `\tFORMATTED:\n${this.format(false)}\n`;
        }
        out += `\n`;
        return out;
    }

    format(lowercased?: boolean): string {
        if (!this.isValid) {
            return this.text;
        }
        let out = ``;
        if (this._label) {
            const label = new Label(this._label);
            if (!label.isValid) {
                return this.text;
            }
            out = `${label.format(lowercased)}`;
        }
        if (this._opcode) {
            const opcode = new Opcode(this._opcode);
            if (!opcode.isValid) {
                return this.text;
            }
            const formatted = opcode.format(lowercased);
            out = out ? `${out}    ${formatted}` : formatted;
        }
        if (this._operands) {
            const operands = this._operands.map(o => new Operand(o));
            if (!operands.every(o => o.isValid)) {
                return this.text;
            }
            const formatted = operands.map(o => o.format()).join(",");
            out = out ? `${out}    ${formatted}` : formatted;
        }
        if (this._stringLiteral) {
            out = out ? `${out}    ${this._stringLiteral}` : this._stringLiteral;
        }
        if (this.comment !== undefined) {
            // TODO: here we want alignment
            out = out ? `${out} ; ${this.comment}` : `${this.text}`;
        }
        return out;
    }

    static parseLines(text: string): Line[] {
        return text.split("\n").map(line => new Line(line));
    }
}

export type LabelInfo = { text: string, range: vscode.Range, markdownDocumentation?: vscode.MarkdownString };
class LabelInformation {
    constructor(
        readonly line: Line,
        readonly text: string,
        readonly range: vscode.Range
    ) { }
    private get markdown(): vscode.MarkdownString | undefined {
        const s = new vscode.MarkdownString();
        s.appendCodeblock(this.line.format(false), LANGUAGE_ID);
        return s;
    }
    toInfo(): LabelInfo {
        return {
            text: this.text,
            range: this.range,
            markdownDocumentation: this.markdown
        };
    }
}

export type CommentInfo = { text: string, range: vscode.Range };

export class AssemblyAnalyzerItem {
    private _lines!: Line[];
    private _labelInfoList!: LabelInformation[];
    private _commentInfoList!: CommentInfo[];
    constructor(readonly text: string) {
        this.parse();
    }
    private parse(): void {
        this._lines = Line.parseLines(this.text);
        {
            const out: LabelInformation[] = [];
            this._lines.forEach((line, index) => {
                if (line.isValid && line.lineType === LineType.labeled) {
                    const label = line.label;
                    if (label) {
                        const labelIndex = line.text.toLowerCase().indexOf(label.toLowerCase());
                        if (labelIndex !== -1) {
                            const start = new vscode.Position(index, labelIndex);
                            const end = new vscode.Position(index, labelIndex + label.length);
                            const range = new vscode.Range(start, end);
                            out.push(new LabelInformation(line, label, range));
                        }
                    }
                }
            });
            this._labelInfoList = out;
        }
        {
            const out: CommentInfo[] = [];
            this._lines.forEach((line, index) => {
                if (!line.isValid) {
                    return;
                }
                const commentInfo = line.commentInfo;
                if (!commentInfo) {
                    return;
                }
                const { text, startIndex } = commentInfo;
                const start = new vscode.Position(index, startIndex);
                const end = new vscode.Position(index, startIndex + text.length);
                const range = new vscode.Range(start, end);
                out.push({ text, range });
            });
            this._commentInfoList = out;
        }
    }
    get labels(): LabelInfo[] {
        return this._labelInfoList.map(info => info.toInfo());
    }
    get comments(): CommentInfo[] {
        return this._commentInfoList.map(info => ({ ...info }));
    }
    getReferencesForLabel(text: string): vscode.Range[] {
        if (this._labelInfoList.length === 0) {
            return [];
        }
        const out: vscode.Range[] = [];
        this._lines.forEach((line, index) => {
            if (!line.isValid || line.lineType !== LineType.opcode) {
                return;
            }
            const operands = (line.operands ?? []).map(text => new Operand(text));
            if (operands.length === 0) {
                return;
            }
            const labelRef = operands.find(o => o.isValid && o.operandType === OperandType.label);
            if (!labelRef) {
                return;
            }
            if (labelRef.text.toLowerCase() !== text.toLowerCase()) {
                return;
            }
            const labelIndex = line.text.toLowerCase().indexOf(labelRef.text);
            if (labelIndex === -1) {
                return;
            }
            const start = new vscode.Position(index, labelIndex);
            const end = new vscode.Position(index, labelIndex + labelRef.text.length);
            out.push(new vscode.Range(start, end));
        });
        return out;
    }
}

export class AssemblyAnalyzer implements AssemblyDocumentAnalysisDataSource {
    private items: Map<vscode.Uri, AssemblyAnalyzerItem> = new Map();
    constructor(private context: vscode.ExtensionContext) {
        this.registerListeners();
        this.processOpenDocuments();
    }
    private processOpenDocuments(): void {
        vscode.workspace.textDocuments.forEach(document => {
            if (document.languageId === LANGUAGE_ID) {
                this.processDocument(document);
            }
        });
    }
    private registerListeners(): void {
        this.context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(document => {
                if (document.languageId === LANGUAGE_ID) {
                    this.processDocument(document);
                }
            })
        );
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.languageId === LANGUAGE_ID) {
                    this.processDocument(event.document);
                }
            })
        );
        this.context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(document => {
                if (document.languageId === LANGUAGE_ID) {
                    this.forgetDocument(document);
                }
            })
        );
    }
    private processDocument(document: vscode.TextDocument): void {
        this.items.set(document.uri, new AssemblyAnalyzerItem(document.getText()));
    }
    private forgetDocument(document: vscode.TextDocument): void {
        this.items.delete(document.uri);
    }
    clear(): void {
        this.items.clear();
    }
    getLabelDefinition(document: vscode.TextDocument, labelText: string): vscode.Range | undefined {
        const item = this.items.get(document.uri);
        if (!item) {
            return undefined;
        }
        const label = item.labels.find(label => label.text.toLowerCase() === labelText.toLowerCase());
        if (!label) {
            return undefined;
        }
        return label.range;
    }
    getLabelReferences(document: vscode.TextDocument, labelText: string): vscode.Range[] {
        const item = this.items.get(document.uri);
        return item?.getReferencesForLabel(labelText) ?? [];
    }
    getLabelInfo(document: vscode.TextDocument, labelText: string): vscode.MarkdownString | undefined {
        const item = this.items.get(document.uri);
        if (!item) {
            return undefined;
        }
        const label = item.labels.find(label => label.text.toLowerCase() === labelText.toLowerCase());
        return label?.markdownDocumentation;
    }
    isSymbolInsideComment(document: vscode.TextDocument, range: vscode.Range): boolean {
        const item = this.items.get(document.uri);
        if (!item) {
            return false;
        }
        return !item.comments.every(info => !info.range.contains(range));
    }
    getLabels(document: vscode.TextDocument): { text: string, range: vscode.Range, markdown?: vscode.MarkdownString }[] {
        const item = this.items.get(document.uri);
        return item?.labels.map(l => {
            return { text: l.text, range: l.range, markdown: l.markdownDocumentation };
        }) ?? [];
    }
}