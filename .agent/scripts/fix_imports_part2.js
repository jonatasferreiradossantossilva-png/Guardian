const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  const ignoreList = ['use-data.tsx', 'firestore-data-provider.tsx', 'use-mock-data.tsx', 'use-mock-data.ts'];
  if (ignoreList.some(ignore => filePath.includes(ignore))) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace occurrences that missed the previous regex due to type generics
  content = content.replace(/useMockCollection(<[^>]+>)?\(/g, 'useDataCollection$1(');
  content = content.replace(/useMockData(<[^>]+>)?\(/g, 'useData$1(');
  content = content.replace(/useMockDoc(<[^>]+>)?\(/g, 'useDataDoc$1(');
  content = content.replace(/useMockNestedDoc(<[^>]+>)?\(/g, 'useDataNestedDoc$1(');
  
  // Replace standalone occurrences that might have been missed (be careful not to break type imports, though we already replaced the imports)
  // Since we already changed the imports, any remaining `useMockCollection` in the code body is broken.
  // We can just replace the whole word if it's not preceded by 'import'.
  content = content.replace(/(?<!import\s*\{[^}]*)\buseMockCollection\b/g, 'useDataCollection');
  content = content.replace(/(?<!import\s*\{[^}]*)\buseMockData\b/g, 'useData');
  content = content.replace(/(?<!import\s*\{[^}]*)\buseMockDoc\b/g, 'useDataDoc');
  content = content.replace(/(?<!import\s*\{[^}]*)\buseMockNestedDoc\b/g, 'useDataNestedDoc');

  // Also fix the Lucide-React SteeringWheel error
  if (content.includes('SteeringWheel')) {
     content = content.replace(/SteeringWheel/g, 'CircleDashed');
  }

  if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      count++;
  }
});
console.log(`Total files updated: ${count}`);
