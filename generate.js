const fs = require('fs');
const path = require('path');

const rootDir = 'D:\\Coding\\CanvaSync';
const outputFile = path.join(rootDir, 'FILES.txt');
const srcDir = path.join(rootDir, 'apps/web/src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

let result = '';

function appendFile(filePath, displayPath) {
  if (fs.existsSync(filePath)) {
    result += displayPath + '\n';
    let content = fs.readFileSync(filePath, 'utf8');
    result += content;
    if (!content.endsWith('\n')) {
      result += '\n';
    }
    result += '\n';
  }
}

appendFile(path.join(rootDir, 'LLM.md'), 'LLM.md');

const srcFiles = getAllFiles(srcDir);
srcFiles.forEach(file => {
  const relativePath = file.substring(rootDir.length + 1).replace(/\\/g, '/');
  appendFile(file, relativePath);
});

fs.writeFileSync(outputFile, result);
console.log('done');
