# Guia de Organização MichelsTravel1 (Estilo Harvard)

Este repositório segue um modelo de gestão estruturado inspirado nos padrões acadêmicos da **Harvard University**, priorizando clareza, rigor técnico e progressão lógica.

## 1. Estrutura de Milestones (Marcos do Projeto)

O desenvolvimento é dividido em fases acadêmicas, cada uma focada em um componente crítico do ecossistema:

| Milestone | Descrição | Foco Principal |
| :--- | :--- | :--- |
| **M1: Foundation & Core** | Arquitetura base e esquemas compartilhados. | `shared/`, `db.ts`, `schema.ts` |
| **M2: Mobile Client** | Implementação da interface e lógica do usuário. | `mobile-client/`, React Native |
| **M3: Scanner Module** | Sistema de verificação e processamento de documentos. | `scanner-module/`, OCR AI |
| **M4: Server & AI** | Serviços de backend, integrações de IA e APIs. | `server/`, Duffel, Stripe |

## 2. Taxonomia de Labels (Classificação)

As etiquetas (labels) seguem uma taxonomia rigorosa para facilitar a filtragem e priorização:

*   **Phase: Research**: Fase de descoberta e análise técnica.
*   **Phase: Development**: Implementação ativa de código.
*   **Phase: Peer Review**: Revisão por pares e auditoria de segurança.
*   **Phase: Publication**: Preparação para release e deploy.
*   **Type: Thesis/Core**: Funcionalidades que formam o "core" do projeto.
*   **Priority: High Impact**: Itens críticos para o sucesso da missão.

## 3. Fluxo de Trabalho Recomendado

1.  **Proposição**: Toda nova funcionalidade deve começar com uma Issue de `Phase: Research`.
2.  **Desenvolvimento**: Após a validação, a Issue progride para `Phase: Development`.
3.  **Defesa (Review)**: Pull Requests devem ser revisados sob a ótica de `Phase: Peer Review`.
4.  **Entrega**: O fechamento do Milestone ocorre após a `Phase: Publication`.

---
*Organizado automaticamente pelo Manus AI - 2026*
