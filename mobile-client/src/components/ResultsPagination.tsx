import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";

type ResultsPaginationProps = {
  language: AppLanguage;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function ResultsPagination({
  language,
  currentPage,
  pageSize,
  totalItems,
  onPrevious,
  onNext,
}: ResultsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const copy = useMemo(() => {
    if (language === "en") {
      return { previous: "Back", next: `Next ${pageSize}`, page: "Page", of: "of" };
    }

    if (language === "es") {
      return { previous: "Atrás", next: `${pageSize} más`, page: "Página", of: "de" };
    }

    return { previous: "Voltar", next: `Mais ${pageSize}`, page: "Página", of: "de" };
  }, [language, pageSize]);

  if (totalPages <= 1) return null;

  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>
        {startItem}-{endItem} {copy.of} {totalItems}
      </Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, currentPage === 1 ? styles.buttonDisabled : null]}
          disabled={currentPage === 1}
          onPress={onPrevious}
        >
          <Text style={[styles.buttonText, currentPage === 1 ? styles.buttonTextDisabled : null]}>{copy.previous}</Text>
        </TouchableOpacity>

        <Text style={styles.pageLabel}>
          {copy.page} {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.button, currentPage >= totalPages ? styles.buttonDisabled : null]}
          disabled={currentPage >= totalPages}
          onPress={onNext}
        >
          <Text style={[styles.buttonText, currentPage >= totalPages ? styles.buttonTextDisabled : null]}>{copy.next}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    gap: theme.spacing(2),
  },
  caption: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.gray500,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
  },
  button: {
    minWidth: 86,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.8),
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray100,
    borderColor: theme.colors.gray200,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primaryInk,
  },
  buttonTextDisabled: {
    color: theme.colors.gray500,
  },
  pageLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray700,
  },
});
