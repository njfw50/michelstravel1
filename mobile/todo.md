# Flight Commission Hub Mobile - TODO

## Autenticação
- [ ] Tela de login com formulário
- [ ] Integração com API de autenticação do backend
- [ ] Armazenamento seguro de tokens (SecureStore)
- [ ] Refresh automático de tokens
- [ ] Logout e limpeza de sessão

## Dashboard
- [ ] Cards de métricas principais (receita, reservas, comissões, clientes)
- [ ] Gráfico de vendas dos últimos 7 dias
- [ ] Lista de atividades recentes
- [ ] Botão de ação rápida para nova reserva
- [ ] Pull-to-refresh

## Gestão de Reservas
- [ ] Lista de reservas com paginação
- [ ] Barra de busca e filtros (status, data, destino)
- [ ] Cards de reserva com informações resumidas
- [ ] Tela de detalhes da reserva
- [ ] Botão flutuante para nova reserva
- [ ] Formulário de nova reserva (multi-step)
- [ ] Busca de voos integrada
- [ ] Cálculo automático de comissão
- [ ] Editar reserva existente
- [ ] Cancelar reserva com confirmação
- [ ] Enviar recibo por email

## Sistema de Mensagens
- [ ] Lista de conversas com clientes
- [ ] Badge de mensagens não lidas
- [ ] Barra de busca de conversas
- [ ] Tela de chat com histórico
- [ ] Envio de mensagens em tempo real (WebSocket)
- [ ] Indicador de digitação
- [ ] Notificações de novas mensagens

## Notificações Push
- [ ] Registro de token push no backend
- [ ] Notificações de novas reservas
- [ ] Notificações de pagamentos confirmados
- [ ] Notificações de novas mensagens
- [ ] Notificações de escalações
- [ ] Histórico de notificações
- [ ] Marcar notificação como lida

## Analytics e Relatórios
- [ ] Seletor de período (hoje, semana, mês, ano)
- [ ] Cards de métricas (receita, reservas, comissões, conversão)
- [ ] Gráfico de receita por período
- [ ] Gráfico de reservas por destino
- [ ] Gráfico de métodos de pagamento
- [ ] Exportar relatório em PDF

## Pagamentos
- [ ] Lista de transações com filtros
- [ ] Visualizar detalhes do pagamento
- [ ] Processar reembolso
- [ ] Alternar entre modo teste e produção
- [ ] Visualizar e baixar recibos

## Escalações
- [ ] Lista de escalações do assistente de voz
- [ ] Badge de escalações novas
- [ ] Filtros por status
- [ ] Tela de detalhes da escalação
- [ ] Transcrição da chamada
- [ ] Ações: ligar cliente, enviar mensagem, resolver
- [ ] Marcar escalação como resolvida

## Perfil e Configurações
- [ ] Visualizar informações do usuário
- [ ] Configurações de notificações
- [ ] Alternar tema (light/dark)
- [ ] Sobre o app
- [ ] Logout

