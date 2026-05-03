import { execSync } from 'child_process';

console.log('\n⚖️  INITIALIZING CANONICAL AUDIT (LAW ENFORCER)...');
console.log('🛡️  VERIFYING COMPLIANCE WITH CANON XIX: INTEGRITY OF REFERENCES');

function run(command, label) {
  try {
    console.log(`\n[AUDIT] ${label}...`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n[FAILED] ${label} failed.`);
    return false;
  }
}

const steps = [
  { cmd: 'npm run check', label: 'Types and Imports Integrity' },
  { cmd: 'npm run build', label: 'Production Build Simulation' }
];

let allPassed = true;
for (const step of steps) {
  if (!run(step.cmd, step.label)) {
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n✅ AUDIT COMPLETED: Code sealed with operational integrity.\n');
  process.exit(0);
} else {
  console.error('\n❌ VIOLATION OF CANON 14: Code is not stable enough for deployment.\n');
  process.exit(1);
}
