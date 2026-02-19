# Design do Flight Commission Hub - Admin Mobile App

## Orientação e Uso
O aplicativo é projetado para **orientação portrait (9:16)** e **uso com uma mão**, seguindo as diretrizes do Apple Human Interface Guidelines (HIG) para proporcionar uma experiência nativa e intuitiva.

## Paleta de Cores
- **Primary**: `#0a7ea4` - Azul vibrante para ações principais e destaques
- **Background**: `#ffffff` (light) / `#151718` (dark) - Fundo principal das telas
- **Surface**: `#f5f5f5` (light) / `#1e2022` (dark) - Cards e superfícies elevadas
- **Foreground**: `#11181C` (light) / `#ECEDEE` (dark) - Texto principal
- **Muted**: `#687076` (light) / `#9BA1A6` (dark) - Texto secundário
- **Success**: `#22C55E` - Estados de sucesso (pagamentos confirmados, reservas ativas)
- **Warning**: `#F59E0B` - Alertas e pendências
- **Error**: `#EF4444` - Erros e cancelamentos

## Lista de Telas

### 1. Tela de Login (Auth)
**Conteúdo**: Formulário de autenticação com email e senha, logo do app, botão de login.
**Funcionalidade**: Autenticação segura com JWT, armazenamento de credenciais no SecureStore.

### 2. Dashboard (Home - Tab Principal)
**Conteúdo**: 
- Cards com métricas principais: receita do dia, reservas ativas, comissões pendentes, novos clientes
- Gráfico de vendas dos últimos 7 dias
- Lista de atividades recentes (últimas 5)
- Botão de ação rápida para nova reserva

**Funcionalidade**: Visão geral em tempo real das operações, navegação rápida para outras seções.

### 3. Reservas (Bookings - Tab)
**Conteúdo**:
- Barra de busca e filtros (status, data, destino)
- Lista de reservas com cards mostrando: código de referência, cliente, rota, data, valor, status
- Pull-to-refresh para atualizar
- Botão flutuante (+) para nova reserva

**Funcionalidade**: Visualizar, buscar e filtrar todas as reservas. Tocar em um card abre os detalhes.

### 4. Detalhes da Reserva
**Conteúdo**:
- Informações completas do voo: origem, destino, datas, horários
- Dados do cliente: nome, email, telefone
- Informações de pagamento: valor, status, método
- Comissão calculada
- Código de referência
- Botões de ação: editar, cancelar, enviar recibo, contatar cliente

**Funcionalidade**: Visualizar e gerenciar uma reserva específica.

### 5. Nova Reserva
**Conteúdo**:
- Formulário multi-step:
  - Step 1: Busca de voos (origem, destino, datas)
  - Step 2: Seleção do voo
  - Step 3: Dados do cliente
  - Step 4: Pagamento e confirmação
- Indicador de progresso
- Botões de navegação (voltar, próximo, confirmar)

**Funcionalidade**: Criar nova reserva com busca de voos integrada e cálculo automático de comissão.

### 6. Mensagens (Messages - Tab)
**Conteúdo**:
- Lista de conversas com clientes
- Cada item mostra: avatar, nome do cliente, última mensagem, timestamp, badge de não lidas
- Barra de busca

**Funcionalidade**: Visualizar todas as conversas. Tocar abre o chat.

### 7. Chat com Cliente
**Conteúdo**:
- Histórico de mensagens (estilo WhatsApp)
- Input de texto com botão de envio
- Indicador de digitação
- Informações do cliente no header

**Funcionalidade**: Comunicação em tempo real via WebSocket, notificações de novas mensagens.

### 8. Analytics (Tab)
**Conteúdo**:
- Seletor de período (hoje, semana, mês, ano)
- Cards com métricas:
  - Receita total
  - Total de reservas
  - Comissões ganhas
  - Taxa de conversão
- Gráficos:
  - Receita por período (linha)
  - Reservas por destino (barra)
  - Métodos de pagamento (pizza)
- Botão de exportar relatório (PDF)

**Funcionalidade**: Visualização de métricas e analytics com filtros de período.

