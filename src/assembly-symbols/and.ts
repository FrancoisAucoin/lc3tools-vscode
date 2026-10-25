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

export const DOCS = `## AND
### *Bit-wise Logical AND*

**Assembler Formats**

    AND  DR,SR1,SR2
    AND  DR,SR1,imm5

**Encodings**

| [15...12] | [11...9] | [8...6] | [5] | [4...3] | [2...0] |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0101 | DR | SR1 | 0 | 00 | SR2 |

| [15...12] | [11...9] | [8...6] | [5] | [4...0] |
| :---: | :---: | :---: | :---: | :---: | 
| 0101 | DR | SR1 | 1 | imm5 |

**Operation**
\`\`\`text
if (bit[5] == 0) {
    DR = SR1 & SR2;
} else {
    DR = SR1 & SEXT(imm5);
}
setCC(DR);
\`\`\`

**Description**

Performs a bit-wise logical AND operation between the contents of **SR1** and a second operand, storing the result in **DR**.

* **Register Mode (\`bit[5] == 0\`):** Combines **SR1** and **SR2**.
* **Immediate Mode (\`bit[5] == 1\`):** Combines **SR1** with the sign-extended 5-bit constant (**imm5**).

Updates the condition codes (N, Z, or P) based on whether the resulting 16-bit value, interpreted as a two's complement integer, is negative, zero, or positive.

**Examples**
\`\`\`${LANGUAGE_ID}
    AND R2,R3,R4    ; R2 <- R3 AND R4
    AND R2,R3,#7    ; R2 <- R3 AND 7
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 659`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:SR1},\${3:SR2|imm5}`;