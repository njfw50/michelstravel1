import React, { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({ children, scrollable = false, contentStyle }: AppScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={[styles.safe, contentStyle]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing(4),
    gap: theme.spacing(3),
  },
});

