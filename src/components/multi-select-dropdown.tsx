import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface DropdownOption {
  id: string | number;
  name: string;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedValues: (string | number)[];
  onSelect: (values: (string | number)[]) => void;
  theme: any;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export default function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selectedValues,
  onSelect,
  theme,
  isOpen,
  onToggle,
}: MultiSelectDropdownProps) {
  const getSelectedNames = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selected = options.find((opt) => opt.id === selectedValues[0]);
      return selected?.name || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  const handleToggleOption = (optionId: string | number) => {
    if (selectedValues.includes(optionId)) {
      onSelect(selectedValues.filter((id) => id !== optionId));
    } else {
      onSelect([...selectedValues, optionId]);
    }
  };

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.formDropdown, { borderColor: theme.border }]}
        onPress={() => onToggle(!isOpen)}
      >
        <Text
          style={[
            styles.dropdownPlaceholder,
            { color: selectedValues.length > 0 ? theme.text : theme.textSecondary },
          ]}
        >
          {getSelectedNames()}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <ScrollView style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]} nestedScrollEnabled>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownItem,
                  isSelected && { backgroundColor: Palette.primary + "20" },
                ]}
                onPress={() => handleToggleOption(option.id)}
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? Palette.primary : theme.border,
                        backgroundColor: isSelected ? Palette.primary : "transparent",
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedValues.length > 0 && (
        <View style={styles.tagsContainer}>
          {selectedValues.map((id) => {
            const selected = options.find((opt) => opt.id === id);
            return (
              <View key={id} style={[styles.tag, { backgroundColor: Palette.primary + "20" }]}>
                <Text style={[styles.tagText, { color: theme.text }]}>{selected?.name}</Text>
                <TouchableOpacity onPress={() => handleToggleOption(id)}>
                  <Ionicons name="close" size={14} color={Palette.primary} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  formDropdown: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownPlaceholder: {
    fontSize: 14,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    marginRight: 6,
  },
});
