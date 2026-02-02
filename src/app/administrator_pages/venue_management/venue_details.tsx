import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { supabase } from "../../../services/supabase";
import { fetchCompleteVenueDetails, fetchVenueAdministrators } from "../../../services/venueService";

export default function VenueDetails() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { venueId } = useLocalSearchParams();
  const [venueStatus, setVenueStatus] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [venueAdministrators, setVenueAdministrators] = useState<any[]>([]);
  const [selectedVenueAdmin, setSelectedVenueAdmin] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenueData();
    loadVenueAdministrators();
  }, [venueId]);

  // Refresh admin data whenever this page comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Venue details page focused, refreshing admin data...");
      loadVenueAdministrators();
    }, [venueId])
  );

  const loadVenueData = async () => {
    try {
      setLoading(true);
      if (!venueId) {
        Alert.alert("Error", "Venue ID not found");
        return;
      }

      const { data, error } = await fetchCompleteVenueDetails(parseInt(venueId as string));
      if (error || !data) {
        Alert.alert("Error", "Failed to load venue details");
        console.error(error);
        return;
      }

      console.log("📋 Venue details loaded:", data);
      console.log("🖼️ Images:", data.images);
      console.log("📐 Floor Plans:", data.floorPlans);
      
      setVenueData(data);
      setVenueStatus(data.venue?.is_active || false);
    } catch (err: any) {
      console.error("Error loading venue data:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVenueAdministrators = async () => {
    try {
      setAdminLoading(true);
      const { data, error } = await fetchVenueAdministrators();
      if (error) {
        Alert.alert("Error", "Failed to load venue administrators");
      } else {
        setVenueAdministrators(data || []);
      }

      // Load which admin is assigned to this venue
      if (venueId) {
        const numVenueId = parseInt(venueId as string);
        const { data: assignment } = await supabase
          .from('venue_admin_assignments')
          .select(`
            *,
            venue_administrators(
              *,
              users(user_id, email, first_name, last_name, phone_number)
            )
          `)
          .eq('venue_id', numVenueId)
          .single();
        
        if (assignment?.venue_administrators) {
          console.log('👤 Assigned venue admin:', assignment.venue_administrators);
          setSelectedVenueAdmin(assignment.venue_administrators);
        }
      }
    } catch (err: any) {
      console.error("Error loading administrators:", err);
      Alert.alert("Error", err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const theme = isDarkMode ? Palette.dark : Palette.light;

  // Helper functions to extract data from the fetched records
  const getDimension = (name: string) => {
    const spec = venueData?.specifications?.find((s: any) => s.specification_name === name);
    return spec?.specification_value || "N/A";
  };

  const getContacts = () => {
    const email = venueData?.contacts?.find((c: any) => c.contact_type === "Email");
    const phone = venueData?.contacts?.find((c: any) => c.contact_type === "Phone");
    return { email: email?.contact_value || "N/A", phone: phone?.contact_value || "N/A" };
  };

  const getBasePricing = () => {
    const rate = venueData?.baseRates?.[0];
    return {
      basePrice: rate?.base_price || 0,
      weekendPrice: rate?.weekend_price || 0,
      holidayPrice: rate?.holiday_price || 0,
      minHours: rate?.min_hours || 0,
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={[styles.mainContainer, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={Palette.primary} />
        </View>
      </View>
    );
  }

  if (!venueData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={[styles.mainContainer, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={[{ color: theme.text, fontSize: 18 }]}>Venue not found</Text>
        </View>
      </View>
    );
  }

  const contacts = getContacts();
  const pricing = getBasePricing();

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
                <Text style={[styles.venueName, { color: theme.text }]}>{venueData.venue?.venue_name}</Text>
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
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: Palette.primary }]} onPress={() => router.push(`./edit_venue?venueId=${venueData.venue?.venue_id}`)}>
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
              <Text style={[styles.infoText, { color: theme.text }]}>
                {venueData.venue?.street_address}, {venueData.venue?.city}, {venueData.venue?.province}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={18} color={Palette.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>Capacity: {venueData.venue?.max_capacity} people</Text>
            </View>
          </View>

          {/* Gallery Section */}
          {venueData?.images && venueData.images.length > 0 ? (
            <View style={styles.gallerySection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Gallery</Text>
              
              {/* Main Image */}
              <Image source={{ uri: venueData.images[selectedImage]?.image_path }} style={[styles.mainImage, { borderRadius: 12 }]} />

              {/* Thumbnail Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                {venueData.images.map((image: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnail,
                      selectedImage === index && { borderWidth: 3, borderColor: Palette.primary },
                    ]}
                    onPress={() => setSelectedImage(index)}
                  >
                    <Image source={{ uri: image.image_path }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.gallerySection, { alignItems: "center", justifyContent: "center", paddingVertical: 24 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Gallery</Text>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="image" size={48} color={theme.textSecondary} />
                <Text style={[styles.specificationText, { color: theme.textSecondary, textAlign: "center", marginTop: 12 }]}>No images uploaded</Text>
              </View>
            </View>
          )}

          {/* Key Information Grid */}
          <View style={styles.gridSection}>
            {/* Venue Information */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Venue Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Venue Type</Text>
                <View style={[styles.pill, { backgroundColor: Palette.primary + "20" }]}>
                  <Text style={[styles.pillText, { color: Palette.primary }]}>
                    {venueData.venueTypes?.[0]?.venue_types?.type_name || "General"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Capacity</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{venueData.venue?.max_capacity} people</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Location</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {venueData.venue?.barangay}, {venueData.venue?.city}
                </Text>
              </View>
            </View>

            {/* Contact Information */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Contact Information</Text>
              
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail" size={20} color={Palette.primary} />
                <Text style={[styles.contactText, { color: Palette.blue }]}>{contacts.email}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call" size={20} color={Palette.primary} />
                <Text style={[styles.contactText, { color: Palette.blue }]}>{contacts.phone}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Venue Administrator */}
          <View style={[styles.techSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Administrator</Text>
            {!adminLoading && venueAdministrators.length > 0 ? (
              <View style={styles.adminInfo}>
                <Text style={[styles.adminLabel, { color: theme.text }]}>Assigned Administrator</Text>
                <View style={[styles.adminCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                  {selectedVenueAdmin ? (
                    <>
                      <Text style={[styles.adminName, { color: theme.text }]}>
                        {selectedVenueAdmin?.users?.first_name} {selectedVenueAdmin?.users?.last_name}
                      </Text>
                      <Text style={[styles.adminEmail, { color: theme.textSecondary }]}>
                        {selectedVenueAdmin?.users?.email}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.adminName, { color: theme.text }]}>No administrator assigned</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading administrators...</Text>
            )}
          </View>

          {/* Technical Specifications */}
          <View style={[styles.techSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Technical Specifications</Text>
            
            {/* Dimensions */}
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>Dimensions</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Length</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{getDimension("Length")} m</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Width</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{getDimension("Width")} m</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Floor Area</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{getDimension("Floor Area")} sqm</Text>
              </View>
              <View style={styles.dimensionItem}>
                <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Ceiling Height</Text>
                <Text style={[styles.dimensionValue, { color: theme.text }]}>{getDimension("Ceiling Height")} m</Text>
              </View>
            </View>

            {/* Venue Specifications */}
            <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>Venue Specifications</Text>
            <Text style={[styles.specificationText, { color: theme.text }]}>
              {getDimension("Specifications")}
            </Text>

            {/* Door Placement */}
            {venueData.doors && venueData.doors.length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>Door Placement</Text>
                {venueData.doors.map((door: any, index: number) => (
                  <View key={index} style={[styles.doorCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                    <Text style={[styles.doorTitle, { color: theme.text }]}>Door {index + 1}: {door.door_type}</Text>
                    <View style={styles.doorDetails}>
                      <Text style={[styles.doorDetail, { color: theme.text }]}>Width: {door.width}m</Text>
                      <Text style={[styles.doorDetail, { color: theme.text }]}>Height: {door.height}m</Text>
                      <Text style={[styles.doorDetail, { color: theme.text }]}>Position: {door.corner_position}</Text>
                      <Text style={[styles.doorDetail, { color: theme.text }]}>Swing: {door.swing_direction}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Allowed Event Types */}
            {venueData.allowedEventTypes && venueData.allowedEventTypes.length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>Allowed Event Types</Text>
                <View style={styles.tagsRow}>
                  {venueData.allowedEventTypes.map((type: any, index: number) => (
                    <View key={index} style={[styles.tag, { backgroundColor: Palette.blue + "20", borderColor: Palette.blue }]}>
                      <Text style={[styles.tagText, { color: Palette.blue }]}>
                        {type.event_categories?.category_name || "Unknown"}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Facilities & Inclusions */}
          {venueData.facilities && venueData.facilities.length > 0 && (
            <View style={[styles.facilitiesSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Facilities & Inclusions</Text>
              <View style={styles.facilitiesGrid}>
                {venueData.facilities.map((facility: any, index: number) => (
                  <View key={index} style={[styles.facilityTag, { backgroundColor: Palette.primary + "20", borderColor: Palette.primary }]}>
                    <Text style={[styles.facilityTagText, { color: Palette.primary }]}>{facility.facility_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pricing & Packages */}
          <View style={[styles.pricingSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing & Packages</Text>
            
            <View style={styles.rateTypeRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Rate Type:</Text>
              <View style={[styles.pill, { backgroundColor: Palette.primary + "20" }]}>
                <Text style={[styles.pillText, { color: Palette.primary }]}>Hourly</Text>
              </View>
            </View>

            <Text style={[styles.priceBreakdownTitle, { color: theme.text, marginTop: 16 }]}>Price Breakdown</Text>
            
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Base Rate</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>₱{pricing.basePrice?.toFixed(2) || "0.00"}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Weekend Rate</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>₱{pricing.weekendPrice?.toFixed(2) || "0.00"}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Holiday Rate</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>₱{pricing.holidayPrice?.toFixed(2) || "0.00"}</Text>
            </View>

            {venueData.overtimeRates && venueData.overtimeRates.length > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Overtime Rate</Text>
                <Text style={[styles.priceValue, { color: theme.text }]}>₱{venueData.overtimeRates[0]?.price_per_hour?.toFixed(2) || "0.00"}/hr</Text>
              </View>
            )}

            {/* Pricing Packages */}
            {venueData.packages && venueData.packages.length > 0 && (
              <>
                <Text style={[styles.priceBreakdownTitle, { color: theme.text, marginTop: 20 }]}>Available Packages</Text>
                {venueData.packages.map((pkg: any, index: number) => (
                  <View key={index} style={[styles.packageCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                    <View style={styles.packageHeader}>
                      <Text style={[styles.packageName, { color: theme.text }]}>{pkg.package_name}</Text>
                      <Text style={[styles.packagePrice, { color: Palette.green }]}>₱{pkg.base_price?.toFixed(2)}</Text>
                    </View>
                    <Text style={[styles.packageDuration, { color: theme.textSecondary }]}>{pkg.duration_hours} hours</Text>
                    {pkg.description && (
                      <Text style={[styles.packageDescription, { color: theme.text }]}>{pkg.description}</Text>
                    )}
                    {venueData.packageInclusions?.filter((inc: any) => inc.package_id === pkg.package_id).length > 0 && (
                      <View style={styles.inclusionsList}>
                        <Text style={[styles.inclusionsTitle, { color: theme.text }]}>Inclusions:</Text>
                        {venueData.packageInclusions
                          ?.filter((inc: any) => inc.package_id === pkg.package_id)
                          .map((inclusion: any, incIndex: number) => (
                            <Text key={incIndex} style={[styles.inclusionItem, { color: theme.text }]}>
                              • {inclusion.inclusion_name}
                            </Text>
                          ))}
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Rules & Regulations */}
          {venueData.rules && venueData.rules.length > 0 && (
            <View style={[styles.rulesSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Regulations</Text>
              {venueData.rules.map((rule: any, index: number) => (
                <Text key={index} style={[styles.ruleText, { color: theme.text }]}>
                  {rule.rule_text}
                </Text>
              ))}
            </View>
          )}

          {/* Floor Plans */}
          {venueData?.floorPlans && venueData.floorPlans.length > 0 ? (
            <View style={[styles.floorPlanSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Floor Plans</Text>
              {venueData.floorPlans.map((plan: any, index: number) => (
                <View key={index} style={styles.floorPlanCard}>
                  <Image source={{ uri: plan.floor_plan_file }} style={styles.floorPlanImage} />
                  <Text style={[styles.floorPlanInfo, { color: theme.text }]}>
                    {plan.length}m × {plan.width}m ({plan.area_sqm} sqm)
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.floorPlanSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Floor Plans</Text>
              <Text style={[styles.specificationText, { color: theme.textSecondary }]}>No floor plans uploaded</Text>
            </View>
          )}
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
  adminInfo: {
    marginTop: 12,
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  adminCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  adminName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 12,
  },
  specificationText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  doorCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  doorTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  doorDetails: {
    gap: 4,
  },
  doorDetail: {
    fontSize: 12,
    lineHeight: 18,
  },
  packageCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  packageName: {
    fontSize: 13,
    fontWeight: "600",
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: "bold",
  },
  packageDuration: {
    fontSize: 12,
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  inclusionsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  inclusionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  inclusionItem: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
  },
  rulesSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  floorPlanSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  floorPlanCard: {
    marginTop: 12,
  },
  floorPlanImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginBottom: 8,
  },
  floorPlanInfo: {
    fontSize: 13,
    fontWeight: "500",
  },
});
