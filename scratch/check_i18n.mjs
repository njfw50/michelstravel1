import fs from 'fs';
import path from 'path';

const localesPath = 'c:/Users/njfw2/michelstravel1/client/src/locales/pt.json';
const srcPath = 'c:/Users/njfw2/michelstravel1/client/src';

const pt = JSON.parse(fs.readFileSync(localesPath, 'utf8'));

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const missingKeys = new Set();

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/t\(['"]([^'"]+)['"]/g);
            for (const match of matches) {
                const key = match[1];
                if (!getNestedValue(pt, key)) {
                    missingKeys.add(key);
                }
            }
        }
    }
}

walkDir(srcPath);

console.log('--- MISSING I18N KEYS ---');
Array.from(missingKeys).sort().forEach(key => console.log(key));
console.log('-------------------------');
