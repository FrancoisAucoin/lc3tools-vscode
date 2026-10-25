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

import { SymbolInfo } from "./common";

import { DOCS as ADD_DOCS, SNIPPET as ADD_SNIPPET } from "./add";
import { DOCS as AND_DOCS, SNIPPET as AND_SNIPPET } from "./and";
import { DOCS as BR_DOCS, SNIPPET as BR_SNIPPET } from "./br";
import { DOCS as JMP_DOCS, SNIPPET as JMP_SNIPPET } from "./jmp";
import { DOCS as JSR_DOCS, SNIPPET as JSR_SNIPPET } from "./jsr";
import { DOCS as LD_DOCS, SNIPPET as LD_SNIPPET } from "./ld";
import { DOCS as LDI_DOCS, SNIPPET as LDI_SNIPPET } from "./ldi";
import { DOCS as LDR_DOCS, SNIPPET as LDR_SNIPPET } from "./ldr";
import { DOCS as LEA_DOCS, SNIPPET as LEA_SNIPPET } from "./lea";
import { DOCS as NOT_DOCS, SNIPPET as NOT_SNIPPET } from "./not";
import { DOCS as RTI_DOCS } from "./rti";
import { DOCS as ST_DOCS, SNIPPET as ST_SNIPPET } from "./st";
import { DOCS as STI_DOCS, SNIPPET as STI_SNIPPET } from "./sti";
import { DOCS as STR_DOCS, SNIPPET as STR_SNIPPET } from "./str";
import { DOCS as TRAP_DOCS, SNIPPET as TRAP_SNIPPET, DOCS_TRAPS } from "./trap";

