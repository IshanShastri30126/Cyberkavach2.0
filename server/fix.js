const fs = require('fs');
let content = fs.readFileSync('c:/cyberkavach2.0/server/src/routes/certificates.ts', 'utf-8');
let lines = content.split('\n');
for (let i = 424; i < lines.length; i++) {
  lines[i] = lines[i].replace(/\\\$\{/g, '${');
  lines[i] = lines[i].replace(/\\\`/g, '`');
}
fs.writeFileSync('c:/cyberkavach2.0/server/src/routes/certificates.ts', lines.join('\n'));
console.log("Done");
