const fs = require('fs');
const content = fs.readFileSync('client/src/components/AdminCommandCenter.tsx', 'utf8');

let stack = [];
let lineNum = 1;
let inTag = false;
let currentTag = '';

for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  
  if (content[i] === '<' && content[i+1] !== ' ' && content[i+1] !== '!' && content[i+1] !== '=') {
    let j = i + 1;
    let isClosing = false;
    if (content[j] === '/') {
      isClosing = true;
      j++;
    }
    let tagName = '';
    while (j < content.length && /[a-zA-Z0-9]/.test(content[j])) {
      tagName += content[j];
      j++;
    }
    
    if (tagName) {
      // Check if self-closing
      let k = j;
      while (k < content.length && content[k] !== '>') k++;
      let isSelfClosing = content[k-1] === '/';
      
      if (!isSelfClosing) {
        if (isClosing) {
          const last = stack.pop();
          if (last.name !== tagName) {
            console.log(`Mismatch at line ${lineNum}: expected </${last.name}> (opened at line ${last.line}), found </${tagName}>`);
          }
        } else {
          stack.push({ name: tagName, line: lineNum });
        }
      }
    }
    i = j;
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags:');
  stack.forEach(t => console.log(`- <${t.name}> opened at line ${t.line}`));
} else {
  console.log('All tags balanced!');
}