## APIs Backend
- [ ] API de autenticação mobile (/api/mobile/auth/*)
- [ ] API de dashboard (/api/mobile/dashboard/*)
- [ ] API de reservas (/api/mobile/bookings/*)
- [ ] API de busca de voos (/api/mobile/flights/*)
- [ ] API de pagamentos (/api/mobile/payments/*)
- [ ] API de mensagens (/api/mobile/messages/*)
- [ ] API de notificações (/api/mobile/notifications/*)
- [ ] API de analytics (/api/mobile/analytics/*)
- [ ] API de escalações (/api/mobile/escalations/*)
- [ ] WebSocket para mensagens em tempo real

## Banco de Dados
- [ ] Tabela mobile_sessions (sessões de autenticação)
- [ ] Tabela push_tokens (tokens de notificação)
- [ ] Tabela mobile_activity_log (log de atividades)

## Componentes Reutilizáveis
- [ ] StatCard (card de métrica)
- [ ] BookingCard (card de reserva)
- [ ] MessagePreview (preview de conversa)
- [ ] ChatBubble (bolha de mensagem)
- [ ] MetricChart (gráfico)
- [ ] FilterBar (barra de filtros)
- [ ] ActionButton (botão flutuante)
- [ ] StatusBadge (badge de status)
- [ ] EmptyState (estado vazio)

## Testes e Qualidade
- [ ] Testes de integração com backend
- [ ] Validação de fluxos completos
- [ ] Testes de notificações push
- [ ] Testes de WebSocket
- [ ] Verificação de performance

## Branding e Assets
- [x] Gerar logo personalizado do app
- [x] Atualizar ícone do app
- [x] Configurar splash screen
- [x] Atualizar nome do app em app.config.ts

## Documentação
- [ ] README com instruções de setup
- [ ] Documentação de APIs
- [ ] Guia de uso do app


## Progresso Atual

### Concluído
- [x] Estrutura do projeto inicializada
- [x] Sistema de autenticação com login
- [x] Armazenamento seguro de tokens
- [x] Layout raiz com verificação de autenticação
- [x] Dashboard com métricas principais
- [x] Cards de estatísticas (StatCard)
- [x] Componente de atividades recentes
- [x] Tela de reservas (estrutura básica)
- [x] Tela de mensagens (estrutura básica)
- [x] Tela de analytics (estrutura básica)
- [x] Navegação por tabs
- [x] Cliente API configurado
- [x] Tipos TypeScript definidos
- [x] Pull-to-refresh no dashboard
- [x] Logout funcional

### Em Desenvolvimento
- [ ] Integração com APIs reais do backend
- [ ] Lista de reservas com dados reais
- [ ] Sistema de mensagens em tempo real
- [ ] Notificações push
- [ ] Analytics com gráficos


## Novas Tarefas - Implementação Backend

### APIs de Autenticação
- [x] Criar tabela mobile_users no banco de dados
- [x] Criar tabela mobile_sessions no banco de dados
- [x] Criar tabela push_tokens no banco de dados
- [x] Criar tabela mobile_activity_log no banco de dados
- [x] Implementar POST /api/mobile/auth/login com hash de senha
- [x] Implementar POST /api/mobile/auth/refresh para refresh tokens
- [x] Implementar POST /api/mobile/auth/logout
- [x] Implementar GET /api/mobile/auth/me para dados do usuário
- [x] Criar usuário admin com email njfw23@gmail.com
- [x] Testar login com credenciais do admin

### APIs de Dashboard
- [x] Implementar GET /api/mobile/dashboard/stats
- [x] Implementar GET /api/mobile/dashboard/recent-activity

### APIs de Reservas
- [x] Criar tabela bookings no banco de dados
- [x] Implementar GET /api/mobile/bookings (com paginação e filtros)
- [x] Implementar GET /api/mobile/bookings/:id
- [x] Implementar POST /api/mobile/bookings
- [x] Implementar PUT /api/mobile/bookings/:id
- [x] Implementar DELETE /api/mobile/bookings/:id

### APIs de Pagamentos
- [x] Criar tabela payments no banco de dados
- [x] Implementar POST /api/mobile/payments
- [x] Implementar POST /api/mobile/payments/:id/refund

### APIs de Mensagens
- [x] Criar tabelas conversations e messages no banco de dados
- [x] Implementar GET /api/mobile/messages (conversas)
- [x] Implementar GET /api/mobile/messages/:conversationId
- [x] Implementar POST /api/mobile/messages
- [x] Implementar PUT /api/mobile/messages/:conversationId/read
- [ ] Configurar WebSocket para mensagens em tempo real

### APIs de Notificações
- [x] Implementar POST /api/mobile/notifications/register

### APIs de Escalações
- [x] Criar tabela escalations no banco de dados
- [x] Implementar GET /api/mobile/escalations
- [x] Implementar GET /api/mobile/escalations/:id
- [x] Implementar PUT /api/mobile/escalations/:id/resolve


## Nova Funcionalidade - WebSocket em Tempo Real

### Backend WebSocket
- [x] Instalar socket.io no servidor
- [x] Criar servidor WebSocket com autenticação JWT
- [x] Implementar eventos de mensagens (message:new, message:read, typing:start, typing:stop)
- [x] Implementar eventos de reservas (booking:created, booking:updated, booking:cancelled)
- [x] Implementar eventos de pagamentos (payment:completed, payment:refunded)
- [x] Implementar eventos de escalações (escalation:created, escalation:resolved)
- [x] Criar sistema de rooms por usuário e conversa
- [x] Adicionar middleware de autenticação WebSocket
- [x] Integrar WebSocket ao servidor Express

### Frontend Mobile WebSocket
- [x] Instalar socket.io-client no app mobile
- [x] Criar hook useWebSocket para gerenciar conexão
- [x] Criar WebSocketProvider para prover conexão globalmente
- [x] Conectar ao servidor WebSocket com token JWT
- [x] Implementar listeners de eventos em tempo real (useWebSocketEvent)
- [x] Adicionar indicador de conexão (isConnected)
- [x] Implementar reconexão automática
- [x] Adicionar WebSocketProvider ao layout raiz
- [ ] Atualizar tela de mensagens para usar WebSocket
- [ ] Testar envio e recebimento de mensagens em tempo real


## Bug Fix - Erro de Conexão em Dispositivo Físico

### Problema
- [ ] App não consegue conectar à API quando rodando em celular físico
- [ ] Erro "network error" ao tentar fazer login
- [ ] localhost:3000 não funciona em dispositivo real

### Solução
- [x] Configurar URL da API para usar túnel público do Manus
- [x] Atualizar API client para usar URL pública
- [x] Atualizar WebSocket client para usar mesma URL da API
- [ ] Testar login no celular físico
- [ ] Verificar conexão WebSocket no dispositivo real


## Implementação Completa - Todas as Funcionalidades

### Dados de Exemplo
- [ ] Inserir reservas de exemplo no banco
- [ ] Inserir conversas e mensagens de exemplo
- [ ] Inserir escalações de exemplo
- [ ] Inserir pagamentos de exemplo

### Dashboard Funcional
- [ ] Conectar dashboard com API GET /api/mobile/dashboard/stats
- [ ] Conectar atividades recentes com API
- [ ] Adicionar refresh automático a cada 30 segundos
- [ ] Adicionar pull-to-refresh
- [ ] Escutar eventos WebSocket para atualização em tempo real

### Tela de Reservas (Bookings)
- [ ] Conectar listagem com API GET /api/mobile/bookings
- [ ] Implementar filtros por status (pending, confirmed, completed, cancelled)
- [ ] Implementar busca por cliente ou número de voo
- [ ] Implementar tela de detalhes da reserva
- [ ] Implementar criação de nova reserva
- [ ] Implementar edição de reserva
- [ ] Implementar cancelamento de reserva
- [ ] Adicionar pull-to-refresh

### Tela de Mensagens (Chat)
- [ ] Conectar listagem de conversas com API
- [ ] Implementar tela de chat individual
- [ ] Integrar WebSocket para mensagens em tempo real
- [ ] Implementar envio de mensagens
- [ ] Implementar indicador de "digitando..."
- [ ] Implementar marcação de lidas
- [ ] Adicionar timestamp nas mensagens
- [ ] Adicionar scroll automático para última mensagem

### Tela de Analytics
- [ ] Conectar com API de analytics (criar endpoint se necessário)
- [ ] Implementar gráfico de receita mensal
- [ ] Implementar gráfico de reservas por status
- [ ] Implementar gráfico de comissões
- [ ] Adicionar filtros de período (semana, mês, ano)


## Deploy no GitHub e Replit

### Git e GitHub
- [x] Clonar repositório njfw50/flight-commission-hub
- [x] Verificar estrutura atual do repositório
- [x] Copiar código do app mobile para o repositório (pasta /mobile)
- [x] Fazer git add de todos os arquivos
- [x] Fazer git commit com mensagem descritiva
- [x] Fazer git push para GitHub
- [x] Push bem sucedido - 143 arquivos enviados

### Deploy no Replit
- [ ] Orientar usuário sobre como importar do GitHub no Replit
- [ ] Verificar se variáveis de ambiente estão configuradas
- [ ] Testar app no Replit após deploy


## Bug Fix - Erro de Refresh Token no Login

### Problema
- [ ] Erro "no refresh token available" ao fazer login
- [ ] Tokens não estão sendo salvos corretamente no SecureStore
- [ ] API client tenta renovar token mas não encontra refresh token

### Solução
- [x] Verificar se login está salvando accessToken e refreshToken
- [x] Adicionar flag para ignorar refresh em rotas de autenticação (/auth/login, /auth/refresh)
- [x] Ajustar interceptor do axios para não tentar refresh durante login
- [x] Adicionar logs para debug do fluxo de autenticação
- [x] Limpar refreshSubscribers após erro de refresh
- [ ] Testar fluxo completo de login no celular
- [ ] Verificar se tokens persistem após reiniciar app


## Bug Fix - Erro 401 no Login

### Problema
- [ ] Erro "request failed with status code 401" ao tentar fazer login
- [ ] Possíveis causas: usuário não existe, senha incorreta, API não funcionando

### Diagnóstico
- [x] Verificar se usuário admin existe na tabela mobile_users - OK, existe
- [x] Testar API /api/mobile/auth/login com curl - OK, retorna 200
- [x] Verificar logs do servidor - Encontrado: email com "n" extra (njfw23@gmail.comn)
- [x] Causa identificada: Usuário digitou caractere extra no celular

### Solução
- [x] Adicionar trim() no email e senha para remover espaços e caracteres extras
- [ ] Testar login novamente no celular


## Push para GitHub - Atualizar Repositório

### Tarefas
- [ ] Copiar código atualizado para repositório local
- [ ] Fazer git add de todos os arquivos modificados
- [ ] Fazer git commit com mensagem descritiva das correções
- [ ] Fazer git push para GitHub
- [ ] Verificar se push foi bem sucedido
