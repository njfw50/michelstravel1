import os
import subprocess

# Mapeamento de reversão (Natureza -> Propósito/Genérico)
REVERSION_MAP = {
    "github_project_v2_bootstrap.py": "setup_harvard_project.py",
    "issue_project_linkage_engine.py": "add_issues_to_project.py",
    "ACADEMIC_GOVERNANCE_PROTOCOL.md": "HARVARD_MANAGEMENT.md"
}

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0

def revert_nomenclature():
    print("Iniciando utilitário de reversão de nomenclatura...")
    
    any_reverted = False
    for current, original in REVERSION_MAP.items():
        if os.path.exists(current):
            print(f"Revertendo: {current} -> {original}")
            if run_command(f"git mv {current} {original}"):
                any_reverted = True
            else:
                # Fallback caso não esteja no git
                os.rename(current, original)
                any_reverted = True
        else:
            print(f"Aviso: {current} não encontrado. Pulando...")

    if any_reverted:
        print("\nAlterações locais concluídas.")
        print("Para persistir no repositório, execute:")
        print("git commit -m 'maintenance: revert management assets nomenclature'")
        print("git push origin main")
    else:
        print("\nNenhum arquivo para reverter.")

if __name__ == "__main__":
    revert_nomenclature()
