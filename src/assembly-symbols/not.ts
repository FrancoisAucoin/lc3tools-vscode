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

export const DOCS = `## NOT
### *Bit-Wise Complement*

**Assembler Format**

    NOT  DR,SR

**Encoding**

| [15...12] | [11...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: |
| 1001 | DR | SR | 111111 |

**Operation**
\`\`\`text
DR = ~SR;
setCC(DR);
\`\`\`

**Description**

Computes the bit-wise logical inversion (ones' complement) of the contents in source register **SR**, storing the resulting 16-bit value into destination register **DR**.

Updates the condition codes (N, Z, or P) based on whether the final computed value, interpreted as a two's complement integer, is negative, zero, or positive.

**Examples**
\`\`\`${LANGUAGE_ID}
    NOT R4,R2    ; Invert bits of R2 and store in R4
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 667`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:SR}`;