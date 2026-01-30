import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface AdminHeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
}

export default function AdminHeader({
  isDarkMode,
  onThemeToggle,
  onSidebarToggle,
}: AdminHeaderProps) {
  const theme = isDarkMode ? Palette.dark : Palette.light;

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.header, borderBottomColor: Palette.primary },
      ]}
    >
      <TouchableOpacity
        style={styles.hamburger}
        onPress={onSidebarToggle}
      >
        <Ionicons
          name="menu"
          size={24}
          color={isDarkMode ? Palette.primary : Palette.black}
        />
      </TouchableOpacity>

      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text
            style={[
              styles.profileName,
              { color: isDarkMode ? Palette.primary : Palette.black },
            ]}
          >
            Admin User
          </Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
            Administrator
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.themeToggle}
        onPress={onThemeToggle}
      >
        <Ionicons
          name={isDarkMode ? "sunny" : "moon"}
          size={24}
          color={isDarkMode ? Palette.primary : Palette.black}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  hamburger: {
    padding: 8,
  },
  themeToggle: {
    padding: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Palette.black,
    fontWeight: "bold",
    fontSize: 14,
  },
  profileInfo: {
    justifyContent: "center",
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileRole: {
    fontSize: 12,
  },
});
