import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { SiteFlowWebView } from '@/components/site-flow-webview';

export default function SearchFlowScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pb-5 pt-4">
        <SiteFlowWebView
          path="/senior"
          title="Busca e compra"
          subtitle="Aqui esta o fluxo real do site dentro do app, com pesquisa, resultados, bagagem e compra."
        />
        <Text className="px-2 pt-3 text-center text-xs leading-5 text-muted">
          Se o fluxo interno demorar ou falhar, use o botao "Abrir fora do app" e continue no navegador com a mesma pagina.
        </Text>
      </View>
    </ScreenContainer>
  );
}
