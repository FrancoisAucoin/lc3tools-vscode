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

export const DOCS = `## BR
### *Conditional Branch*

**Assembler Formats**

    BRn  LABEL      BRzp   LABEL
    BRz  LABEL      BRnp   LABEL
    BRp  LABEL      BRnz   LABEL
    BR   LABEL      BRnzp  LABEL

NOTE: The base mnemonic \`BR\` is treated as an alias for \`BRnzp\`, resulting in an unconditional branch to the target address.

**Encoding**

| [15...12] | [11] | [10] | [9] | [8...0] |
| :---: | :---: | :---: | :---: | :---: | 
| 0000 | n | z | p | PCoffset9 |

**Operation**
\`\`\`text
if ((n && N) || (z && Z) || (p && P)) {
    PC = PC_incremented + SEXT(PCoffset9);
}
\`\`\`

**Description**

Evaluates the CPU condition flags (N, Z, P) against the branch condition bits (\`n\`, \`z\`, \`p\` encoded in bits \`[11:9]\`):

* **Flag Selection:** Bit \`[11]\` corresponds to negative (\`n\`), bit \`[10]\` to zero (\`z\`), and bit \`[9]\` to positive (\`p\`).
* **Branch Action:** If any active condition bit matches the current state of the corresponding CPU flag, the program counter updates by adding the sign-extended 9-bit offset to the incremented PC.

**Examples**
\`\`\`${LANGUAGE_ID}
    BRzp  LOOP    ; Jump to LOOP if previous result was non-negative.
    BR    NEXT    ; Jump directly to NEXT without checking flags.
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 660`)}

`;

export const SNIPPET: string = `\t\${1:LABEL}`;