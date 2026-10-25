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

import { buildMarkdownLink } from "./common";
import { LANGUAGE_ID } from "../constants";

export const DOCS = `## TRAP
### *System Call*

**Assembler Format**

    TRAP  trapvector8

**Encoding**

| [15...12] | [11...8] | [7...0] |
| :---: | :---: | :---: |
| 1111 | 0000 | trapvect8 |

**Operation
\`\`\`text
TEMP = PSR;
if (PSR[15] == 1) {
    savedUSP = R6;
    R6 = savedSSP;
    PSR[15] = 0;
}
push(TEMP);
push(PC_incremented);
PC = mem[ZEXT(trapvect8)];
\`\`\`

**Description**

Initiates a system service call by saving the current execution state and jumping to the designated trap vector handler:

* **Privilege & Stack Switch:** If running in User mode (\`PSR[15] == 1\`), the user stack pointer is saved, the system stack pointer is loaded, and the processor switches to supervisor mode.
* **Context Preservation:** Pushes the current processor status register (\`PSR\`) and the incremented program counter (\`PC\`) onto the system stack to ensure clean return flow via \`RTI\`.
* **Vector Dispatch:** Loads the \`PC\` with the service routine starting address fetched from the Trap Vector Table via the zero-extended 8-bit vector (\`trapvect8\`).

**Note**

The Trap Vector Table occupies memory locations \`x0000\` through \`x00FF\` (256 entries total), storing starting pointers for operating system routines. Table A.3 of Patt & Patel's book outlines standard service behaviors for vectors \`x20\` through \`x25\`.

**Examples**
\`\`\`${LANGUAGE_ID}
    TRAP  x23    ; Invoke IN service routine (address fetched from x0023)
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 673`)}

`;

export const SNIPPET: string = `\t\${1:trapvect8}`;

export const DOCS_TRAPS = {
    getc: `## GETC\n TRAP x20\n\nReads a single character from the input device without echoing it to the console, placing its ASCII value into register **R0** (with the upper eight bits cleared).`,
    out: `## OUT\n TRAP x21\n\nWrites the character contained in the lower byte of **R0** (\`R0[7:0]\`) directly to the console display.`,
    puts: `## PUTS\n TRAP x22\n\nOutputs a null-terminated ASCII string to the console display, reading one character per memory address starting from the pointer address stored in **R0** until encountering a \`x0000\` sentinel value.`,
    in: `## IN\n TRAP x23\n\nPrompts the user, reads an input character from the keyboard with console echoing, and stores its ASCII code into register **R0** (clearing the upper eight bits).`,
    putsp: `## PUTSP\n TRAP x24\n\nOutputs a packed ASCII character string to the console, reading two characters per memory address starting from the pointer in **R0** (lower byte \`[7:0]\` prints first, followed by upper byte \`[15:8]\`). Processing terminates upon reaching a \`x0000\` word (or \`x00\` in the upper byte).`,
    halt: `## HALT\n TRAP x25\n\nTerminates processor instruction execution and outputs a status notification to the console console.`
};