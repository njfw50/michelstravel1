# REDESIGN 2027 — registro de decisões

Branch: `redesign-2027` (a partir de `cloudflare-containers` @ 377db97).
Nada aqui foi publicado. Nada vai ao ar sem a aprovação expressa do Michel.

## A ideia (a surpresa)

O site vira uma **revista de bordo**: papel champagne quente (`#FBF7EF`),
tinta azul-marinho profunda, foto quente em tela cheia no hero, preço como
herói nos cartões, traço dourado editorial. A marca continua fria (azul
profundo do logo 3D); a fotografia tende ao quente — Delimitação de
Característica, como manda a Diretriz de Execução Visual 2027. O site
antes era todo escuro; agora o escuro vira moldura (hero, ofertas, rodapé)
e o claro vira leitura (papel). O logo 3D oficial 2027 entra no header e
no rodapé, direto, quadrado, sem card nem borda — o `.brand-mark-shell`
antigo arredondava o logo e foi abandonado.

## Fundamento no Código Canônico (lido no repo `codigo-canonico-engenharia-ai`, main)

| Cânone | Onde aparece no redesign |
|---|---|
| I — Autoridade / auditoria | Decisões registradas aqui; cada preço com fonte + data visível; commits por arquivo, mensagens claras |
| V — Livro da Vida | `packages.json` é o livro dos pacotes: cada preço tem origem e data |
| XIV — Cibersegurança | Nenhum segredo no código; `.env` não lido nem tocado; WhatsApp via helpers existentes |
| XV — Experiência do usuário | Uma ideia por tela; texto mínimo 12px; safe zones; mobile primeiro |
| XVI — Integridade do texto | Linguagem plana e precisa; sem "garantido" que não se prova; sem urgência falsa |
| XVIII — Soberania cognitiva | Sem contador falso, sem "só resta 1 assento"; anotações litúrgicas no código novo explicando a intenção de cada decisão não-trivial |
| XIX — Integridade das referências | "Verificado em [data]" em ofertas e pacotes; fonte do clima/tarifa escrita no blog |
| XXII — Procedência | Todo preço/fato exibe fonte e data; nada sem fonte vai para a tela |
| XXIII — Contenção do erro (fail-closed) | Preço velho some e vira "a reconfirmar"; sem dado, sem linha (paradas, clima) |

## O que foi reformado (arquivos)

| Arquivo | O que mudou |
|---|---|
| `client/src/pages/Home.tsx` | Reescrita completa no visual novo; mesmos ids de seção (painel intacto); stats→faixa de confiança; insights→"Como funciona" + Mia + Toolbox sem números falsos; deals com proveniência; parceiros filtrados por logo; CTA dourado; seção de segurança removida da home (decisão 26/nov: página /seguranca) |
| `client/src/components/DealCard.tsx` | "Voo direto" fixo removido (paradas reais ou nada); "Verificado em [data]" via `created_at`; preço herói; CTA coral |
| `client/src/components/Layout.tsx` | Logo 3D direto (fallback p/ favicon); link Pacotes; rodapé completo com fatos de segurança + NJ desde 2023 + YouTube; rótulos do menu mobile 8px→12px |
| `client/src/components/SecuritySection.tsx` | NOVO — conteúdo da página /seguranca, só fatos verificáveis, sem selo de governo |
| `client/src/pages/Packages.tsx` | NOVO — rota `/pacotes` |
| `client/src/pages/Security.tsx` | NOVO (26/nov, pós-aplicação) — página `/seguranca`, reusa SecuritySection; link no rodapé |
| `client/src/components/PackageCard.tsx` | NOVO — cartão de pacote com fail-closed |
| `client/src/data/packages.json` | NOVO — seed com 4 pacotes + `pending[]` (Londres) + divergência Terra Santa (6 vs 7 noites) anotada |
| `client/src/lib/packages.ts` | NOVO — frescor (≤2 dias), formatação, WhatsApp por pacote |
| `client/src/pages/BlogList.tsx` | Reescrita visual; "viajantes ativos" e tendências inventadas removidas; título/CTA pelos locales; descrição inventada de lugar removida |
| `client/src/pages/BlogPost.tsx` | Reescrita visual; avatar pravatar.cc removido (logo no lugar); "Gostou?" pelos locales |
| `client/src/styles/redesign-2027.css` | NOVO — tokens 2027 + utilitários (logo, scrim, preço, proveniência, CTA) |
| `client/src/components/FlightSearchForm.tsx` | PATCH — calendário: ida nova limpa volta inválida; volta nunca antes da ida; descrições de idade pelos locales |
| `client/src/components/LocationSearch.tsx` | PATCH — autocomplete abre para cima quando não há espaço abaixo |
| `client/src/hooks/use-flights.ts` | PATCH — retry explícito (2 tentativas, backoff) antes de mostrar erro na busca |
| `client/src/App.tsx` | PATCH — rotas `/pacotes` e `/seguranca` |
| `client/src/index.css` | PATCH — importa `styles/redesign-2027.css` |
| `tailwind.config.ts` | PATCH — cores 2027 (coral/gold/ember/bronze/champagne/navy/paper) + `font-display`. Achado: `text-coral-500` era usado no código sem o token existir — classe morta; agora existe |
| `client/src/locales/{pt,en,es}.json` | PATCH — chaves novas (pacotes, segurança, confiança, ofertas) + correções |
| `client/public/logo-3d-2027.png` | NOVO — logo oficial 2027 (cópia byte do arquivo-mestre) |
| `docs/packages-daily-refresh.md` | NOVO — rotina diária de recheck TAAP |

