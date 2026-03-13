# Michels Travel - Flight Commission Hub

Sistema de gestão de reservas e comissões de voos desenvolvido com React, TypeScript, Node.js e integração com Stripe.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (compatível com TiDB)
- **ORM**: Drizzle
- **Pagamentos**: Stripe
- **IA**: OpenAI API (para chat, imagens e áudio)
- **Autenticação**: Email/senha + GitHub OAuth com sessões em PostgreSQL

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 16 ou TiDB
- Conta Stripe (com chaves de API)
- Conta OpenAI (opcional, para funcionalidades de IA)

## 🔧 Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd michels-travel
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com suas credenciais:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe Configuration (Test Mode)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...

# Stripe Configuration (Live Mode)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# OpenAI / AI Integrations
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Authentication & Security
SESSION_SECRET=<gere_um_segredo_aleatorio_com_minimo_32_caracteres>
ADMIN_PASSWORD=<sua_senha_admin_segura>

# Server Configuration
PORT=5000
```

### 4. Configure o banco de dados

Execute as migrações do Drizzle:

```bash
npm run db:push
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5000`

## 🔐 Segurança

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` no Git. Ele contém credenciais sensíveis.

### Gerando um SESSION_SECRET seguro

Use o Node.js para gerar um segredo aleatório:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Obtendo credenciais Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vá em **Developers** → **API keys**
3. Copie as chaves de teste (para desenvolvimento) e produção (para deploy)

### Obtendo credenciais OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Vá em **API keys**
3. Crie uma nova chave de API

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor em modo produção
- `npm run db:push` - Aplica as migrações do banco de dados

## 🏗️ Estrutura do Projeto

```
michels-travel/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
├── server/              # Backend Node.js
│   ├── db.ts           # Configuração do banco de dados
│   ├── routes.ts       # Rotas da API
│   ├── storage.ts      # Camada de acesso a dados
│   ├── stripeClient.ts # Cliente Stripe
│   ├── stripeService.ts # Serviços Stripe
│   └── replit_integrations/ # Integrações Replit
├── shared/             # Código compartilhado (schemas, tipos)
├── .env.example        # Template de variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
└── package.json        # Dependências e scripts
```

## 🌐 Deploy

### Deploy na Render

O repositório já inclui [`render.yaml`](./render.yaml) para criar o Web Service na Render com:

- `buildCommand`: `npm install --legacy-peer-deps && npm run build`
- `startCommand`: `npm run start`
- `healthCheckPath`: `/api/health`
- domínio principal: `www.michelstravel.agency`

#### Variáveis obrigatórias na Render

Configure no serviço da Render:

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_PASSWORD`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `STRIPE_LIVE_SECRET_KEY`
- `STRIPE_LIVE_PUBLISHABLE_KEY`
- `DUFFEL_LIVE_TOKEN`
- `AI_INTEGRATIONS_OPENAI_API_KEY`

Use [`.env.render`](./.env.render) como checklist. O arquivo [`.env.example`](./.env.example) continua sendo o template para desenvolvimento local.

#### Domínio customizado

Defina estes valores em produção:

- `APP_URL=https://www.michelstravel.agency`
- `GITHUB_CALLBACK_URL=https://www.michelstravel.agency/api/auth/github/callback`

Depois conecte `www.michelstravel.agency` em **Render > Settings > Custom Domains** e crie os registros DNS pedidos pela própria Render no provedor do domínio.

### Notas de produção

- O aplicativo aplica automaticamente os arquivos SQL da pasta `migrations/` no startup.
- Para desenvolvimento local, continue usando `npm run dev`.
- Em produção, a Render fornece `PORT` automaticamente; não defina essa variável manualmente no serviço.

## 📄 Licença

Este projeto é privado e proprietário.

## 🤝 Suporte

Para suporte, entre em contato através do email ou abra uma issue no repositório.
