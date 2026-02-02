import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  theme?: any;
  isLoading?: boolean;
}

/**
 * Delete Confirmation Modal Component
 * Displays a secure confirmation dialog before deleting items
 * Usage:
 * <DeleteConfirmationModal
 *   isOpen={showDeleteModal}
 *   onClose={() => setShowDeleteModal(false)}
 *   onConfirm={() => handleConfirmDelete()}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   theme={theme}
 * />
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  theme,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!theme) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          {/* Header with Icon */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: Palette.red,
                borderBottomWidth: 2,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Ionicons name="trash" size={24} color={Palette.red} style={styles.headerIcon} />
              <Text style={[styles.modalTitle, { color: Palette.red }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <View style={[styles.iconContainer, { backgroundColor: "rgba(255, 0, 0, 0.1)" }]}>
              <Ionicons name="warning" size={48} color={Palette.red} />
            </View>

            <Text style={[styles.messageText, { color: theme.text }]}>{message}</Text>
          </View>

          {/* Footer with Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: Palette.red, opacity: isLoading ? 0.6 : 1 },
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={16} color="white" style={styles.loadingIcon} />
              ) : (
                <Ionicons name="trash" size={16} color="white" style={styles.buttonIcon} />
              )}
              <Text style={styles.deleteButtonText}>{isLoading ? "Deleting..." : confirmText}</Text>
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
    maxWidth: 420,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 2,
  },
  loadingIcon: {
    marginRight: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
