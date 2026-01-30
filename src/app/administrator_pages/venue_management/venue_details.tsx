import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import { useTheme } from "../../../context/theme-context";

export default function VenueDetails() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { venueId } = useLocalSearchParams();
  const [venueStatus, setVenueStatus] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  // Mock venue data - replace with API call
  const venue = {
    id: 1,
    name: "Convention Hall A",
    location: "Business District, Chicago",
    address: "123 Convention St, Chicago, IL 60601",
    capacity: 1200,
    type: "Convention Center",
    status: true,
    email: "info@conventionhall.com",
    phone: "+1 (312) 555-0123",
    images: [
      "https://images.unsplash.com/photo-1519167758993-c5924266c810?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1519671482677-0ac3dba0ef0e?w=800&h=500&fit=crop",
    ],
    dimensions: {
      length: "50m",
      width: "40m",
      floorArea: "2000 sqm",
      ceilingHeight: "12m",
    },
    amenities: ["Stage", "Air Conditioning", "Parking", "Handicapped Access"],
    allowedEventTypes: ["Conference", "Exhibition", "Corporate Event", "Networking"],
    facilities: ["Sound System", "Projector", "Wi-Fi", "Stage", "Catering Kitchen"],
    pricing: {
      rateType: "Hourly",
      baseRate: "$800",
      peakRate: "$1,200",
      overtimeCharges: "$300",
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Header & Action Bar */}
          <View style={styles.headerSection}>
            <View style={styles.backSection}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.venueName, { color: theme.text }]}>{venue.name}</Text>
                <View style={styles.statusBadgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: Palette.green + "20" }]}>
                    <Text style={[styles.statusBadgeText, { color: Palette.green }]}>Active</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <View style={styles.statusToggle}>
                <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>Active</Text>
                <Switch value={venueStatus} onValueChange={setVenueStatus} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
              </View>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: Palette.primary }]} onPress={() => router.push(`./edit_venue?venueId=${venue.id}`)}>
                <Ionicons name="pencil" size={18} color={Palette.black} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: Palette.red }]}>
                <Ionicons name="trash" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sub-Header Info */}
          <View style={[styles.subHeaderInfo, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={18} color={Palette.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{venue.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={18} color={Palette.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>Capacity: {venue.capacity} people</Text>
            </View>
          </View>

          {/* Gallery Section */}
          <View style={styles.gallerySection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gallery</Text>
            
            {/* Main Image */}
            <Image source={{ uri: venue.images[selectedImage] }} style={[styles.mainImage, { borderRadius: 12 }]} />

            {/* Thumbnail Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
              {venue.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && { borderWidth: 3, borderColor: Palette.primary },
                  ]}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image source={{ uri: image }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.thumbnail, { backgroundColor: theme.lightBg, justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="add" size={28} color={Palette.primary} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Key Information Grid */}
          <View style={styles.gridSection}>
            {/* Venue Information */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Venue Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Venue Type</Text>
                <View style={[styles.pill, { backgroundColor: Palette.primary + "20" }]}>
                  <Text style={[styles.pillText, { color: Palette.primary }]}>{venue.type}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Capacity</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{venue.capacity} people</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Location</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{venue.address}</Text>
              </View>
            </View>

            {/* Contact Information */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Contact Information</Text>
              
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail" size={20} color={Palette.primary} />
                <Text style={[styles.contactText, { color: Palette.blue }]}>{venue.email}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call" size={20} color={Palette.primary} />
                <Text style={[styles.contactText, { color: Palette.blue }]}>{venue.phone}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Technical Specifications */}
          <View style={[styles.techSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Technical Specifications</Text>
            
            {/* Dimensions */}
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>Dimensions</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Length</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{venue.dimensions.length}</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Width</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{venue.dimensions.width}</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Floor Area</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{venue.dimensions.floorArea}</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Ceiling Height</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{venue.dimensions.ceilingHeight}</Text>
              </View>
            </View>

            {/* Amenities */}
            <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Palette.green} />
                  <Text style={[styles.amenityText, { color: theme.text }]}>{amenity}</Text>
                </View>
              ))}
            </View>

            {/* Allowed Event Types */}
            <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>Allowed Event Types</Text>
            <View style={styles.tagsRow}>
              {venue.allowedEventTypes.map((type, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: Palette.blue + "20", borderColor: Palette.blue }]}>
                  <Text style={[styles.tagText, { color: Palette.blue }]}>{type}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Facilities & Inclusions */}
          <View style={[styles.facilitiesSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Facilities & Inclusions</Text>
            <View style={styles.facilitiesGrid}>
              {venue.facilities.map((facility, index) => (
                <View key={index} style={[styles.facilityTag, { backgroundColor: Palette.primary + "20", borderColor: Palette.primary }]}>
                  <Text style={[styles.facilityTagText, { color: Palette.primary }]}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing & Packages */}
          <View style={[styles.pricingSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing & Packages</Text>
            
            <View style={styles.rateTypeRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Rate Type:</Text>
              <View style={[styles.pill, { backgroundColor: Palette.primary + "20" }]}>
                <Text style={[styles.pillText, { color: Palette.primary }]}>{venue.pricing.rateType}</Text>
              </View>
            </View>

            <Text style={[styles.priceBreakdownTitle, { color: theme.text, marginTop: 16 }]}>Price Breakdown</Text>
            
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Base Rate</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>{venue.pricing.baseRate}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Holiday / Peak Rate</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>{venue.pricing.peakRate}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Overtime Charges</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>{venue.pricing.overtimeCharges}</Text>
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
    padding: 16,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  backSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  venueName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statusBadgeRow: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  subHeaderInfo: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  gallerySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  mainImage: {
    width: "100%",
    height: 300,
    marginBottom: 12,
  },
  thumbnailRow: {
    marginBottom: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  gridSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  techSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  dimensionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dimensionItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  dimensionLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  dimensionValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  amenitiesGrid: {
    gap: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amenityText: {
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  facilitiesSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  facilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  facilityTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  pricingSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  rateTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceBreakdownTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
