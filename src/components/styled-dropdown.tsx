import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface DropdownOption {
  id: string | number;
  name: string;
}

interface StyledDropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  theme: any;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  isOptional?: boolean;
}

export default function StyledDropdown({
  label,
  placeholder,
  options,
  selectedValue,
  onSelect,
  theme,
  isOpen,
  onToggle,
  isOptional = true,
}: StyledDropdownProps) {
  const getSelectedName = () => {
    if (!selectedValue) return placeholder;
    const selected = options.find((opt) => opt.id === selectedValue);
    return selected?.name || placeholder;
  };

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: theme.text }]}>
        {label} {isOptional ? "(Optional)" : "*"}
      </Text>
      <TouchableOpacity
        style={[styles.formDropdown, { borderColor: theme.border }]}
        onPress={() => onToggle(!isOpen)}
      >
        <Text
          style={[
            styles.dropdownPlaceholder,
            { color: selectedValue ? theme.text : theme.textSecondary },
          ]}
        >
          {getSelectedName()}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.dropdownItem,
                selectedValue === option.id && { backgroundColor: Palette.primary + "20" },
              ]}
              onPress={() => {
                onSelect(option.id);
                onToggle(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option.name}</Text>
            </TouchableOpacity>
          ))}
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
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdownItemText: {
    fontSize: 14,
  },
});
