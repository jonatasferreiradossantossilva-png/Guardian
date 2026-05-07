const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const mappings = {
  useMockData: 'useData',
  useMockCollection: 'useDataCollection',
  useMockDoc: 'useDataDoc',
  useMockNestedDoc: 'useDataNestedDoc'
};

let count = 0;
walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  const ignoreList = ['use-data.tsx', 'firestore-data-provider.tsx', 'use-mock-data.tsx', 'use-mock-data.ts'];
  if (ignoreList.some(ignore => filePath.includes(ignore))) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes('@/hooks/use-mock-data')) {
    // 1. Replace the import path and the exported function names within that import
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]@\/hooks\/use-mock-data['"]/g, (match, importsStr) => {
        let imports = importsStr.split(',').map(s => s.trim());
        let newImports = imports.map(imp => mappings[imp] || imp); // map to new names
        
        // If there are types imported like MockDB, we need to separate them
        // Actually, looking at standard TS, types shouldn't be mapped.
        // If all imports map to use-data, we can just change the path
        return `import { ${newImports.join(', ')} } from '@/hooks/use-data'`;
    });

    // 2. Replace function calls in the body
    content = content.replace(/useMockData\(/g, 'useData(');
    content = content.replace(/useMockCollection\(/g, 'useDataCollection(');
    content = content.replace(/useMockDoc\(/g, 'useDataDoc(');
    content = content.replace(/useMockNestedDoc\(/g, 'useDataNestedDoc(');
    
    // Sometimes it's used without call (e.g. `(useMockData as any)`)
    content = content.replace(/useMockData as/g, 'useData as');
    content = content.replace(/useMockCollection as/g, 'useDataCollection as');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
        count++;
    }
  }
});
console.log(`Total files updated: ${count}`);
