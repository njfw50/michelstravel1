# Livro da Vida — Michel's Travel 1
### Registro Permanente de Eventos do Sistema (Lei 05)

---

## [📜 Leis Suplementares do Protocolo Canônico]

- **Lei 15 (UX & Identidade):** Toda interface deve passar no "Teste do Uau". Se o usuário não se sentir em um ambiente premium de elite, a tarefa não está concluída.
- **Lei 16 (Código Civil de Infraestrutura):** Garante a "Produtibilidade" do software. Nenhuma mudança deve quebrar o build em produção. Ferramentas de construção (Vite, TSX, TSC) são consideradas dependências de runtime de build e devem estar no core do projeto (dependencies).

---

## [2026-04-16] — Saneamento de Infraestrutura & Código Civil de Deploy
**Autor:** Antigravity AI & Engenharia Michel's Travel
**Classificação:** Crítico / Infraestrutura
**Fundamento:** Lei 16 (Código Civil de Infraestrutura)

### 1. Descrição do Evento
Identificada falha crítica no ciclo de Deploy (Render.com) causada pela ausência de ferramentas de build (`tsx`, `vite`) no ambiente de produção e incompatibilidade de caminhos Node (`import.meta.dirname`).

### 2. Ações de Governança
- **Estabilização de Bundler:** Migração de ferramentas de build de `devDependencies` para `dependencies`.
- **Compatibilidade Universal:** Refatoração do `vite.config.ts` para usar `fileURLToPath`, garantindo execução idêntica em Windows (Local) e Linux (Render).
- **Sincronização i18n:** Alinhamento das chaves de tradução (EN, ES) com a base (PT) para evitar lacunas de UI.

---

## 🏗️ Apêndice A: Código Civil de Deploy (Normas de Conduta)
Para evitar corrupção do ambiente de produção, este Código estabelece:
1. **Soberania de Runtime:** O comando `npm run build` deve ser autossuficiente e universal.
2. **Resiliência do Front:** Uso obrigatório de `import.meta.env` para evitar quebras por ausência de `process`.
3. **Escaneamento de Chaves:** Nenhum componente novo de tradução deve ser injetado sem sua respectiva chave em todos os idiomas suportados.

---

## [2026-04-15] — Upgrade de Infraestrutura i18n
**Autor:** Antigravity AI & User
**Classificação (Lei 02):** Evolução / Robustez
**Fundamento:** Lei 06 (Tipagem Estrita), Lei 09 (Performance)

### 1. Descrição
Refatoração do sistema de internacionalização para suportar tipagem automática baseada na estrutura do JSON (`locales/pt.json`).

### 2. Melhorias Implementadas
- **Type Safety:** Chaves de tradução agora são validadas em tempo de compilação.
- **Performance:** Memoização de funções via `useCallback` e otimização de substituição de variáveis com Regex única.
- **Resiliência:** Implementação de detecção automática de idioma do navegador e fallback seguro para `pt`.

---

## [2026-04-13] — Evento Crítico: Restauração Canônica de SearchResults.tsx
... [continua registro histórico]