## Correções da Parte 3 incorporadas

- (a) Calendário: dois calendários separados já existiam; o defeito real
  era a volta ficar inválida quando a ida mudava (volta < ida seguia no
  submit). Agora a ida nova limpa a volta inválida e a volta é validada.
  **Verificação ao vivo no navegador ainda pendente** (este agente não
  opera navegador) — testar: escolher ida, depois volta, trocar a ida
  para depois da volta, conferir que a volta limpa.
- (b) Autocomplete: `max-h-80` já existia; faltava abrir para cima quando
  não há espaço. Implementado por medição de viewport.
- (c) Espera ~20s: narração em 5 passos mantida; somado retry automático
  (2 tentativas com backoff) no `useFlightSearch` antes do erro.
- (d) Parceiros: `filter(a => a.logoUrl).slice(0, 12)`.
- (e) Toolbox: valores fixos removidos; cartão virou link honesto.
- (f) Estatísticas: removidas; faixa de confiança com 4 fatos verificáveis.
  **Pergunta ao Michel (não inventado):** existe algum número real que ele
  queira exibir (ex.: anos de agência, destinos atendidos)? Se sim, com
  fonte, entra na faixa. Sem fonte, fica fora.
- Extras encontrados no código e corrigidos: `home.intel.r1/r2/r3`
  ("15% de queda", "45 dias antes", "Lisboa em alta") sem fonte — seção
  substituída; `PULSE_CITIES` com "viajantes ativos"/tendências fixos —
  removidos; avatar `pravatar.cc` no post — removido; `font-display` e
  `text-coral-500` usados sem definição no Tailwind — definidos.

## Parte 5 — pagamento end-to-end + webhook Stripe

Verificado no código: `server/webhookHandlers.ts` existe (384 linhas:
`processWebhook` com assinatura, criação de pedido Duffel, e-mail de
confirmação, recibo Stripe, redação de dados de passageiro) e está
**ligado** em `server/index.ts` (webhooks Stripe e Duffel registrados).
Nada foi alterado no servidor. **Não verificado ao vivo:** nenhum teste
com cartão real foi feito (nem pode ser feito por este agente). Passo a
passo de teste ao vivo — PENDENTE, documentado aqui para executar com o
Michel: (1) no Dashboard Stripe, modo teste, criar um pagamento de teste
no checkout do site; (2) conferir o evento `payment_intent.succeeded`
chegando no endpoint e o pedido sendo criado no Duffel; (3) conferir o
e-mail de confirmação e o recibo; (4) repetir em modo live com valor
mínimo e estornar. Sem esses 4 passos, **não afirmar que o pagamento
funciona de ponta a ponta**.

## Parte 6 — login do cliente + WebSocket de voz

Avaliado só por leitura de código: existe `useAuth` + `LoginDialog` +
rotas `/profile`, `/messages`, `/live/:sessionId` e `server/voice_server.ts`
+ `duffelWebhookHandlers.ts`. **Estado real não verificado:** não foi
testado login, sessão ao vivo, nem handshake WebSocket (exige navegador
e conta). Reportado como não verificado — não afirmar que funciona.

## Pendente (não feito, por ordem)

- **Parte 1 (senha do painel admin):** não tocada. A ordem das seções vem
  de `site_settings`; o redesign implementa a ordem nova como padrão no
  código (hero, confiança, como-funciona, ofertas, parceiros, CTA +
  segurança sempre), mas a ordem final no ar depende do painel.
