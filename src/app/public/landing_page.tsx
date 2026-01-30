import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../../constants/theme";
import Header from "../../components/header";

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Weekender Events</Text>

        {/* Navigate to Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
  },
  title: {
    fontFamily: Theme.fonts.bold,
    fontSize: 28,
    marginBottom: Theme.spacing.lg,
    color: Theme.colors.text,
  },
  button: {
    backgroundColor: Theme.colors.black,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radius.md,
  },
  buttonText: {
    fontFamily: Theme.fonts.bold,
    fontSize: 18,
    color: Theme.colors.background,
  },
});
