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

export const DOCS = `## LEA
### *Load Effective Address*

**Assembler Format**

    LEA  DR,LABEL

**Encoding**

| [15...12] | [11...9] | [8...0] |
| :---: | :---: | :---: |
| 1110 | DR | PCoffset9 |

**Operation**
\`\`\`text
DR = PC_incremented + SEXT(PCoffset9);
\`\`\`

**Description**

Calculates an absolute memory address by sign-extending the 9-bit relative offset (\`PCoffset9\`) and adding it to the incremented program counter, then stores that computed address directly into destination register **DR**.

* **No Memory Access:** Unlike \`LD\` or \`LDI\`, \`LEA\` does not perform a memory read or fetch data from RAM; it only stores the calculated target address itself into **DR**.

**Examples**
\`\`\`${LANGUAGE_ID}
    LEA R4,TARGET    ; Store the memory address of the TARGET label into R4
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 666`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:LABEL}`;