import { View, Image, StyleSheet, Text } from "react-native";
import { Theme } from "../../constants/theme";

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Logo Circle */}
        <View style={styles.logoCircle}>
          <Image
            source={require("../../assets/images/WeekenderEventLogo.png")} // make sure path is correct
            style={styles.logo}
          />
        </View>

        {/* Text with Poppins Bold */}
        <Text style={styles.logoText}>Weekender Events</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    paddingHorizontal: Theme.spacing.lg,
    justifyContent: "center",
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 3,                 // Thicker bottom line
    borderBottomColor: Theme.colors.black, // Black line
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md, // spacing between logo and text
  },

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,          // circle
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.black, // black circle
  },

  logo: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },

  logoText: {
    fontFamily: "Poppins-Bold",  // ⬅ Poppins Bold font
    fontSize: 24,                 // bigger and appealing
    color: Theme.colors.text,
  },
});
