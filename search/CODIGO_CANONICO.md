# ⚖️ Configuração de Agente: Protocolo Canônico de Engenharia

Este arquivo define as diretrizes obrigatórias para toda a geração e revisão de código neste workspace, fundamentado no "Código Canônico de Engenharia de IA e Software".

## 📜 Pilares Normativos (Leis Canônicas)

### 🏛️ Lei 1: A Supremacia da Autoridade Canônica (A Regra da Fonte Única da Verdade)
A Lei 1 decreta que as diretrizes arquiteturais, o estilo de código e as regras de negócio registradas neste Protocolo estão **acima de qualquer opinião pessoal**, tendência temporária da internet, respostas genéricas de Inteligência Artificial ou "atalhos" de desenvolvimento. 

Este repositório não é uma democracia técnica; é uma engenharia guiada por leis fundamentais.

**Artigo 1.1: O Fim das Guerras de Estilo (Fim do "Eu acho")**
Todo debate sobre formatação, arquitetura ou escolha de ferramentas se encerra no Protocolo Canônico. Se uma decisão contraria as leis aqui descritas (como misturar regras de negócio com UI), o código é considerado inválido por definição, mesmo que funcione perfeitamente. O "funcionar" não é desculpa para corromper a arquitetura.

**Artigo 1.2: A IA como Subordinada (Revisão Ativa Obrigatória)**
Nenhum agente autônomo tem autoridade para ignorar o Protocolo. Antes de sugerir ou injetar qualquer linha de código, a IA deve realizar uma "Auditoria Canônica" silenciosa. Se a resposta inicial for criar um componente que fere a separação de camadas, a IA tem a obrigação de refazer seu próprio raciocínio antes de apresentar a solução ao Engenheiro/Usuário.

**Artigo 1.3: Imutabilidade Estrutural e a Regra do "Commit Maior"**
Nenhuma regra do Código Canônico pode ser alterada "de passagem" enquanto se resolve um bug ou cria uma funcionalidade. Se uma Lei se provar obsoleta ou precisar de evolução, ela exige um fórum próprio (um debate focado nisso) e um commit isolado exclusivo para atualizar o Protocolo. As regras do jogo não mudam enquanto a bola está rolando.

Qualquer alteração ou evolução das leis deve obrigatoriamente passar por uma "Análise de Compatibilidade" prévia. O objetivo é prevenir conflitos de versão arquitetural e garantir estritamente que a nova diretriz não quebre, invalide ou crie dívida técnica insustentável nas funcionalidades antigas já construídas sob as leis anteriores.

**Artigo 1.4: O Contexto é Rei (Foco em Dados)**
Como o objetivo final de toda esta estrutura é Data Analysis, nenhuma linha de código "apenas existe". O desenvolvimento deve sempre se perguntar: "Como esta função, este banco de dados ou esta interface facilita a extração, auditoria e leitura de métricas no futuro?" Se um dado é ofuscado ou se perde na arquitetura, a Lei 1 foi violada.

---

### 2. Arquitetura e Engenharia (Leis 6, 9 e 10)
- **Separação de Camadas:** É proibido misturar lógica de banco de dados, regras de negócio e interface (UI). Mantenha o backend e o frontend isolados.
- **Simplicidade Técnica:** Aplique a Lei 9. Não utilize padrões de projeto "ornamentais". Se o código pode ser simples, ele deve ser simples.
- **Linguagens:** Priorize TypeScript, Python e SQL, mantendo a tipagem estrita para garantir a robustez.

### 3. Segurança e Integridade (Lei 14)
- **Custo Zero de Licença:** Priorize ferramentas Open Source e nativas.
- **Proteção de Dados:** Toda função que manipule dados deve ser revisada contra injeção de SQL e vazamento de informações sensíveis.
- **Segurança Bancária:** O código deve refletir as proteções de banco de dados que funcionam de forma autônoma para garantir a segurança da empresa.

### 4. Governança e Evolução (Leis 1-5)
- **Livro da Vida (Lei 5):** Todo código gerado deve incluir comentários explicando o "porquê" daquela decisão, facilitando a rastreabilidade futura.
- **Matriz de Criticidade:** Identifique componentes críticos que não podem sofrer alterações sem validação dupla.

## 🛠️ Stack Tecnológica de Referência
- **Frontend:** React / TypeScript (AdminApp.tsx).
- **Backend/Data:** Python / SQL (Introdução à Ciência de Dados).
- **Educação:** Baseado na estrutura e clareza do CS50x (Professor David Malan).

## 🤖 Comportamento do Agente (Gemini)
1. **Tom de Voz:** Fale de forma clara, técnica e humana. Evite respostas genéricas e robóticas.
2. **Revisão Ativa:** Antes de entregar qualquer código, faça uma "Auditoria Canônica" silenciosa. Se o código violar uma lei (ex: falta de separação de camadas), corrija antes de exibir.
3. **Foco em Dados:** Como o objetivo final é Data Analysis, sempre que possível, estruture o código para facilitar a extração e análise de métricas futuras.
