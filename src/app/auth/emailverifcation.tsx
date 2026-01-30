import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Theme } from "../../../constants/theme";
import Header from "../../components/header";
import { supabase } from "../../services/supabase";

interface EmailVerificationProps {
  onBackToLogin?: () => void;
}

export default function EmailVerification() {
  const router = useRouter();
  const { email, userId } = useLocalSearchParams();
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Start cooldown timer on mount since OTP was just sent
  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleVerifyEmail = async () => {
    setError(null);
    setSuccess(null);

    const fullCode = verificationCode.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    try {
      setLoading(true);

      // Verify OTP with Supabase using lowercase email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: (email as string).toLowerCase(),
        token: fullCode,
        type: "email",
      });

      if (verifyError) {
        setError("Invalid verification code");
        setLoading(false);
        return;
      }

      setSuccess("Email verified successfully! Redirecting to set your password...");
      setTimeout(() => {
        router.push({
          pathname: "/auth/forgot_password",
          params: {
            step: "reset-password",
            email: email,
            userId: userId,
            verified: "true",
            isNewSignup: "true",
          },
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setSuccess(null);

    try {
      setResendLoading(true);
      
      // For password reset email confirmation, resend OTP
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        (email as string).toLowerCase()
      );

      if (resetError) {
        setError(resetError.message || "Failed to resend code");
        setResendLoading(false);
        return;
      }

      setSuccess("Code resent to your email!");
      setVerificationCode(["", "", "", "", "", ""]);
      
      // Set cooldown for 60 seconds
      setResendCooldown(60);
      
      // Countdown timer
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendLoading(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header />

      {/* Content */}
      <View style={styles.content}>
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

        {/* OTP Input Boxes with Resend */}
        <View style={styles.otpSection}>
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
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendLoading || resendCooldown > 0}
            style={[styles.resendContainer, (resendLoading || resendCooldown > 0) && styles.resendDisabled]}
          >
            {resendLoading ? (
              <ActivityIndicator color={Theme.colors.black} size="small" />
            ) : resendCooldown > 0 ? (
              <Text style={styles.resendText}>{resendCooldown}s</Text>
            ) : (
              <Text style={styles.resendText}>Resend</Text>
            )}
          </TouchableOpacity>
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

        {/* Back to Login Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back to Login</Text>
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
  otpSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    marginRight: Theme.spacing.md,
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
  resendContainer: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    minWidth: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.black,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  resendDisabled: {
    opacity: 0.5,
  },
});
