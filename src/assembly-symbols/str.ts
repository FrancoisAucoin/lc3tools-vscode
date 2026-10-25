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

export const DOCS = `## STR
### *Store Base+offset*

**Assembler Format**

    STR  SR,BaseR,offset6

**Encoding**

| [15...12] | [11...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: |
| 0111 | SR | BaseR | offset6 |

**Operation**
\`\`\`text
if (isAddressPrivileged(BaseR + SEXT(offset6)) && PSR[15] == 1) {
    initiateACVException();
} else {
    mem[BaseR + SEXT(offset6)] = SR;
}
\`\`\`

**Description**

Computes a destination memory address by sign-extending the 6-bit relative offset (\`offset6\`) and adding it to the contents of the specified base register (**BaseR**).

* **Access Control:** Triggers an Access Control Violation (ACV) exception if the calculated address points to protected supervisor memory while the processor is operating in user mode (\`PSR[15] == 1\`).
* **Store Operation:** Otherwise, writes the contents of source register **SR** into the specified memory location.

**Examples**
\`\`\`${LANGUAGE_ID}
    STR R4,R2,#5    ; Store contents of R4 into memory at R2 base plus offset
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 672`)}

`;

export const SNIPPET: string = `\t\${1:SR},\${2:BaseR},\${3:offset6}`;