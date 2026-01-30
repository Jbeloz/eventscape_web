import { Ionicons } from "@expo/vector-icons"; // For eye icon
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Theme } from "../../../constants/theme";
import Header from "../../components/header";
import { supabase } from "../../services/supabase";

interface LoginPageProps {
  onForgotPassword?: () => void;
}

export default function LoginPage({ onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError("Login failed. Please try again.");
        return;
      }

      // Get user email from auth data
      const userEmail = authData.user.email?.toLowerCase();
      
      if (!userEmail) {
        setError("Unable to retrieve user email from authentication.");
        return;
      }

      // Check if user is an administrator - query by email instead of auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_role, user_id")
        .eq("email", userEmail)
        .maybeSingle();

      if (userError) {
        setError("Failed to retrieve user role: " + userError.message);
        return;
      }

      if (!userData) {
        setError("User not found in the system.");
        await supabase.auth.signOut();
        return;
      }

      // Check role (case-insensitive comparison)
      const userRole = userData.user_role?.toLowerCase().trim();
      if (userRole !== "administrator") {
        setError(`Only administrators can access this system. Your role: ${userData.user_role}`);
        await supabase.auth.signOut();
        return;
      }

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/administrator_pages/admin_home");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>

        {/* Success Message */}
        {success && (
          <View style={[styles.messageBox, styles.successBox]}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={[styles.messageBox, styles.errorBox]}>
            <Ionicons name="close-circle" size={20} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email Input */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor={Theme.colors.muted}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
        />

        {/* Password Input with show/hide */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput} // separate style without border
            placeholderTextColor={Theme.colors.muted}
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <Ionicons
              name={passwordVisible ? "eye-off" : "eye"}
              size={24}
              color={Theme.colors.muted}
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotContainer}
          onPress={onForgotPassword}
          disabled={loading}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.background} size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
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
    label: {
    width: "100%",
    fontFamily: Theme.fonts.semibold,
    fontSize: 14,
    marginBottom: Theme.spacing.sm,
    color: Theme.colors.text,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    paddingVertical: 0, // ensures vertical alignment
    // no border here!
  },
  eyeIcon: {
    marginLeft: Theme.spacing.sm,
  },
  forgotContainer: {
    marginLeft: "auto",
    marginBottom: Theme.spacing.md,
  },
  forgotText: {
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.primary, // now works if primary is in Theme
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: Theme.colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Theme.radius.md,
    marginTop: Theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.background,
    fontSize: 18,
  },
  messageBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  successBox: {
    backgroundColor: "#d4edda",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  successText: {
    fontFamily: Theme.fonts.regular,
    color: "#155724",
    fontSize: 14,
    flex: 1,
  },
  errorBox: {
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  errorText: {
    fontFamily: Theme.fonts.regular,
    color: "#721c24",
    fontSize: 14,
    flex: 1,
  },
});
