import { execSync } from 'child_process';

console.log('\n⚖️  INICIANDO AUDITORIA CANÔNICA (LAW ENFORCER)...');
console.log('🛡️  VERIFICANDO CONFORMIDADE COM A LEI XIX: INTEGRIDADE DE REFERÊNCIAS');

function run(command, label) {
  try {
    console.log(`\n[AUDIT] ${label}...`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n[FAILED] ${label} falhou.`);
    return false;
  }
}

const steps = [
  { cmd: 'npm run check', label: 'Integridade de Tipos e Imports' },
  { cmd: 'npm run build', label: 'Simulação de Build de Produção' }
];

let allPassed = true;
for (const step of steps) {
  if (!run(step.cmd, step.label)) {
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n✅ AUDITORIA CONCLUÍDA: Código selado com integridade operacional.\n');
  process.exit(0);
} else {
  console.error('\n❌ VIOLAÇÃO DA LEI 14: O código não é estável o suficiente para deploy.\n');
  process.exit(1);
}
