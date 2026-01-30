import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Theme } from "../../../constants/theme";
import Header from "../../components/header";
import { supabase } from "../../services/supabase";

interface ForgotPasswordProps {
  onBackToLogin?: () => void;
}

type ForgotPasswordStep = "email-contact" | "email-verification" | "reset-password";

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [step, setStep] = useState<ForgotPasswordStep>(
    params.step === "reset-password" ? "reset-password" : "email-contact"
  );
  const [email, setEmail] = useState((params.email as string) || "");
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>((params.userId as string) || null);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendVerification = async () => {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      // Normalize email to lowercase for comparison (emails should be case-insensitive)
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, user_role, auth_id")
        .eq("email", normalizedEmail)
        .single();

      if (userError || !userData) {
        // Provide more detailed error information for debugging
        console.error("Email lookup error:", userError);
        setError("Email not found in the system");
        setLoading(false);
        return;
      }

      // Send password reset OTP via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

      if (resetError) {
        setError(resetError.message || "Failed to send reset code");
        setLoading(false);
        return;
      }

      setUserId(userData.user_id);
      setSuccess(`Verification code sent to ${email}.`);
      
      // Navigate to email verification page
      setTimeout(() => {
        router.replace({
          pathname: "/auth/emailverifcation",
          params: {
            email: email,
            userId: userData.user_id.toString(),
          },
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newCode = [...verificationCode];
    newCode[index] = text.replace(/[^0-9]/g, "");
    setVerificationCode(newCode);

    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === "Backspace" && !verificationCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmail = () => {
    setError(null);
    setSuccess(null);

    const fullCode = verificationCode.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    // Verify OTP with Supabase
    verifyOtpWithSupabase(fullCode);
  };

  const verifyOtpWithSupabase = async (token: string) => {
    try {
      setLoading(true);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email as string,
        token: token,
        type: "recovery",
      });

      if (verifyError) {
        setError("Invalid verification code");
        setLoading(false);
        return;
      }

      setSuccess("Email verified successfully!");
      setTimeout(() => {
        setStep("reset-password");
        setSuccess(null);
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sign out the user so they must log in with new password
      await supabase.auth.signOut();

      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        setEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setVerificationCode(["", "", "", "", "", ""]);
        setStep("email-contact");
        router.push("/auth");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
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
        {step === "email-contact" && (
          <>
            <Text style={styles.title}>Forgot Password</Text>

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

            {/* Email Label and Input */}
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

            {/* Send Verification Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.background} size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Verification</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/auth")}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "email-verification" && (
          <>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your email
            </Text>

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

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpInputRefs.current[index] = ref;
                  }}
                  style={styles.otpBox}
                  maxLength={1}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Theme.colors.muted}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(event) => handleOtpKeyPress(event, index)}
                  editable={!loading}
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.background} size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep("email-contact");
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "reset-password" && (
          <>
            <Text style={styles.title}>Reset Password</Text>

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

            {/* New Password Label and Input */}
            <Text style={styles.label}>New Password</Text>
            <TextInput
              placeholder="Enter new password"
              style={styles.input}
              placeholderTextColor={Theme.colors.muted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />

            {/* Confirm Password Label and Input */}
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              placeholder="Confirm password"
              style={styles.input}
              placeholderTextColor={Theme.colors.muted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />

            {/* Reset Password Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.background} size="small" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/auth")}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
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
    marginBottom: Theme.spacing.md,
    color: Theme.colors.text,
  },
  subtitle: {
    fontFamily: Theme.fonts.regular,
    fontSize: 14,
    marginBottom: Theme.spacing.lg,
    color: Theme.colors.muted,
    textAlign: "center",
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
  button: {
    width: "100%",
    height: 50,
    backgroundColor: Theme.colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Theme.radius.md,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  buttonText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.background,
    fontSize: 18,
  },
  backButton: {
    width: "100%",
    height: 50,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Theme.radius.md,
  },
  backButtonText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.black,
    fontSize: 18,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  otpBox: {
    width: "15%",
    height: 60,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    textAlign: "center",
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
