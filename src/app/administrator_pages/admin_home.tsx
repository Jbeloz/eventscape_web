import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Palette } from "../../../assets/colors/palette";
import AdminHeader from "../../components/admin-header";
import AdminSidebar from "../../components/admin-sidebar";
import { useTheme } from "../../context/theme-context";

export default function AdminHome() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get theme colors based on mode
  const theme = isDarkMode ? Palette.dark : Palette.light;

  const kpiCards = [
    { label: "Total Users", value: "23", icon: "people", color: Palette.blue },
    { label: "Active Users", value: "5", icon: "user-check", color: Palette.green },
    { label: "Deactivated Users", value: "10", icon: "user-times", color: Palette.red },
  ];

  const activityFeed = [
    { action: "New user registered", user: "John Doe (Event Organizer)", time: "5 minutes ago" },
    { action: "Venue updated", user: "Jane Smith (Admin)", time: "15 minutes ago" },
    { action: "Event scheduled", user: "Mike Johnson (Event Organizer)", time: "1 hour ago" },
    { action: "Review submitted", user: "Sarah Lee (User)", time: "2 hours ago" },
    { action: "Category created", user: "Admin User (Administrator)", time: "3 hours ago" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <AdminHeader
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <View style={styles.mainContainer}>
        {/* Sidebar */}
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        {/* Main Content */}
        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Welcome Banner */}
          <View style={[styles.welcomeBanner, { backgroundColor: theme.lightBg }]}>
            <Ionicons name="information-circle" size={24} color={isDarkMode ? Palette.primary : Palette.black} />
            <Text style={[styles.welcomeText, { color: isDarkMode ? Palette.black : Palette.black }]}>
              Welcome back, Admin! Here's what's happening with your system today.
            </Text>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>User Management summary</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Overview of user account statistics
            </Text>
          </View>

          {/* KPI Cards */}
          <View style={styles.kpiContainer}>
            {kpiCards.map((card, index) => (
              <View key={index} style={[styles.kpiCard, { backgroundColor: theme.card }]}>
                <View style={[styles.kpiIcon, { backgroundColor: card.color }]}>
                  <MaterialCommunityIcons
                    name={card.icon as any}
                    size={24}
                    color="white"
                  />
                </View>
                <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{card.label}</Text>
                <Text style={[styles.kpiValue, { color: isDarkMode ? Palette.primary : Palette.black }]}>{card.value}</Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={[styles.activitySection, { backgroundColor: theme.card }]}>
            <Text style={[styles.activityTitle, { color: isDarkMode ? Palette.primary : Palette.black }]}>Recent Activity</Text>
            <View style={styles.activityList}>
              {activityFeed.map((item, index) => (
                <View key={index} style={[styles.activityRow, { backgroundColor: theme.lightBg }]}>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityAction, { color: isDarkMode ? Palette.black : theme.text }]}>{item.action}</Text>
                    <Text style={[styles.activityUser, { color: theme.textSecondary }]}>{item.user}</Text>
                  </View>
                  <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{item.time}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  welcomeBanner: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  welcomeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  titleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  kpiContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  activitySection: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  activityList: {
    gap: 0,
  },
  activityRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityUser: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 12,
  },
});
