import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

interface ThemeImageGalleryProps {
  images: any[];
  onImagePress?: (imageUri: string) => void;
  theme: any;
}

export default function ThemeImageGallery({
  images,
  onImagePress,
  theme,
}: ThemeImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{ uri: "https://via.placeholder.com/300x300?text=No+Images" }}
          style={styles.mainImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  const currentImage =
    images[selectedImageIndex]?.image_path || images[selectedImageIndex];
  const displayImages = images.map((img: any) =>
    typeof img === "string" ? img : img.image_path
  );

  return (
    <View style={styles.container}>
      {/* Main Image */}
      <TouchableOpacity
        onPress={() => onImagePress?.(currentImage)}
        style={styles.mainImageContainer}
      >
        <Image
          source={{ uri: currentImage }}
          style={styles.mainImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScroll}
          >
            {displayImages.map((imageUri: string, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnail,
                  {
                    borderColor:
                      selectedImageIndex === index
                        ? Palette.primary
                        : theme.lightBg,
                    borderWidth: selectedImageIndex === index ? 3 : 1,
                    backgroundColor: theme.lightBg,
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.thumbnailImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Image Counter */}
      {displayImages.length > 1 && (
        <View style={styles.counterContainer}>
          <View
            style={[
              styles.counter,
              { backgroundColor: "rgba(0, 0, 0, 0.6)" },
            ]}
          >
            <Ionicons name="image" size={14} color="white" />
            <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>
              {selectedImageIndex + 1}/{displayImages.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  mainImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailContainer: {
    width: "100%",
  },
  thumbnailScroll: {
    paddingHorizontal: 0,
    gap: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  counterContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  counter: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
