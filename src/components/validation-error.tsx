import { StyleSheet, Text } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface ValidationErrorProps {
  message: string;
  visible: boolean;
}

/**
 * Inline validation error text component
 * Display red error message directly under form fields
 * Usage:
 * <TextInput ... />
 * <ValidationError message={error.message} visible={!error.isValid} />
 */
export default function ValidationError({ message, visible }: ValidationErrorProps) {
  if (!visible || !message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
}

const styles = StyleSheet.create({
  errorText: {
    color: Palette.red,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
});
