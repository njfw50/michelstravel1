import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";

import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { adminApiClient } from "@/lib/admin-api-client";

const SITE_BASE_URL = process.env.EXPO_PUBLIC_SITE_URL || "https://www.michelstravel.agency";

type AdminWorkspaceWebViewProps = {
  path: string;
  title: string;
  subtitle: string;
};

export function AdminWorkspaceWebView({
  path,
  title,
  subtitle,
}: AdminWorkspaceWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isAuthenticated } = useAdminAuth();

  const fullUrl = useMemo(() => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_BASE_URL}${normalizedPath}`;
  }, [path]);

  const injectedScript = useMemo(
    () => `
      (function() {
        try {
          var token = window.__MICHELS_ADMIN_TOKEN__;
          if (token) {
            window.localStorage.setItem('michels-admin-token', token);
          }
        } catch (error) {}
        true;
      })();
    `,
    [],
  );

  const openOutside = async () => {
    await WebBrowser.openBrowserAsync(fullUrl);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center rounded-[28px] border border-border bg-surface px-6">
          <Text className="text-center text-lg font-semibold text-foreground">
            Entre no app admin para abrir este painel.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
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
              <Text className="text-sm font-semibold text-foreground">App admin separado</Text>
            </View>
          </View>
        </View>

        {Platform.OS === "web" ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base text-foreground">
              No web desta base mobile, abra o painel admin pelo navegador.
            </Text>
            <TouchableOpacity
              className="mt-5 rounded-full bg-primary px-5 py-4"
              onPress={openOutside}
              activeOpacity={0.85}
            >
              <Text className="text-base font-semibold text-background">Abrir painel admin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 bg-white">
            {isLoading && !hasError && (
              <View className="absolute inset-0 z-10 items-center justify-center bg-white/95">
                <ActivityIndicator size="large" color="#2F63F5" />
                <Text className="mt-3 text-sm text-muted">Abrindo seu painel admin...</Text>
              </View>
            )}

            {hasError ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-center text-base font-semibold text-foreground">
                  Nao foi possivel abrir este painel agora.
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
              <AdminTokenWebView
                fullUrl={fullUrl}
                injectedScript={injectedScript}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
              />
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function AdminTokenWebView({
  fullUrl,
  injectedScript,
  onLoadEnd,
  onError,
}: {
  fullUrl: string;
  injectedScript: string;
  onLoadEnd: () => void;
  onError: () => void;
}) {
  const { isAuthenticated } = useAdminAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    adminApiClient.getToken().then((value) => {
      if (!active) return;
      setToken(value);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!isAuthenticated || !token) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2F63F5" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: fullUrl }}
      injectedJavaScriptBeforeContentLoaded={`window.__MICHELS_ADMIN_TOKEN__ = ${JSON.stringify(token)}; ${injectedScript}`}
      onLoadEnd={onLoadEnd}
      onError={onError}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      allowsBackForwardNavigationGestures
      originWhitelist={["*"]}
      setSupportMultipleWindows={false}
    />
  );
}
