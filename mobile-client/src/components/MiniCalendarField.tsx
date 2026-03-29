import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "../theme/theme";
import { CalendarLanguage, formatDateLabel, isValidIsoDate, todayIsoDate } from "../utils/dateCalendar";

type MiniCalendarFieldProps = {
  label: string;
  value: string;
  language: CalendarLanguage;
  placeholder: string;
  hint: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  accentColor: string;
  accentSoft: string;
  fieldStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  hintStyle?: StyleProp<TextStyle>;
  modalTitle?: string;
};

function parseIsoDate(value?: string | null) {
  if (!value || !isValidIsoDate(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0);
}

function getWeekConfig(language: CalendarLanguage) {
  if (language === "en") {
    return {
      startDay: 0,
      labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      cancel: "Cancel",
      clear: "Clear",
    };
  }

  if (language === "es") {
    return {
      startDay: 1,
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      cancel: "Cerrar",
      clear: "Limpiar",
    };
  }

  return {
    startDay: 1,
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    cancel: "Fechar",
    clear: "Limpar",
  };
}

function buildMonthGrid(cursorMonth: Date, weekStartsOn: number) {
  const firstDay = monthStart(cursorMonth);
  const monthIndex = firstDay.getMonth();
  const firstWeekday = firstDay.getDay();
  const offset = (firstWeekday - weekStartsOn + 7) % 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return {
      iso: toIsoDate(day),
      dayNumber: day.getDate(),
      inCurrentMonth: day.getMonth() === monthIndex,
    };
  });
}

export function MiniCalendarField({
  label,
  value,
  language,
  placeholder,
  hint,
  onChange,
  minimumDate,
  accentColor,
  accentSoft,
  fieldStyle,
  labelStyle,
  valueStyle,
  hintStyle,
  modalTitle,
}: MiniCalendarFieldProps) {
  const [visible, setVisible] = useState(false);
  const minDateIso = minimumDate && isValidIsoDate(minimumDate) ? minimumDate : todayIsoDate();
  const initialDate = parseIsoDate(value) ?? parseIsoDate(minDateIso) ?? new Date();
  const [cursorMonth, setCursorMonth] = useState(monthStart(initialDate));

  const weekConfig = useMemo(() => getWeekConfig(language), [language]);
  const monthGrid = useMemo(() => buildMonthGrid(cursorMonth, weekConfig.startDay), [cursorMonth, weekConfig.startDay]);
  const formattedValue = isValidIsoDate(value) ? formatDateLabel(value, language) : placeholder;
  const helperValue = isValidIsoDate(value) ? value : hint;
  const selectedDate = parseIsoDate(value);
  const badgeMonth = selectedDate
    ? new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", {
        month: "short",
      })
        .format(selectedDate)
        .replace(".", "")
        .toUpperCase()
    : language === "en"
      ? "DATE"
      : language === "es"
        ? "FECHA"
        : "DATA";
  const badgeDay = selectedDate ? String(selectedDate.getDate()).padStart(2, "0") : "--";

  const openCalendar = () => {
    const nextDate = parseIsoDate(value) ?? parseIsoDate(minDateIso) ?? new Date();
    setCursorMonth(monthStart(nextDate));
    setVisible(true);
  };

  const canMovePrevious = (() => {
    const previousMonth = addMonths(cursorMonth, -1);
    const previousMonthLastDay = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 12, 0, 0);
    return toIsoDate(previousMonthLastDay) >= minDateIso;
  })();

  const monthTitle = new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(cursorMonth);

  return (
    <>
      <TouchableOpacity activeOpacity={0.88} style={[styles.field, fieldStyle]} onPress={openCalendar}>
        <View style={styles.fieldTopLine} />
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        <View style={styles.valueRow}>
          <View style={styles.valueCopy}>
            <Text style={[styles.value, !isValidIsoDate(value) && styles.placeholderValue, valueStyle]}>{formattedValue}</Text>
            <Text style={[styles.hint, hintStyle]}>{helperValue}</Text>
          </View>
          <View style={[styles.calendarBadge, selectedDate && { backgroundColor: accentSoft, borderColor: accentSoft }]}>
            <Text style={[styles.calendarBadgeMonth, selectedDate && { color: accentColor }]}>{badgeMonth}</Text>
            <Text style={[styles.calendarBadgeDay, selectedDate && { color: accentColor }]}>{badgeDay}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalTopGlow} />
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={[styles.navButton, !canMovePrevious && styles.navButtonDisabled]}
                disabled={!canMovePrevious}
                onPress={() => setCursorMonth((current) => addMonths(current, -1))}
              >
                <Text style={[styles.navButtonText, { color: canMovePrevious ? theme.colors.gray900 : theme.colors.gray300 }]}>‹</Text>
              </TouchableOpacity>

              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>{modalTitle || label}</Text>
                <Text style={styles.modalMonth}>{monthTitle}</Text>
              </View>

              <TouchableOpacity style={styles.navButton} onPress={() => setCursorMonth((current) => addMonths(current, 1))}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {weekConfig.labels.map((item) => (
                <Text key={item} style={styles.weekLabel}>{item}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {monthGrid.map((item) => {
                const disabled = item.iso < minDateIso;
                const selected = item.iso === value;
                return (
                  <TouchableOpacity
                    key={item.iso}
                    style={[
                      styles.dayButton,
                      !item.inCurrentMonth && styles.dayButtonOutside,
                      selected && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      onChange(item.iso);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !item.inCurrentMonth && styles.dayTextOutside,
                        disabled && styles.dayTextDisabled,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {item.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setVisible(false)}>
                <Text style={styles.actionButtonText}>{weekConfig.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: accentSoft, borderColor: accentSoft }]}
                onPress={() => {
                  onChange("");
                  setVisible(false);
                }}
              >
                <Text style={[styles.actionButtonText, { color: accentColor }]}>{weekConfig.clear}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    overflow: "hidden",
  },
  fieldTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.outline,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: theme.colors.gray500,
  },
  valueRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
  },
  valueCopy: {
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  placeholderValue: {
    color: theme.colors.gray500,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.gray600,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.46)",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  modalPanel: {
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...theme.shadow.floating,
    overflow: "hidden",
  },
  modalTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
  },
  modalTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalMonth: {
    marginTop: 4,
    fontSize: 19,
    fontWeight: "800",
    color: theme.colors.gray900,
    textTransform: "capitalize",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceSoft,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 26,
    color: theme.colors.gray900,
    lineHeight: 26,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  weekLabel: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 6,
  },
  dayButtonOutside: {
    opacity: 0.55,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.gray900,
  },
  dayTextOutside: {
    color: theme.colors.gray500,
  },
  dayTextDisabled: {
    color: theme.colors.gray300,
  },
  dayTextSelected: {
    color: theme.colors.white,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  calendarBadge: {
    minWidth: 66,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  calendarBadgeMonth: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.gray600,
    letterSpacing: 0.8,
  },
  calendarBadgeDay: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
});
