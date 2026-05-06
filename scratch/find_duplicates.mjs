import fs from 'fs';
const content = fs.readFileSync('../michelstravel1/client/src/locales/pt.json', 'utf8');
let pos = -1;
while ((pos = content.indexOf('"home":', pos + 1)) !== -1) {
    const line = content.substring(0, pos).split('\n').length;
    console.log('Found "home": at line:', line);
}
