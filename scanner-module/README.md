# Michels Travel — Scanner de Documentos

Módulo de scanner de documentos inteligente para a plataforma Michels Travel. Permite que clientes escaneiem passaportes, identidades e carteiras de motorista de qualquer país diretamente pelo navegador do celular, sem instalar nada.

## Arquitetura

O módulo é composto por três camadas principais:

### 1. Scanner OCR (Tesseract.js + MRZ Parser)
- Leitura de documentos com modelo OCR-B para MRZ e modelo ENG para texto geral
- Parser MRZ completo: TD1, TD2, TD3, MRVA, MRVB
- Preprocessamento de imagem (contraste, rotação, crop da zona MRZ)
- Múltiplas tentativas automáticas para máxima precisão

### 2. Módulo de Constatação (AI Document Verification Engine)
- Validação de formato (regex por tipo de campo)
- Validação de consistência lógica (datas, checksums, relações cruzadas)
- Validação de país (ISO 3166-1 alpha-3 — 200+ códigos)
- Detecção automática de tipo de documento
- Score de confiança individual por campo (0-100%)
- Score de confiança global ponderado
- Status por campo: `verified` | `warning` | `error` | `empty`
- Status global: `approved` | `review_needed` | `rejected`

### 3. Módulo de Recepção (Form Receiver)
- Mapeamento verificado → campos do formulário
- Distribuição automática com animação sequencial
- Status visual por campo (verde/amarelo/vermelho)
- Inferência de título a partir do gênero
- Priorização de valores corrigidos automaticamente

## Funcionalidades

- **Suporte trilíngue** — Português, Inglês e Espanhol com detecção automática
- **Mobile-first** — Interface otimizada para tela touch, botões grandes, instruções claras
- **Acessibilidade** — Projetado para idosos e pessoas com baixo teor cognitivo
- **Processamento 100% local** — Nenhuma imagem é enviada para servidores externos
- **Scanner remoto via QR Code** — O site gera um QR code, o celular escaneia e envia os dados de volta

## Fluxo Completo

```
[Documento] → [OCR/MRZ] → [Constatação AI] → [Recepção] → [Formulário Preenchido]
                              ↓                    ↓
                        Validação por campo    Distribuição animada
                        Score de confiança     Status visual (cores)
                        Validações cruzadas    Inferência de título
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page + scanner + formulário de reserva |
| `/scan?mode=scan&session=ID&lang=pt` | Scanner mobile acionado pelo site |

## Parâmetros da URL /scan

| Parâmetro | Descrição |
|-----------|-----------|
| `mode` | `scan` para modo acionado pelo site |
| `session` | ID da sessão (6 caracteres) |
| `lang` | Idioma: `pt`, `en` ou `es` |
| `callback` | URL de retorno (para cross-device) |
| `origin` | Origem do site principal |

## Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Tesseract.js (OCR)
- Framer Motion (animações)
- shadcn/ui (componentes)
- Express (servidor de produção)
- Fontes: Outfit (display) + DM Sans (body)

## Deploy no Render

### Configuração Manual

| Campo | Valor |
|-------|-------|
| **Root Directory** | `scanner-module` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Environment** | Node |
| **Node Version** | 22.13.0 |

### Variáveis de Ambiente

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22.13.0` |

### Ou via Blueprint (render.yaml)

O arquivo `render.yaml` na raiz do scanner-module configura o deploy automaticamente.

### Health Check

O endpoint `/health` retorna `{"status":"ok","timestamp":"..."}` e pode ser configurado no Render para monitoramento.

## Segurança em Produção

- Headers de segurança (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, CSP)
- CORS configurado para aceitar requisições do site principal
- Cache agressivo para assets com hash (1 ano, immutable)
- Cache de 1 hora para arquivos estáticos
- Trust proxy habilitado para Render

## Estrutura de Arquivos

```
scanner-module/
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── BookingForm.tsx          ← Formulário com módulo de recepção
│   │   │   ├── DocumentScanner.tsx      ← Scanner OCR principal
│   │   │   ├── VerificationPanel.tsx    ← Painel de constatação visual
│   │   │   ├── LanguageSwitcher.tsx     ← Seletor de idioma
│   │   │   └── ui/                     ← Componentes shadcn/ui
│   │   ├── contexts/
│   │   │   ├── LocaleContext.tsx        ← Contexto i18n
│   │   │   └── ThemeContext.tsx
│   │   ├── lib/
│   │   │   ├── documentScan.ts         ← Merge de candidatos OCR
│   │   │   ├── documentVerification.ts ← Módulo de Constatação (AI)
│   │   │   ├── formReceiver.ts         ← Módulo de Recepção
│   │   │   ├── i18n.ts                 ← Traduções PT/EN/ES
│   │   │   ├── imagePreprocess.ts      ← Preprocessamento de imagem
│   │   │   ├── mrz.ts                  ← Parser MRZ (TD1/TD2/TD3/MRVA/MRVB)
│   │   │   └── scannerBridge.ts        ← Bridge site ↔ celular
│   │   └── pages/
│   │       ├── Home.tsx                ← Página principal
│   │       ├── ScannerMobile.tsx       ← Página mobile do scanner
│   │       └── NotFound.tsx
├── server/
│   └── index.ts                        ← Servidor Express para produção
├── shared/
│   └── const.ts
├── package.json
├── pnpm-lock.yaml                      ← Lock file para builds reproduzíveis
├── render.yaml                         ← Blueprint do Render
├── .nvmrc                              ← Versão do Node
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Desenvolvimento Local

```bash
cd scanner-module
pnpm install
pnpm dev
```

O servidor de desenvolvimento inicia em `http://localhost:3000`.