### 9. Pagamentos
**Conteúdo**:
- Lista de transações com filtros (período, status, método)
- Cada item mostra: cliente, valor, método, status, data
- Indicadores visuais de status (pago, pendente, reembolsado)
- Botão de alternar modo (teste/produção)

**Funcionalidade**: Histórico de pagamentos, processar reembolsos, visualizar recibos.

### 10. Escalações
**Conteúdo**:
- Lista de escalações do assistente de voz
- Cada item mostra: cliente, motivo, timestamp, status
- Badge de "novo" para não visualizadas
- Filtros por status

**Funcionalidade**: Visualizar e resolver escalações de atendimento.

### 11. Detalhes da Escalação
**Conteúdo**:
- Transcrição da chamada
- Motivo da escalação
- Dados do cliente
- Histórico de interações
- Botões de ação: ligar cliente, enviar mensagem, resolver

**Funcionalidade**: Gerenciar escalação específica.

### 12. Perfil/Configurações (Acessível via header)
**Conteúdo**:
- Informações do usuário
- Configurações de notificações
- Preferências do app (tema, idioma)
- Sobre o app
- Botão de logout

**Funcionalidade**: Gerenciar perfil e configurações do app.

## Fluxos Principais de Usuário

### Fluxo 1: Criar Nova Reserva
1. Usuário toca no botão (+) na tela de Reservas
2. Preenche origem, destino e datas → Buscar
3. Visualiza lista de voos disponíveis → Seleciona um voo
4. Preenche dados do cliente (nome, email, telefone)
5. Confirma pagamento (Stripe)
6. Reserva criada → Notificação de sucesso → Volta para lista de reservas

### Fluxo 2: Responder Mensagem de Cliente
1. Notificação push de nova mensagem → Usuário toca
2. App abre diretamente no chat com o cliente
3. Usuário lê mensagem e digita resposta
4. Envia mensagem → Cliente recebe em tempo real
5. Histórico atualizado

### Fluxo 3: Resolver Escalação
1. Notificação push de nova escalação → Usuário toca
2. App abre detalhes da escalação
3. Usuário lê transcrição e motivo
4. Escolhe ação: ligar cliente, enviar mensagem ou resolver
5. Marca como resolvida → Escalação removida da lista

### Fluxo 4: Visualizar Analytics
1. Usuário toca na tab Analytics
2. Visualiza métricas do período atual (padrão: mês)
3. Altera período usando seletor
4. Gráficos e cards atualizam automaticamente
5. Toca em "Exportar" → PDF gerado e compartilhado

## Componentes Reutilizáveis

- **StatCard**: Card de métrica com ícone, título, valor e variação percentual
- **BookingCard**: Card de reserva com informações resumidas
- **MessagePreview**: Preview de conversa com avatar, nome, última mensagem
- **ChatBubble**: Bolha de mensagem (enviada/recebida)
- **MetricChart**: Componente de gráfico reutilizável (linha, barra, pizza)
- **FilterBar**: Barra de filtros com chips
- **ActionButton**: Botão flutuante de ação principal
- **StatusBadge**: Badge de status com cores semânticas
- **EmptyState**: Estado vazio com ilustração e mensagem

## Navegação

### Tab Bar (Bottom)
- **Home**: Dashboard
- **Reservas**: Lista de reservas
- **Mensagens**: Conversas com clientes
- **Analytics**: Métricas e relatórios

### Stack Navigation
- Detalhes da Reserva (push from Reservas)
- Nova Reserva (modal from Reservas)
- Chat (push from Mensagens)
- Pagamentos (push from Dashboard ou menu)
- Escalações (push from Dashboard ou notificação)
- Perfil/Configurações (push from header)

## Interações e Feedback

- **Haptic Feedback**: Toque leve em botões primários, médio em toggles
- **Loading States**: Skeleton screens para listas, spinners para ações
- **Pull-to-Refresh**: Disponível em todas as listas
- **Swipe Actions**: Swipe em items de lista para ações rápidas (arquivar mensagem, cancelar reserva)
- **Toasts**: Mensagens de sucesso/erro temporárias no topo da tela
- **Confirmações**: Modais para ações destrutivas (cancelar reserva, processar reembolso)
