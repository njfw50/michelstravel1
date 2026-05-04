
import fs from 'fs';

const content = fs.readFileSync('../michelstravel1/client/src/components/MobileConfigurator.tsx', 'utf8');
let open = 0;
const lines = content.split('\n');

lines.forEach((line, i) => {
  const lineOpen = (line.match(/{/g) || []).length;
  const lineClose = (line.match(/}/g) || []).length;
  open += lineOpen;
  open -= lineClose;
  if (open < 0) {
    console.log(`❌ EXTRA CLOSING BRACE AT LINE ${i + 1}: "${line.trim()}" (Balance: ${open})`);
    open = 0; // Reset to find more
  }
});

if (open > 0) {
  console.log(`❌ MISSING ${open} CLOSING BRACES AT THE END OF FILE`);
}
