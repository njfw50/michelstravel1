# Michel's Travel — página simples para Cloudflare

Uma página responsiva com o logotipo oficial intacto e o slogan **Opção Eficiente**. Projeto independente dentro de `cloudflare-simple/`; não modifica o servidor nem a aplicação atuais.

## O que está pronto

- Busca de voos Duffel para um a nove adultos, só ida ou ida e volta, com escolha de classe.
- Resultados com valor total acrescido da taxa de serviço configurada, horários locais, conexões, trechos, bagagem e regras informadas pelo fornecedor.
- Reconsulta da oferta antes do envio; preços alterados exigem nova revisão, ofertas expiradas são recusadas.
- Solicitação de atendimento para reserva registrada no D1, com protocolo e código privado para acompanhar status.
- Painel `/admin.html` com acesso privado para consultar os 100 pedidos mais recentes e marcar atendimento/encerramento.
- Turnstile validado no servidor para busca, envio e consulta. Segredos nunca vão ao navegador.
- Modo de teste visível e separado da configuração de produção. Não usa fallback de token de teste em produção.

## Limite funcional essencial

**Solicitação de reserva não é uma reserva emitida ou garantida.** Não cria pedidos Duffel, não cobra cartão, não cria pagamento Stripe e não envia e-mails automaticamente. O cliente recebe seu protocolo na tela e pode baixá-lo. A agência precisa abrir o painel e continuar o atendimento. Crianças, múltiplos destinos, emissão automática, pagamentos, gestão de bilhetes e reservas antigas do sistema principal estão fora desta versão.

A busca usa a mesma Duffel e o mesmo padrão de margem (8,5% por padrão) do repositório original, por meio de um adaptador HTTP próprio para Workers. Não utiliza Expedia TAAP e não representa tarifas de agente TAAP. O PostgreSQL e os registros antigos não são migrados. D1 armazena apenas novas solicitações deste projeto.

## Hospedagem sem mensalidade inicial

Usar **Workers Free com Static Assets e D1 Free**. A página e a API ficam no mesmo domínio, sem servidor Express, container ou serviço Render. Uma URL `workers.dev` evita comprar um domínio. Cloudflare Pages separado não é necessário. Não ativar Workers Paid, upgrades automáticos ou recursos pagos para esta implantação.

Planos gratuitos têm limites; não é garantia de custo zero em qualquer volume. Duffel pode exigir ativação comercial, saldo ou cobrar conforme o contrato da agência. Taxas de emissão e pagamentos futuros são independentes da hospedagem. Este projeto não promete eliminar esses custos.

## Publicação — configuração necessária

É necessário acesso à conta Cloudflare, à conta Duffel e aos segredos existentes. Não copie chaves de repositórios públicos e não envie senhas/tokens em chats, issues ou commits.

1. Instale Node.js 22 ou superior. Dentro de `cloudflare-simple`, execute `npm ci`, `npm test` e `npx wrangler login`.
2. Crie o banco: `npx wrangler d1 create michels-travel-simple`. Copie o `database_id` retornado para **ambos** os bindings D1 em `wrangler.jsonc`.
3. Crie um widget Turnstile no painel Cloudflare para o domínio final do Worker. Coloque a chave pública real em `env.production.vars.TURNSTILE_SITE_KEY`. A chave secreta fica somente em secrets.
4. Configure os secrets de produção, pelos prompts interativos:

   ```sh
   npx wrangler secret put DUFFEL_LIVE_TOKEN --env production
   npx wrangler secret put TURNSTILE_SECRET_KEY --env production
   npx wrangler secret put ADMIN_TOKEN --env production
   ```

   O token Duffel deve ser live e a conta precisa estar habilitada para consultas reais. Gere uma chave administrativa aleatória de no mínimo 32 caracteres em um gerenciador de senhas; guarde-a para abrir `/admin.html`. Não use a senha de outra conta.
5. Confirme a margem em `env.production.vars.MARKUP_RATE`. O padrão `0.085` equivale a 8,5% sobre o total Duffel. Não é a comissão recebida de outro fornecedor.
6. Aplique o banco: `npx wrangler d1 migrations apply michels-travel-simple --remote --env production`.
7. Publique: `npm run deploy`. Verifique a URL que o Wrangler retornar. Autorize esse hostname no widget Turnstile.
8. Faça uma busca e uma solicitação autorizadas, confira o protocolo, abra `/admin.html` e consulte o registro. Teste o acompanhamento com o código certo e um código errado.

Não copie a `.env` da aplicação principal para a pasta pública. Não são necessárias chaves Stripe, OpenAI, PostgreSQL ou sessão do sistema antigo.

### Ambiente de teste

Copie `.dev.vars.example` para `.dev.vars`, configure um `DUFFEL_API_TOKEN` de teste e um `ADMIN_TOKEN` aleatório. `npx wrangler d1 migrations apply michels-travel-simple --local` prepara o D1 local; `npm run dev` inicia em localhost. A chave Turnstile de exemplo é **somente para testes locais**. Publicação no domínio `workers.dev` com essa chave é bloqueada pelo servidor. Para testar num domínio público, substitua por um widget real também na configuração de teste e configure o secret correspondente.

### Operação da agência

- Consulte o painel regularmente; não há notificação automática nem automação de contato.
- A chave administrativa fica apenas na memória da aba e é enviada por header; não use dispositivos públicos. Use “Sair” ao terminar.
- O protocolo e o código privado só são exibidos ao concluir a solicitação. Se forem perdidos, o cliente pode contatar a agência; esta versão não tem recuperação automatizada.
- O status “Em atendimento” não comprova pagamento ou emissão. Não marque uma solicitação como emitida usando este painel.
- Exclua dados quando necessário usando o D1 e o protocolo com uma consulta SQL parametrizada; não há política automática de retenção nesta versão. Mantenha a política pública atualizada se mudar a operação.
- Turnstile ajuda a reduzir abuso, mas não substitui monitoramento de cotas ou controles comerciais do fornecedor. Configure limites e alertas na conta Duffel antes de liberar busca pública.

## Validação

`npm test` cobre entrada inválida, normalização de oferta, consulta, preço alterado, expiração, falha do fornecedor, bloqueio de origem externa, validação Turnstile, registro de solicitação, proteção da consulta e autenticação administrativa. Não realiza chamadas reais nem cria reservas ou cobranças.

`npm run check:deploy` valida o empacotamento com Wrangler sem publicar. Os IDs e chaves indicados com `CONFIGURE_` são pontos de configuração obrigatórios, não credenciais.

Referências: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/), [D1](https://developers.cloudflare.com/d1/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Duffel offer requests](https://duffel.com/docs/api/v2/offer-requests/create-offer-request).
