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

const BOOK_REFERENCE: string = `Introduction to computing systems: from bits & gates to C/C++ & beyond (3rd edition; 2019). Yale N. Patt & Sanjay J. Patel`;
const LINK: string = `https://www.mheducation.ca/product/ise-introduction-to-computing-systems-from-bits-gates-to-c-c-beyond-9781260565911-can`;

export const buildMarkdownLink = (pageInfo: string): string => {
    return `[${pageInfo} — ${BOOK_REFERENCE}](${LINK})`;
};

export interface SymbolInfo {
    name: {
        lowercase: string;
        uppercase: string;
    };
    markdownDocumentation: string;
    type: "opcode" | "trap" | "pseudo-opcode" | "label" | "number" | "register";
    snippetSuffix?: string;
};