export const LC3_ISA_SYMBOLS: Readonly<{ [key: string]: SymbolInfo }> = {
    add: { name: { lowercase: "add", uppercase: "ADD" }, type: "opcode", markdownDocumentation: ADD_DOCS, snippetSuffix: ADD_SNIPPET },
    and: { name: { lowercase: "and", uppercase: "AND" }, type: "opcode", markdownDocumentation: AND_DOCS, snippetSuffix: AND_SNIPPET },
    br: { name: { lowercase: "br", uppercase: "BR" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brn: { name: { lowercase: "brn", uppercase: "BRn" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brz: { name: { lowercase: "brz", uppercase: "BRz" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brp: { name: { lowercase: "brp", uppercase: "BRp" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brzp: { name: { lowercase: "brzp", uppercase: "BRzp" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brnp: { name: { lowercase: "brnp", uppercase: "BRnp" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brnz: { name: { lowercase: "brnz", uppercase: "BRnz" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    brnzp: { name: { lowercase: "brnzp", uppercase: "BRnzp" }, type: "opcode", markdownDocumentation: BR_DOCS, snippetSuffix: BR_SNIPPET },
    jmp: { name: { lowercase: "jmp", uppercase: "JMP" }, type: "opcode", markdownDocumentation: JMP_DOCS, snippetSuffix: JMP_SNIPPET },
    ret: { name: { lowercase: "ret", uppercase: "RET" }, type: "opcode", markdownDocumentation: JMP_DOCS },
    jsr: { name: { lowercase: "jsr", uppercase: "JSR" }, type: "opcode", markdownDocumentation: JSR_DOCS, snippetSuffix: JSR_SNIPPET },
    jsrr: { name: { lowercase: "jsrr", uppercase: "JSRR" }, type: "opcode", markdownDocumentation: JSR_DOCS, snippetSuffix: JSR_SNIPPET },
    ld: { name: { lowercase: "ld", uppercase: "LD" }, type: "opcode", markdownDocumentation: LD_DOCS, snippetSuffix: LD_SNIPPET },
    ldi: { name: { lowercase: "ldi", uppercase: "LDI" }, type: "opcode", markdownDocumentation: LDI_DOCS, snippetSuffix: LDI_SNIPPET },
    ldr: { name: { lowercase: "ldr", uppercase: "LDR" }, type: "opcode", markdownDocumentation: LDR_DOCS, snippetSuffix: LDR_SNIPPET },
    lea: { name: { lowercase: "lea", uppercase: "LEA" }, type: "opcode", markdownDocumentation: LEA_DOCS, snippetSuffix: LEA_SNIPPET },
    not: { name: { lowercase: "not", uppercase: "NOT" }, type: "opcode", markdownDocumentation: NOT_DOCS, snippetSuffix: NOT_SNIPPET },
    rti: { name: { lowercase: "rti", uppercase: "RTI" }, type: "opcode", markdownDocumentation: RTI_DOCS },
    st: { name: { lowercase: "st", uppercase: "ST" }, type: "opcode", markdownDocumentation: ST_DOCS, snippetSuffix: ST_SNIPPET },
    sti: { name: { lowercase: "sti", uppercase: "STI" }, type: "opcode", markdownDocumentation: STI_DOCS, snippetSuffix: STI_SNIPPET },
    str: { name: { lowercase: "str", uppercase: "STR" }, type: "opcode", markdownDocumentation: STR_DOCS, snippetSuffix: STR_SNIPPET },
    trap: { name: { lowercase: "trap", uppercase: "TRAP" }, type: "opcode", markdownDocumentation: TRAP_DOCS, snippetSuffix: TRAP_SNIPPET },

    getc: { name: { lowercase: "getc", uppercase: "GETC" }, type: "trap", markdownDocumentation: DOCS_TRAPS.getc },
    out: { name: { lowercase: "out", uppercase: "OUT" }, type: "trap", markdownDocumentation: DOCS_TRAPS.out },
    puts: { name: { lowercase: "puts", uppercase: "PUTS" }, type: "trap", markdownDocumentation: DOCS_TRAPS.puts },
    in: { name: { lowercase: "in", uppercase: "IN" }, type: "trap", markdownDocumentation: DOCS_TRAPS.in },
    putsp: { name: { lowercase: "putsp", uppercase: "PUTSP" }, type: "trap", markdownDocumentation: DOCS_TRAPS.putsp },
    halt: { name: { lowercase: "halt", uppercase: "HALT" }, type: "trap", markdownDocumentation: DOCS_TRAPS.halt },

    r0: { name: { lowercase: "r0", uppercase: "R0" }, type: "register", markdownDocumentation: "### GPR 0\nGeneral-purpose register **#0**" },
    r1: { name: { lowercase: "r1", uppercase: "R1" }, type: "register", markdownDocumentation: "### GPR 1\nGeneral-purpose register **#1**" },
    r2: { name: { lowercase: "r2", uppercase: "R2" }, type: "register", markdownDocumentation: "### GPR 2\nGeneral-purpose register **#2**" },
    r3: { name: { lowercase: "r3", uppercase: "R3" }, type: "register", markdownDocumentation: "### GPR 3\nGeneral-purpose register **#3**" },
    r4: { name: { lowercase: "r4", uppercase: "R4" }, type: "register", markdownDocumentation: "### GPR 4\nGeneral-purpose register **#4**" },
    r5: { name: { lowercase: "r5", uppercase: "R5" }, type: "register", markdownDocumentation: "### GPR 5\nGeneral-purpose register **#5**" },
    r6: { name: { lowercase: "r6", uppercase: "R6" }, type: "register", markdownDocumentation: "### GPR 6\nGeneral-purpose register **#6**" },
    r7: { name: { lowercase: "r7", uppercase: "R7" }, type: "register", markdownDocumentation: "### GPR 7\nGeneral-purpose register **#7**" },

    // page 236
    ".orig": { name: { lowercase: ".orig", uppercase: ".ORIG" }, type: "pseudo-opcode", markdownDocumentation: "## .ORIG\nDirects the assembler to set the starting memory address for the subsequent block of machine code." },
    ".blkw": { name: { lowercase: ".blkw", uppercase: ".BLKW" }, type: "pseudo-opcode", markdownDocumentation: "## .BLKW\nReserves a specified number of consecutive memory words for data storage." },
    ".end": { name: { lowercase: ".end", uppercase: ".END" }, type: "pseudo-opcode", markdownDocumentation: "## .END\nSignals the physical end of the source file to the assembler, marking where code translation stops." },
    ".fill": { name: { lowercase: ".fill", uppercase: ".FILL" }, type: "pseudo-opcode", markdownDocumentation: "## .FILL\nAllocates a single memory location and populates it with a specified initial value." },
    ".stringz": { name: { lowercase: ".stringz", uppercase: ".STRINGZ" }, type: "pseudo-opcode", markdownDocumentation: "## .STRINGZ\nAllocates and initializes a sequence of consecutive memory locations with a null-terminated ASCII character string." },
};
