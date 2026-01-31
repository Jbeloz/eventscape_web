import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface ThumbnailUploadProps {
  label: string;
  thumbnailUri: string;
  onThumbnailChange: (uri: string) => void;
  onImageZoom: (uri: string) => void;
  theme: any;
  isOptional?: boolean;
}

export default function ThumbnailUpload({
  label,
  thumbnailUri,
  onThumbnailChange,
  onImageZoom,
  theme,
  isOptional = true,
}: ThumbnailUploadProps) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      onThumbnailChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: theme.text }]}>
        {label} {isOptional ? "(Optional)" : "*"}
      </Text>
      <View style={styles.thumbnailSection}>
        {thumbnailUri ? (
          <>
            <TouchableOpacity onPress={() => onImageZoom(thumbnailUri)}>
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.changeThumbnailButton, { flex: 1, borderColor: Palette.primary }]}
                onPress={pickImage}
              >
                <Ionicons name="cloud-upload" size={16} color={Palette.primary} />
                <Text style={{ color: Palette.primary, marginLeft: 4, fontWeight: "600", fontSize: 12 }}>
                  Change
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.changeThumbnailButton, { flex: 1, borderColor: Palette.red }]}
                onPress={() => onThumbnailChange("")}
              >
                <Ionicons name="close" size={16} color={Palette.red} />
                <Text style={{ color: Palette.red, marginLeft: 4, fontWeight: "600", fontSize: 12 }}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.uploadThumbnailButton, { borderColor: theme.border }]}
            onPress={pickImage}
          >
            <Ionicons name="cloud-upload" size={32} color={Palette.primary} />
            <Text style={[styles.uploadButtonText, { color: theme.text, marginTop: 8 }]}>
              Click to upload
            </Text>
            <Text style={[styles.uploadButtonSubtext, { color: theme.textSecondary }]}>
              PNG, JPG up to 5MB
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  thumbnailSection: {
    gap: 8,
  },
  thumbnailPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  changeThumbnailButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadThumbnailButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  uploadButtonSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
