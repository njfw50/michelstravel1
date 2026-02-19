# Guia de Deploy do Flight Commission Hub Mobile no Replit

## 📋 Pré-requisitos

- Conta no Replit
- Repositório GitHub já atualizado com o código mobile (✅ Concluído)
- Expo Go instalado no celular para testar o app

## 🚀 Passo a Passo para Deploy

### 1. Importar Repositório no Replit

1. Acesse https://replit.com
2. Clique em **"Create Repl"**
3. Selecione **"Import from GitHub"**
4. Cole a URL: `https://github.com/njfw50/flight-commission-hub`
5. Clique em **"Import from GitHub"**

### 2. Configurar Variáveis de Ambiente

No Replit, vá em **Tools → Secrets** e adicione:

```
DATABASE_URL=<sua_url_do_banco_postgresql>
JWT_SECRET=<gere_um_secret_aleatorio_seguro>
NODE_ENV=production
```

**Para gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Instalar Dependências do Mobile

No terminal do Replit:

```bash
cd mobile
pnpm install
```

### 4. Rodar Migrations do Banco de Dados

```bash
cd mobile
pnpm db:push
```

Isso criará todas as tabelas necessárias:
- mobile_users
- mobile_sessions
- push_tokens
- mobile_activity_log
- bookings
- payments
- conversations
- messages
- escalations

### 5. Criar Usuário Admin

Execute no terminal:

```bash
cd mobile
node -e "
const bcrypt = require('bcrypt');
const password = '112132cpF@';
bcrypt.hash(password, 10).then(hash => console.log('Hash:', hash));
"
```

Depois, insira no banco de dados:

```sql
INSERT INTO mobile_users (email, password_hash, full_name, role, is_active)
VALUES ('njfw23@gmail.com', '<hash_gerado>', 'Admin', 'admin', true);
```

### 6. Iniciar Servidor de Desenvolvimento

No Replit, configure o comando de start:

```bash
cd mobile && pnpm dev
```

Ou manualmente:

```bash
cd mobile
pnpm dev
```

Isso iniciará:
- **Metro Bundler** na porta 8081
- **API Backend** na porta 3000
- **WebSocket Server** integrado

### 7. Testar no Celular

1. **Abra o Expo Go** no seu celular
2. **Escaneie o QR code** que aparece no terminal do Replit
3. **Faça login** com:
   - Email: njfw23@gmail.com
   - Senha: 112132cpF@

## 📱 URLs do Projeto

Após o deploy no Replit, as URLs serão algo como:

- **Metro Bundler:** `https://<seu-repl>.replit.app:8081`
- **API Backend:** `https://<seu-repl>.replit.app:3000`
- **WebSocket:** `wss://<seu-repl>.replit.app:3000`

## ⚙️ Configuração Adicional

### Atualizar URLs no Código

Se as URLs do Replit forem diferentes, atualize em:

**mobile/lib/api-client.ts:**
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://<seu-repl>.replit.app:3000';
```

**mobile/lib/websocket-provider.tsx:**
```typescript
const WS_URL = process.env.EXPO_PUBLIC_API_URL || 'https://<seu-repl>.replit.app:3000';
```

### Configurar .env no Mobile

Crie `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://<seu-repl>.replit.app:3000
```

## 🎉 Pronto!

Seu app mobile está rodando no Replit e pronto para uso!

## 🔧 Troubleshooting

### Erro de conexão no celular

- Verifique se as URLs estão corretas
- Certifique-se de que o Replit está rodando
- Teste a API manualmente: `https://<seu-repl>.replit.app:3000/api/mobile/auth/me`

### Erro de autenticação

- Verifique se o usuário admin foi criado corretamente
- Teste o login via curl:
  ```bash
  curl -X POST https://<seu-repl>.replit.app:3000/api/mobile/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"njfw23@gmail.com","password":"112132cpF@"}'
  ```

### WebSocket não conecta

- Verifique se o servidor WebSocket está rodando
- Confira os logs do servidor no Replit
- Teste a conexão WebSocket manualmente

## 📚 Documentação Adicional

- **README Mobile:** `mobile/README_MOBILE.md`
- **Server README:** `mobile/server/README.md`
- **Design Doc:** `mobile/design.md`
- **TODO List:** `mobile/todo.md`
