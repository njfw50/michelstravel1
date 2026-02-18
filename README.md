# Michels Travel - Flight Commission Hub

Sistema de gestão de reservas e comissões de voos desenvolvido com React, TypeScript, Node.js e integração com Stripe.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (compatível com TiDB)
- **ORM**: Drizzle
- **Pagamentos**: Stripe
- **IA**: OpenAI API (para chat, imagens e áudio)
- **Autenticação**: JWT + Replit Auth

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

### Deploy no Replit

O projeto está configurado para deploy automático no Replit. As variáveis de ambiente são gerenciadas através dos Secrets do Replit.

### Deploy em outros ambientes

1. Configure as variáveis de ambiente no seu provedor de hospedagem
2. Execute `npm run build` para compilar o projeto
3. Execute `npm run start` para iniciar o servidor
4. Configure um proxy reverso (nginx/Apache) se necessário

## 📄 Licença

Este projeto é privado e proprietário.

## 🤝 Suporte

Para suporte, entre em contato através do email ou abra uma issue no repositório.
