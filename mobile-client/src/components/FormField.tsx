import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { theme } from "../theme/theme";

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.gray500}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 18,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
    backgroundColor: theme.colors.surfaceSoft,
    fontSize: 15,
    color: theme.colors.gray900,
  },
});
