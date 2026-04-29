const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove the misplaced imports
code = code.replace(/import \{ useState, useEffect \} from "react";\r?\n\/\/ O restante de seus imports mantidos.*\r?\n/g, '');

// 2. Add 'use client' and missing imports to the very top
const missingImports = `"use client";\nimport { useState, useEffect } from "react";\nimport { Check, Share2, User } from "lucide-react";\nimport { cn } from "@/lib/utils";\n`;
code = code.replace('import { Button }', missingImports + 'import { Button }');

// 3. Extract the ProductTour function block which is currently stranded inside the old LandingPage return
// It starts at `// --- Componente Local do Tour Interativo que inseriremos na página:`
// And ends at `export default function LandingPage() {`
const tourRegex = /\/\/ --- Componente Local do Tour Interativo que inseriremos na página:[\s\S]*?\}\r?\n\r?\nexport default function LandingPage\(\) \{\r?\n\/\/ O código principal da página vem logo após isso\.\.\.\r?\n/;
const match = code.match(tourRegex);

if (match) {
    let tourBlock = match[0];
    // Remove it from its current location
    code = code.replace(tourBlock, '\n      <ProductTour />\n\n');
    
    // tourBlock contains the `export default function LandingPage() {` at the end. We need to split it.
    tourBlock = tourBlock.replace(/export default function LandingPage\(\) \{\r?\n\/\/ O código principal da página vem logo após isso\.\.\.\r?\n/, '');
    
    // Insert tourBlock BEFORE the ORIGINAL `export default function LandingPage() {` at the top of the file
    code = code.replace('export default function LandingPage() {', tourBlock + '\nexport default function LandingPage() {');
}

fs.writeFileSync('src/app/page.tsx', code);
console.log("File fixed successfully");
