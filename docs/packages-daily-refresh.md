# Rotina diária — atualização de preços dos pacotes (`/pacotes`)

**Fonte única da verdade:** Expedia TAAP. **Arquivo:** `client/src/data/packages.json`.
**Regra fail-closed (Cân. XXIII):** preço sem verificação fresca (≤ 2 dias
corridos) NÃO aparece — o cartão mostra "Preço a reconfirmar" e o botão vira
pedido de reconfirmação no WhatsApp. A vitrine esvazia sozinha se a rotina
parar. Isso é proposital.

## Passo a passo diário (ligado ao drip diário existente)

1. **Recheck no TAAP** — para cada pacote em `packages.json`, cotar de novo
   as mesmas datas, mesmo hotel, 2 pessoas, no Expedia TAAP. Anotar o total
   novo, a data/hora da cotação e qualquer mudança (hotel, noites, taxas).
2. **Atualizar o JSON** — para cada pacote:
   - `price.amount` = total novo para 2 pessoas (nunca "a partir de");
   - `verifiedAt` = data de HOJE (`YYYY-MM-DD`);
   - `verifiedSource` = `"Expedia TAAP"` (manter);
   - se o hotel mudou de nome/estrelas/nota, atualizar `hotel.*`;
   - se as datas do pacote mudaram, atualizar `dates.*` e `nights`
     (noites = data de volta − data de ida; conferir a conta — o seed
     trouxe uma divergência: Terra Santa dizia "6 noites" para 5–12/jan,
     que são 7 noites; corrigido para 7, a confirmar no recheck);
   - se o pacote não existe mais naquela tarifa, NÃO apagar o preço velho
     e manter — remover o pacote do array `packages` OU deixá-lo e ele
     cairá sozinho para "a reconfirmar" em 2 dias. Preferir remover com
     uma linha no commit explicando o motivo.
3. **Novos pacotes** — só entram com: destino, datas ISO, noites, hotel
   (nome + estrelas + nota na escala informada), total para 2 pessoas,
   `verifiedAt` = hoje, `verifiedSource` = `"Expedia TAAP"`, e foto real
   do destino (ou `"generic-sunset-wing"` até a arte chegar — nunca foto
   de outro destino). Pacote sem hotel confirmado NÃO entra (ver
   `pending[]` no JSON: Londres aguarda hotel + recheck).
4. **Conferir o JSON** — `node -e "JSON.parse(require('fs').readFileSync('client/src/data/packages.json','utf8'))"`
   tem que passar; nenhuma data futura em `verifiedAt`; nenhum preço sem
   `verifiedAt`.
5. **Commit + push na branch de trabalho** — mensagem: `chore(packages): recheck TAAP <data> — <n> pacotes atualizados`.
   O deploy do preview acontece pelo Workers Build; **nada vai para o
   .com sem a aprovação expressa do Michel**.
6. **Conferir o preview** — abrir `/pacotes` no preview, ver se cada cartão
   mostra o preço + "verificado em [data de hoje]". Pacote que aparecer
   como "a reconfirmar" sem motivo é sinal de erro no passo 2.

## Quem faz

Hoje: o Muse, na rotina do drip diário. Depois: o mesmo passo a passo vale
para qualquer pessoa da agência — o arquivo é o contrato, não a memória
de quem cotou.

## Janela de frescor

`MAX_FRESH_DAYS = 2` em `client/src/lib/packages.ts` (dias corridos).
Apertar para 1 (= "verificado no dia") é decisão do dono — a rotina
diária já garante frescor de 1 dia na prática; a janela de 2 dias existe
só para cobrir fim de semana/feriado sem rotina. Nunca afrouxar sem a
aprovação dele.
