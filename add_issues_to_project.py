import os
import requests
import sys

# Configurações
GITHUB_TOKEN = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")
USER_NAME = "njfw50"
REPO_NAME = "michelstravel1"

if not GITHUB_TOKEN:
    print("Erro: GH_TOKEN não configurado.")
    exit(1)

if len(sys.argv) < 2:
    print("Uso: python3 add_issues_to_project.py <PROJECT_ID>")
    exit(1)

PROJECT_ID = sys.argv[1]
headers = {"Authorization": f"token {GITHUB_TOKEN}"}
url = "https://api.github.com/graphql"

def run_query(query, variables=None):
    response = requests.post(url, json={'query': query, 'variables': variables}, headers=headers)
    return response.json()

# 1. Buscar todas as Issues abertas
get_issues_query = """
query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    issues(first: 50, states: OPEN) {
      nodes {
        id
        title
      }
    }
  }
}
"""

print("Buscando issues...")
result = run_query(get_issues_query, {"owner": USER_NAME, "repo": REPO_NAME})
issues = result['data']['repository']['issues']['nodes']

# 2. Adicionar ao projeto
add_mutation = """
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
    item { id }
  }
}
"""

for issue in issues:
    print(f"Adicionando: {issue['title']}")
    run_query(add_mutation, {"projectId": PROJECT_ID, "contentId": issue['id']})

print("Concluído!")
