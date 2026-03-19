# MichelstravelControl (Mobile App)

Aplicativo React Native puro para controle total do painel e dashboard Michelstravel, com identidade visual igual ao site.

## Estrutura inicial
- Tela de login
- Painel de controle (MobileDashboard)
- Navegação por abas (dashboard, bookings, voice, deals)
- Design system compartilhado (cores, fontes, botões, cards)
- Integração pronta para APIs REST do backend

## Como rodar
1. Instale dependências:
   ```
   npm install
   # ou
   yarn install
   ```
2. Rode no Android:
   ```
   npx react-native run-android
   ```
3. Rode no iOS (Mac):
   ```
   npx react-native run-ios
   ```

## Personalização
- Edite o tema em `theme.ts`.
- Adicione novas telas em `screens/`.
- Componentes compartilhados em `components/`.

## APIs
- O app já está pronto para consumir `/api/senior-alerts`, `/api/bookings`, `/api/voice-escalations` e outros endpoints do backend.

---

> Desenvolvido para máxima eficiência, controle e identidade visual unificada com o site Michelstravel.
