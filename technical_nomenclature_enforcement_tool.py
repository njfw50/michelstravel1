import os
import subprocess

# Mapeamento de aplicação (Genérico/Propósito -> Natureza/Técnico)
ENFORCEMENT_MAP = {
    "setup_harvard_project.py": "github_project_v2_bootstrap.py",
    "add_issues_to_project.py": "issue_project_linkage_engine.py",
    "HARVARD_MANAGEMENT.md": "ACADEMIC_GOVERNANCE_PROTOCOL.md"
}

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0

def enforce_technical_nomenclature():
    print("Iniciando ferramenta de imposição de nomenclatura técnica...")
    
    any_enforced = False
    for original, technical in ENFORCEMENT_MAP.items():
        if os.path.exists(original):
            print(f"Aplicando nomenclatura técnica: {original} -> {technical}")
            if run_command(f"git mv {original} {technical}"):
                any_enforced = True
            else:
                # Fallback caso não esteja no git ou git mv falhe
                os.rename(original, technical)
                any_enforced = True
        else:
            print(f"Status: {technical} já está em conformidade ou {original} não existe.")

    if any_enforced:
        print("\nNomenclatura técnica aplicada localmente.")
        print("Para persistir as mudanças no repositório, execute:")
        print("git commit -m 'governance: enforce technical nomenclature for management assets'")
        print("git push origin main")
    else:
        print("\nO repositório já está em total conformidade com a nomenclatura técnica.")

if __name__ == "__main__":
    enforce_technical_nomenclature()