- **Parte 2 (Terminal do Idoso):** só o que não depende de decisão —
  textos mínimos (menu/rodapé ≥12px) e consistência visual com o novo
  design system. Fase A (voz no iPhone, "Falar com uma pessoa", "Passo X
  de 13", confirmação falada, "Ouvir de novo"), Fase B (seção do idoso na
  home), Fase C ("Seu dia de viagem", plano B de pagamento) e Fase D (voz
  da Mia na espera) — todas PENDENTES, ver `plano-reconstrucao-idoso.md`.
  O Terminal NÃO foi recriado nem teve comportamento alterado.
- **Parte 4 (wrangler):** `wrangler.jsonc.new` NÃO subido; `wrangler.jsonc`
  intacto. O push dispara deploy e precisa do OK dele.
- **Título da home (`home.search.title`):** DECIDIDO pelo Michel
  26/nov/2026 03:49 — opção C premium: PT "Viajar bem começa aqui." /
  EN "Traveling well starts here." / ES "Viajar bien empieza aquí."
  (aplicado nos 3 locales da branch).
- **Fotos reais de Porto e Tel Aviv:** os cartões usam foto genérica
  local (jato ao pôr do sol, `client/public/images/hero-jet-sunset.jpg`)
  até a direção de arte entregar as fotos reais. A URL do Unsplash
  usada antes (photo-1436491865332) morreu com 404 (QA 26/nov) — nada
  de foto externa sem verificação. Nunca foto de outro destino como se
  fosse o lugar.
- **Londres:** fora do seed (sem hotel confirmado) — em `pending[]`.
- **Terra Santa:** divergência 6 vs 7 noites — confirmar no recheck TAAP.
- **Lisboa (18/nov) e Terra Santa (20/nov):** preço fora da janela de
  frescor no dia 26/nov — aparecem como "a reconfirmar" até o recheck.
- **Redes no rodapé:** só YouTube (`@MichelsTravelUSA`, confirmado).
  Instagram/Facebook entram quando ele confirmar os perfis.
- **Verificação ao vivo:** build/tsc, calendário, autocomplete, busca
  com container frio, `/pacotes` no preview — tudo pendente de execução
  (este agente foi bloqueado de rodar build/git pelo controle de execução;
  ver relatório).

## Checklist de qualidade aplicado (checklist-qualidade-arte.md)

1. Margens/respiro: escala de 8px; texto sem encostar em borda/botão.
2. Contraste: texto branco só sobre scrim escuro; coral só em texto
   grande ou botão; **coral sobre azul royal proibido** — não usado.
3. Legibilidade: mínimo 12px (navegação/rodapé), 11px só em selos curtos.
4. Sobreposição: scrims com zona escura total sob o texto; logo com área
   livre no canto superior direito do hero.
5. Logo: intacto, quadrado, sem card/borda, arquivo oficial.
6. Dados verdadeiros: nenhum preço/data inventado; tudo com fonte+data.
7. Conferência visual final: **PENDENTE** — renderizar o preview e olhar
   em tamanho real (celular + desktop) antes de mostrar a ele.
8. Uma ideia por seção; no máximo 3 níveis hierárquicos por cartão.

## Rodada de conserto — QA do preview 26/nov/2026 (branch redesign-2027)

O preview (build 6cfc8135) foi conferido no desktop (1919px) e NÃO
passou: herói quebrado, preços ilegíveis, ofertas/alianças/blog vazios.
Causas conferidas no código e corrigidas (sem commit — aguardando
revisão e novo preview):

1. **Foto do herói morta:** a URL do Unsplash `photo-1436491865332`
   (herói + genérica dos pacotes) retorna 404 — uma URL quebrava 5
   imagens; o herói do blog usava outra ID morta (`...c055`). Trocado
   por foto local `client/public/images/hero-jet-sunset.jpg` (Unsplash
   photo-1474302770737, jato ao pôr do sol, verificado 200 + visto).
   Recife (REC, photo-1596162391609) também 404 — cai no genérico.
2. **Preço escuro-sobre-escuro:** o shadcn Card injeta `bg-card`
   (navy `--card` do tema antigo) e a utility vencia `.mt-card`
   (branco) na cascata. Corrigido com `.mt-card.bg-card` /
   `.bg-white.bg-card` em `redesign-2027.css` (especificidade maior,
   sem `!important`) — preço navy sobre cartão branco.
