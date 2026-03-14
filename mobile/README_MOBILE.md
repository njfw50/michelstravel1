# Michels Travel Senior - Mobile App

Aplicativo mobile da Michels Travel Senior para uma experiencia de viagem mais simples, calma e segura no celular.

## 📱 Sobre o Aplicativo

O **Flight Commission Hub Mobile** é um aplicativo Android/iOS desenvolvido com React Native e Expo que oferece aos administradores e agentes acesso completo às funcionalidades do sistema de gerenciamento de comissões de voos.

### Principais Funcionalidades

- **Dashboard Interativo**: Visualização em tempo real de métricas principais (receita, reservas ativas, comissões, novos clientes)
- **Gestão de Reservas**: Criar, visualizar, editar e cancelar reservas de voos
- **Sistema de Mensagens**: Chat em tempo real com clientes via WebSocket
- **Notificações Push**: Alertas instantâneos para novos pedidos, pagamentos e mensagens
- **Analytics**: Gráficos e relatórios detalhados de performance
- **Gerenciamento de Pagamentos**: Visualizar transações, processar reembolsos via Stripe
- **Escalações**: Gerenciar solicitações do assistente de voz que precisam de intervenção humana
- **Autenticação Segura**: Login com JWT e armazenamento seguro de credenciais

## 🚀 Tecnologias Utilizadas

- **React Native 0.81** com **Expo SDK 54**
- **TypeScript 5.9** para type safety
- **Expo Router 6** para navegação
- **NativeWind 4** (Tailwind CSS para React Native)
- **Zustand** para gerenciamento de estado
- **TanStack Query** para cache e sincronização de dados
- **Axios** para requisições HTTP
- **Expo SecureStore** para armazenamento seguro de tokens
- **React Native Reanimated 4** para animações

## 📦 Estrutura do Projeto

```
flight-commission-hub-mobile/
├── app/                          # Rotas do aplicativo (Expo Router)
│   ├── (auth)/                   # Telas de autenticação
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Telas principais com navegação por tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Dashboard
│   │   ├── bookings.tsx          # Reservas
│   │   ├── messages.tsx          # Mensagens
│   │   └── analytics.tsx         # Analytics
│   └── _layout.tsx               # Layout raiz com providers
├── components/                   # Componentes reutilizáveis
│   ├── dashboard/
│   │   ├── stat-card.tsx         # Card de métrica
│   │   └── activity-item.tsx    # Item de atividade recente
│   ├── screen-container.tsx      # Container com SafeArea
│   └── ui/
│       └── icon-symbol.tsx       # Ícones
├── hooks/                        # Custom hooks
│   ├── use-auth-custom.ts        # Hook de autenticação
│   ├── use-colors.ts             # Hook de cores do tema
│   └── use-color-scheme.ts       # Hook de detecção de tema
├── lib/                          # Utilitários e configurações
│   ├── api-client.ts             # Cliente HTTP com interceptors
│   ├── utils.ts                  # Funções utilitárias
│   ├── theme-provider.tsx        # Provider de tema
│   └── trpc.ts                   # Cliente tRPC
├── types/                        # Definições de tipos TypeScript
│   └── index.ts
├── assets/                       # Assets estáticos
│   └── images/
│       ├── icon.png              # Ícone do app
│       ├── splash-icon.png       # Ícone da splash screen
│       └── favicon.png           # Favicon
├── app.config.ts                 # Configuração do Expo
├── tailwind.config.js            # Configuração do Tailwind
├── theme.config.js               # Paleta de cores
└── package.json
```

## 🎨 Design

O aplicativo segue as diretrizes do **Apple Human Interface Guidelines (HIG)** para proporcionar uma experiência nativa e intuitiva:

- **Orientação**: Portrait (9:16) otimizado para uso com uma mão
- **Paleta de Cores**:
  - Primary: `#0a7ea4` (Azul vibrante)
  - Success: `#22C55E` (Verde)
  - Warning: `#F59E0B` (Laranja)
  - Error: `#EF4444` (Vermelho)
- **Tipografia**: SF Pro (iOS) / Roboto (Android)
- **Componentes**: Cards elevados, bordas arredondadas, sombras sutis

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 22.x
- pnpm 9.x
- Expo Go app instalado no dispositivo móvel (para testes)

