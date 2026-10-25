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

export const filterOutTerminalColoringCodes = (text: string): string => {
    // These are the possible codes, as visible in `console_print.cpp` (LC-3 Tools source code).
    return text
        .replaceAll("\x1b[31m", "")
        .replaceAll("\x1b[33m", "")
        .replaceAll("\x1b[32m", "")
        .replaceAll("\x1b[35m", "")
        .replaceAll("\x1b[34m", "")
        .replaceAll("\x1b[31;1m\x1b[30m", "")
        .replaceAll("\x1b[1m", "")
        .replaceAll("\x1b[0m", "");
};

export const splitLineAtComment = (line: string): { text: string, comment: string | undefined, commentIndex: number | undefined } => {
    if (!line || !line.trim()) {
        throw new Error("not expecting an empty string");
    }
    if (line.trim().startsWith(";")) {
        throw new Error("not expecting a comment-only string");
    }
    let isInsideStringLiteral: boolean = false;
    let wasPreviousCharBackslash: boolean = false;
    let text: string = "";
    let comment: string | undefined = undefined;
    let index: number = -1;
    for (const character of line) {
        index += 1;
        if (isInsideStringLiteral) {
            text += character;
            if (character === `"` && !wasPreviousCharBackslash) {
                isInsideStringLiteral = false;
            }
        } else {
            if (character === ";") {
                comment = line.substring(index);
                break;
            }
            text += character;
            if (character === `"` && !wasPreviousCharBackslash) {
                isInsideStringLiteral = true;
            }
        }
        wasPreviousCharBackslash = character === "\\";
    }
    return {
        text,
        comment,
        commentIndex: comment ? index : undefined
    };
};

export const countTrailingOccurrencesOfCharacter = (text: string, character: string): number => {
    const code = character.charCodeAt(0);
    let count: number = 0;
    for (const e of [...text].reverse()) {
        if (code !== e.charCodeAt(0)) {
            break;
        }
        count += 1;
    }
    return count;
};
