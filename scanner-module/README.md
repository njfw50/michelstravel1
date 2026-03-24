# Michels Travel — Scanner de Documentos

Módulo de scanner de documentos inteligente para o site Michels Travel. Permite que clientes escaneiem passaportes, identidades e carteiras de motorista de qualquer país diretamente pelo celular, preenchendo automaticamente o formulário de reserva.

## Funcionalidades

- **Scanner OCR com Tesseract.js** — Leitura automática de texto em documentos
- **Parser MRZ completo** — Suporte a TD1, TD2, TD3, MRVA e MRVB (passaportes, identidades, vistos)
- **Documentos de qualquer país** — Suporte internacional universal
- **Preprocessamento de imagem** — Binarização, contraste, rotação automática para melhor leitura
- **Formulário com auto-preenchimento** — Dados extraídos são inseridos automaticamente
- **Revisão editável** — O usuário pode corrigir qualquer campo antes de confirmar
- **Processamento 100% local** — Nenhuma imagem é enviada para servidores externos
- **Acessível para idosos** — Textos grandes, botões amplos, instruções claras

## Stack Técnica

- React 19 + TypeScript
- Tailwind CSS 4
- Tesseract.js 7 (OCR)
- Framer Motion (animações)
- shadcn/ui (componentes)

## Estrutura

```
scanner-module/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentScanner.tsx    # Componente principal do scanner
│   │   │   └── BookingForm.tsx        # Formulário de reserva com auto-fill
│   │   ├── lib/
│   │   │   ├── mrz.ts                # Parser MRZ (TD1/TD2/TD3/MRVA/MRVB)
│   │   │   ├── imagePreprocess.ts    # Preprocessamento de imagem para OCR
│   │   │   └── documentScan.ts       # Merge e normalização de dados
│   │   ├── pages/
│   │   │   └── Home.tsx              # Página principal com fluxo completo
│   │   ├── App.tsx
│   │   └── index.css                 # Estilos seguindo identidade Michels Travel
│   └── index.html
├── server/
│   └── index.ts                      # Servidor estático
├── package.json
└── README.md
```

## Instalação

```bash
pnpm install
pnpm dev
```

## Fluxo do Usuário

1. O cliente acessa a página e clica em "Escanear Documento"
2. Tira uma foto com a câmera do celular ou envia uma imagem
3. O scanner processa a imagem localmente com OCR
4. Os dados extraídos são exibidos para revisão e edição
5. Ao confirmar, os dados preenchem automaticamente o formulário de reserva
6. O cliente completa os dados de contato e envia a reserva

## Documentos Suportados

| Tipo | Formato MRZ | Países |
|------|-------------|--------|
| Passaporte | TD3 (2x44) | Todos |
| Carteira de Identidade | TD1 (3x30) | Todos |
| Documento de Viagem | TD2 (2x36) | Todos |
| Visto Tipo A | MRVA (2x44) | Todos |
| Visto Tipo B | MRVB (2x36) | Todos |
| Carteira de Motorista | OCR geral | Todos |