### Instalação

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Ou separadamente:
pnpm dev:server  # Backend
pnpm dev:metro   # Metro bundler
```

### Testar no Dispositivo

1. Instale o **Expo Go** no seu dispositivo Android/iOS
2. Execute `pnpm dev` no terminal
3. Escaneie o QR code exibido no terminal com o Expo Go
4. O app será carregado no seu dispositivo

## 🔐 Autenticação

O app utiliza autenticação JWT com refresh tokens:

1. Usuário faz login com email e senha
2. Backend retorna `accessToken` e `refreshToken`
3. Tokens são armazenados de forma segura no `SecureStore`
4. `accessToken` é enviado em todas as requisições via header `Authorization`
5. Quando `accessToken` expira, o `refreshToken` é usado automaticamente para obter um novo
6. Se o `refreshToken` também expirar, usuário é redirecionado para login

## 📡 Integração com Backend

O app se comunica com o backend do Flight Commission Hub através de uma API REST:

- **Base URL**: Configurável via `EXPO_PUBLIC_API_URL` (padrão: `https://flight-commission-hub.replit.app`)
- **Endpoints**: `/api/mobile/*`
- **Autenticação**: Bearer token no header

### Principais Endpoints

```
POST   /api/mobile/auth/login          # Login
POST   /api/mobile/auth/refresh        # Refresh token
POST   /api/mobile/auth/logout         # Logout
GET    /api/mobile/dashboard/stats     # Estatísticas do dashboard
GET    /api/mobile/bookings            # Lista de reservas
POST   /api/mobile/bookings            # Criar reserva
GET    /api/mobile/messages            # Conversas
POST   /api/mobile/messages            # Enviar mensagem
GET    /api/mobile/analytics           # Dados de analytics
POST   /api/mobile/notifications/register  # Registrar token push
```

## 🔔 Notificações Push

O app suporta notificações push usando Expo Notifications:

1. Ao fazer login, o app registra o token push no backend
2. Backend envia notificações para eventos importantes:
   - Nova reserva confirmada
   - Pagamento recebido
   - Nova mensagem de cliente
   - Escalação pendente
3. Usuário pode tocar na notificação para abrir a tela correspondente

## 📊 Estado Atual do Desenvolvimento

### ✅ Implementado

- [x] Estrutura do projeto e configuração
- [x] Sistema de autenticação completo
- [x] Dashboard com métricas e atividades recentes
- [x] Navegação por tabs
- [x] Telas de Reservas, Mensagens e Analytics (estrutura)
- [x] Cliente API com interceptors e refresh automático
- [x] Gerenciamento de estado com Zustand
- [x] Tema claro/escuro
- [x] Logo personalizado
- [x] Pull-to-refresh

### 🚧 Em Desenvolvimento

- [ ] Integração completa com APIs reais do backend
- [ ] Lista de reservas com dados reais e filtros
- [ ] Sistema de mensagens em tempo real (WebSocket)
- [ ] Notificações push funcionais
- [ ] Gráficos de analytics
- [ ] Formulário de nova reserva
- [ ] Detalhes de reserva
- [ ] Gerenciamento de pagamentos
- [ ] Escalações

### 📋 Próximos Passos

1. **Backend APIs**: Implementar endpoints `/api/mobile/*` no servidor do Flight Commission Hub
2. **WebSocket**: Configurar servidor WebSocket para mensagens em tempo real
3. **Push Notifications**: Configurar Expo Push Notification Service
4. **Testes**: Adicionar testes unitários e de integração
5. **Build**: Gerar builds para Android (.apk/.aab) e iOS (.ipa)

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Verificar tipos TypeScript
pnpm check

# Lint
pnpm lint
```

## 📱 Build e Deploy

### Android

```bash
# Build de desenvolvimento
eas build --platform android --profile development

# Build de produção
eas build --platform android --profile production
```

### iOS

```bash
# Build de desenvolvimento
eas build --platform ios --profile development

# Build de produção
eas build --platform ios --profile production
```

## 🤝 Contribuindo

Este é um projeto privado para gerenciamento interno do Flight Commission Hub.

## 📄 Licença

Propriedade privada - Todos os direitos reservados.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o aplicativo, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando React Native e Expo**
