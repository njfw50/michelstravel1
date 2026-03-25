# Michels Travel — Scanner de Documentos

Módulo de scanner de documentos inteligente para a plataforma Michels Travel. Permite que clientes escaneiem passaportes, identidades e carteiras de motorista de qualquer país diretamente pelo navegador do celular, sem instalar nada.

## Funcionalidades

- **OCR com Tesseract.js** — Leitura de documentos com modelo OCR-B para MRZ e modelo ENG para texto geral
- **Parser MRZ completo** — Suporte a TD1, TD2, TD3, MRVA, MRVB (passaportes, identidades, vistos de qualquer país)
- **Suporte trilíngue** — Português, Inglês e Espanhol com detecção automática
- **Mobile-first** — Interface otimizada para tela touch, botões grandes, instruções claras
- **Acessibilidade** — Projetado para idosos e pessoas com baixo teor cognitivo
- **Processamento 100% local** — Nenhuma imagem é enviada para servidores externos
- **Auto-preenchimento** — Dados confirmados preenchem automaticamente o formulário de reserva
- **Scanner remoto via QR Code** — O site gera um QR code, o celular escaneia e envia os dados de volta

## Fluxo de Acionamento

1. No site principal, o cliente clica em "Escanear Documento" ou "Scanner Mobile"
2. **Mesmo dispositivo**: Abre o scanner diretamente na página
3. **Dispositivo diferente (QR Code)**: Gera um QR code com sessão única, celular abre o scanner no navegador, escaneia, dados retornam via BroadcastChannel / localStorage / callback URL

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

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Deploy via Render

1. Conecte o repositório ao Render
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start`
4. Porta: `3000`
