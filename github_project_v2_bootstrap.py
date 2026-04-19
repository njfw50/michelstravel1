import os
import requests
import json

# Configurações
GITHUB_TOKEN = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")
USER_NAME = "njfw50"
REPO_NAME = "michelstravel1"
PROJECT_TITLE = "MichelsTravel1 - Harvard Management"

if not GITHUB_TOKEN:
    print("Erro: A variável de ambiente GH_TOKEN não foi encontrada.")
    print("Por favor, execute: export GH_TOKEN=seu_token_aqui")
    exit(1)

headers = {"Authorization": f"token {GITHUB_TOKEN}"}
url = "https://api.github.com/graphql"

def run_query(query, variables=None):
    response = requests.post(url, json={'query': query, 'variables': variables}, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Query failed with code {response.status_code}. {response.text}")

# 1. Obter Node ID do Usuário e das Issues
get_info_query = """
query($owner: String!, $repo: String!) {
  user(login: $owner) {
    id
  }
  repository(owner: $owner, name: $repo) {
    id
    issues(first: 10, states: OPEN) {
      nodes {
        id
        title
      }
    }
  }
}
"""

print(f"Buscando informações para {USER_NAME}/{REPO_NAME}...")
info = run_query(get_info_query, {"owner": USER_NAME, "repo": REPO_NAME})
owner_id = info['data']['user']['id']
issue_nodes = info['data']['repository']['issues']['nodes']

# 2. Criar o Projeto V2
create_project_mutation = """
mutation($ownerId: ID!, $title: String!) {
  createProjectV2(input: {ownerId: $ownerId, title: $title}) {
    projectV2 {
      id
      url
    }
  }
}
"""

print(f"Criando projeto: {PROJECT_TITLE}...")
project_result = run_query(create_project_mutation, {"ownerId": owner_id, "title": PROJECT_TITLE})

if 'errors' in project_result:
    print("Erro ao criar projeto:", project_result['errors'])
    exit(1)

project_id = project_result['data']['createProjectV2']['projectV2']['id']
project_url = project_result['data']['createProjectV2']['projectV2']['url']
print(f"Projeto criado com sucesso: {project_url}")

# 3. Adicionar as Issues ao Projeto
add_item_mutation = """
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
    item {
      id
    }
  }
}
"""

print("Vinculando issues ao projeto...")
for issue in issue_nodes:
    print(f"Adicionando: {issue['title']}")
    run_query(add_item_mutation, {"projectId": project_id, "contentId": issue['id']})

print("\n--- SUCESSO ---")
print(f"O seu quadro Kanban estilo Harvard foi criado e populado!")
print(f"Acesse em: {project_url}")
