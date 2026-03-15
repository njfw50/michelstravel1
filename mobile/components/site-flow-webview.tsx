import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';

type SiteFlowWebViewProps = {
  path: string;
  title: string;
  subtitle: string;
};

const SITE_BASE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.michelstravel.agency';

export function SiteFlowWebView({ path, title, subtitle }: SiteFlowWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const url = useMemo(() => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const separator = normalizedPath.includes('?') ? '&' : '?';
    return `${SITE_BASE_URL}${normalizedPath}${separator}appShell=senior`;
  }, [path]);

  const openOutside = async () => {
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View className="flex-1 overflow-hidden rounded-[28px] border border-border bg-surface">
      <View className="border-b border-border bg-background px-4 py-4">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        <Text className="mt-1 text-sm leading-6 text-muted">{subtitle}</Text>

        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity
            className="rounded-full bg-primary px-4 py-3"
            onPress={openOutside}
            activeOpacity={0.85}
          >
            <Text className="text-sm font-semibold text-background">Abrir fora do app</Text>
          </TouchableOpacity>
          <View className="rounded-full border border-border bg-surface px-4 py-3">
            <Text className="text-sm font-semibold text-foreground">Fluxo real do site</Text>
          </View>
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-foreground">
            No web desta base mobile, abra o fluxo pelo navegador.
          </Text>
          <TouchableOpacity
            className="mt-5 rounded-full bg-primary px-5 py-4"
            onPress={openOutside}
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-background">Abrir fluxo de busca</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 bg-white">
          {isLoading && !hasError && (
            <View className="absolute inset-0 z-10 items-center justify-center bg-white/95">
              <ActivityIndicator size="large" color="#2F63F5" />
              <Text className="mt-3 text-sm text-muted">Carregando busca e compra...</Text>
            </View>
          )}

          {hasError ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base font-semibold text-foreground">
                Nao foi possivel abrir o fluxo dentro do app agora.
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-muted">
                Voce ainda pode continuar a busca e a compra abrindo o mesmo fluxo no navegador.
              </Text>
              <TouchableOpacity
                className="mt-5 rounded-full bg-primary px-5 py-4"
                onPress={openOutside}
                activeOpacity={0.85}
              >
                <Text className="text-base font-semibold text-background">Abrir no navegador</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: url }}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
            />
          )}
        </View>
      )}
    </View>
  );
}