3. **H1 não era o título escolhido:** o título C estava só em
   `home.search.title` (aba/SEO); o H1 lê `home.hero.title` (frase
   antiga). Título C aplicado ao H1 nos 3 locales — e o locale passa
   a vencer o `site_settings`: o banco de produção guarda o título
   legado em inglês ("Find Your Next Adventure") e o subtítulo
   ("Best prices on flights worldwide."), que não podem vencer.
4. **Fade-in lento:** motions de 0,8s + delay de até 0,7s deixavam o
   conteúdo invisível por segundos. Agora ≤0,35s / delay ≤0,1s no
   herói, na busca e nos cartões de segurança.
5. **Ofertas vazias:** a API `/api/public/flight-deals` volta 500 no
   preview (sem banco) — a seção mostra os 4 pacotes reais do
   `packages.json` como fallback (preço = total p/ 2; velho = "a
   reconfirmar"; botão leva a /pacotes). A API vence quando há dados.
6. **Alianças vazias:** sem logo, a seção some (fail-closed).
7. **Blog vazio + sitemap 500:** `/api/blog` volta 500 no preview —
   a lista mostra o estado vazio honesto (`blog.no_posts`, já
   traduzido); o sitemap agora falha suave (só páginas estáticas,
   + `/pacotes` e `/seguranca`). "Filtros Avançados" não leva mais
   para /search — rola até a busca do blog. Clima do Pulso traduzido
   (a API devolve inglês). Bloco de destaques some quando vazio.
8. **Logo pequeno:** header 44–56px → 56px (xl: 80px); rodapé 56px
   → 80px. Arquivo intacto (LOGO_LOCK).
9. **ES:** campos de busca caíam no inglês ("From"/"To") por falta
   das chaves `search.from/to` — criadas ("Desde"/"Hasta"); rodapé
   "Atendimento claro y suporte humano" → "Atención clara y soporte
   humano".
10. **Nits:** link "voltar" do /pacotes em linha própria; `scroll-
    padding-top: 8rem` (header fixo não come mais o topo das
    seções); banner de cookies de 1,5s → 4s; contraste dos campos
    de busca (placeholder slate-800 → slate-400, rótulos
    slate-500/600 → slate-300/400) e da navegação.

**Causa raiz das seções vazias no preview:** o preview NÃO tem
`DATABASE_URL` — `/api/public/settings`, `/api/blog` e
`/api/public/flight-deals` devolvem 500 (conferido com curl no
preview); `/api/airlines` devolve `[]`. Em produção o banco existe,
mas os fallbacks acima valem para qualquer falha. Adicionar o
`DATABASE_URL` como segredo de preview é decisão do dono (o preview
passaria a ler o banco de produção — ver antes de ligar).

**Não reproduzido no código:** "Experiência Recomenda" e "Ponto de
Interesse Local 0" (QA) — nenhuma das duas strings existe no código;
provável leitura de widget da API de destinos, que some com o bloco
vazio. Re-QA deve confirmar que sumiram.

**Pendente de verificação ao vivo (re-QA):** mobile (~390px) — o QA
não tinha emulação móvel; renderização real das correções no novo
preview (herói, preços, ofertas, blog); calendário e autocomplete
(Parte 3, já pendentes).

## Rodada de conserto 2 — re-QA do preview 26/nov/2026 10:48 (branch redesign-2027)

O re-QA (desktop 1919px + celular 390×844 no Chrome do PC, DevTools)
NÃO aprovou: 10 de 11 consertos da rodada 1 verificados, mas o blog
ainda exibia o widget "O Pulso dos Destinos" com os textos
"Experiência Recomenda" e "Ponto de Interesse Local" + 4 defeitos
menores. Correções (sem commit — aguardando revisão e novo preview):

1. **Causa-raiz do widget (bloqueante) — estava no SERVIDOR, não no
   cliente.** A rodada 1 afirmou que as strings "não existem no
   código" — errado: elas estavam em `server/routes.ts`, no `catch`
   do endpoint `/api/destinations/highlights`, que devolvia itens
   mock inventados ("Ponto de Interesse Local" / "Experiência
   Recomenda") em qualquer erro. No preview (sem `GEOAPIFY_API_KEY`
   / sem banco) o endpoint sempre caía no `catch`, então o bloco
   tinha 2 itens e a condição de esconder (`items.length === 0`)
   nunca disparava. Correção: o `catch` agora devolve
   `{ total: 0, items: [] }` (fail-closed — o cliente esconde o
   bloco); o fallback curado (Torre de Belém, MASP, Magic Kingdom —
   lugares reais, endereços reais) perdeu as distâncias inventadas
   (`distance_m: null`; o selo de raio só aparece com valor real).
   Verificado: zero ocorrências das duas strings em `client/src`,
   `server/` e no `dist/` compilado.
2. **Pulso some sem dado.** A seção "O Pulso dos Destinos" agora
   some inteira quando, após o carregamento, nenhuma cidade tem
   clima ou tarifa (`hasPulseData`); durante o carregamento mostra
   esqueleto, nunca "--°C" / "---". O bloco de destaques tem regra
   própria e não é afetado (em produção, se o clima falhar mas o
   Geoapify funcionar, os destaques continuam aparecendo).
3. **Botão de ida cortado no celular (390px) e "FECHA DE VUELTA"
   cortado no desktop ES.** Causa: `px-5` + ícone 20px + texto 12px
   `tracking-widest` não cabiam na coluna (~147px no celular,
   ~182px no desktop). Corrigido nos 3 botões de data (ida, volta e
   perna multi-city): `px-3 md:px-4`, `gap-2`, ícone 16px fixo com
   `shrink-0`, texto `10px md:11px tracking-wide`, `min-w-0` no
   contêiner (elipse funciona). Medido: "FECHA DE VUELTA" (15
   caracteres, o mais longo) ≈ 112px num espaço de ~122px no
   desktop; "DATA DE IDA" ≈ 82px num espaço de ~99px no celular.
   Rótulos completos mantidos — nada encurtado.
4. **Menu inferior em PT na página em inglês.** Os 5 rótulos eram
   texto fixo em PT no `Layout.tsx`. Agora passam por chaves i18n
   novas e curtas (`nav.mobile_flights/mobile_trips/mobile_messages/
   mobile_profile/menu`): Voos/Flights/Vuelos, Viagens/Trips/Viajes,
   Chat, Perfil/Profile/Perfil, Menu/Menú. (Os rótulos longos do
   cabeçalho — "Minhas Viagens" etc. — não caberiam nos 5 itens.)
5. **Subtítulo do herói sem contraste.** O subtítulo caía sobre o
   céu claro da foto. Corrigido em Home, /pacotes e /blog: subtítulo
   branco sólido com sombra de texto
   (`[text-shadow:0_2px_16px_rgba(6,13,36,0.9)]`) + scrim
   `.mt-hero-scrim` reforçado na zona intermediária (0.55→0.8 aos
   40%). A foto do herói não mudou.
6. **Nits.** Bolha da Mia e painel do chat subiram no celular
   (`bottom-24/20` → `bottom-28` = 112px) para limpar a navegação
   fixa + safe-area de celulares com notch. Rodapé ganhou `pb-28`
   no celular: o rodapé é o último elemento da página e a navegação
   fixa cobria a linha do copyright; a linha também ganhou
   `leading-relaxed` para quebrar em 2 linhas sem aperto.
7. **Diagnóstico (só relatório, sem mudança de comportamento).**
   Console: "[Integridade Linguística] Inconsistência detectada:
   Doc=pt, Body=undefined, Escolhido=en". Causa:
   `client/index.html` é estático com `<html lang="pt-BR">` e o
   `<body>` não tem atributo `lang`; o `useLanguageIntegrity`
   (App.tsx) roda no mount com o idioma escolhido `en` (detecção do
   navegador no PC do QA) e avisa antes de sincronizar os dois
   atributos para o idioma escolhido — no mesmo efeito. É um
   transiente de primeira renderização, só no console, e se
   autocorrige; nenhum impacto visual. O idioma padrão NÃO foi
   alterado — decisão do Michel, separada.

**Verificação local:** `npm run build` exit 0; `npm run check` com
exatamente os mesmos 10 erros pré-existentes (6 arquivos intactos,
zero erro novo); scrim novo + `text-shadow` presentes no CSS
compilado; chaves `mobile_*` presentes no JS compilado; foto do
herói no `dist/`; `git status` com 11 arquivos modificados, `dist/`
não versionado e nunca adicionado.

**Pendente de verificação ao vivo (re-QA):** renderização real no
novo preview — blog sem o widget quando vazio (confirmar que as
duas strings sumiram da página), botões de data em 390px (PT/EN/ES)
e "FECHA DE VUELTA" no desktop ES, menu inferior nos 3 idiomas,
subtítulo do herói legível à primeira vista, bolha da Mia e rodapé
no celular. O avatar "A" citado no QA não existe como componente
na página /blog (nenhum `Avatar` renderizado lá) — provavelmente o
bloco de ícone dos cards mock; o re-QA deve confirmar que sumiu
junto com eles.
