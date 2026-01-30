import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface ErrorSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error";
  password?: string | null;
  email?: string | null;
  theme: any;
}

export default function ErrorSuccessModal({
  visible,
  onClose,
  title,
  message,
  type,
  password,
  email,
  theme,
}: ErrorSuccessModalProps) {
  const isSuccess = type === "success";
  const iconName = isSuccess ? "checkmark-circle" : "close-circle";
  const iconColor = isSuccess ? Palette.primary : "#dc3545";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: 400 }]}>
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: isSuccess ? Palette.primary : "#dc3545",
                borderBottomWidth: 2,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: isSuccess ? Palette.primary : "#dc3545" }]}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={[styles.successIconContainer, { marginVertical: 20 }]}>
              <Ionicons name={iconName} size={64} color={iconColor} />
            </View>

            <Text style={[styles.successMessageText, { color: theme.text, textAlign: "center", marginBottom: 24, fontSize: 16 }]}>
              {message}
            </Text>

            {email && (
              <View style={[styles.emailBox, { backgroundColor: theme.bg, borderColor: isSuccess ? Palette.primary : "#dc3545" }]}>
                <Text style={[styles.emailText, { color: theme.text }]}>{email}</Text>
              </View>
            )}

            {password && (
              <>
                <Text style={[styles.passwordLabel, { color: theme.text, marginTop: email ? 16 : 24, marginBottom: 8 }]}>
                  Temporary Password:
                </Text>
                <View style={[styles.passwordBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.passwordText, { color: theme.text, fontFamily: "monospace", letterSpacing: 1 }]}>
                    {password}
                  </Text>
                </View>

                <View style={[styles.infoBox, { backgroundColor: theme.bg, borderLeftColor: Palette.primary }]}>
                  <Ionicons name="information-circle" size={20} color={Palette.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: theme.text, flex: 1 }]}>
                    Share this password with the user. They will need to change it upon first login.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: isSuccess ? Palette.primary : "#dc3545", flex: 1 },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: isSuccess ? Palette.black : "white" }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 0,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  successIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  successMessageText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  emailBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "600",
  },
  passwordLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  passwordBox: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  passwordText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
});
