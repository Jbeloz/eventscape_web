import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import { useTheme } from "../../../context/theme-context";
import { fetchVenues } from "../../../services/venueService";

export default function AllVenues() {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [capacityDropdownOpen, setCapacityDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    loadVenues();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [])
  );

  const loadVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchVenues();
      
      if (error) {
        setError(error);
        Alert.alert("Error", error);
      } else {
        setVenues(data || []);
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableLocations = ["Manila", "Cebu", "Davao", "Quezon City"];
  const availableTypes = ["Convention Center", "Banquet Hall", "Hotel Ballroom", "Garden Venue"];
  const availableCapacities = ["0-100", "100-300", "300-500", "500+"];

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch = venue.venue_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      venue.city?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesLocation = !locationFilter || venue.city?.includes(locationFilter);
    const matchesCapacity = !capacityFilter || checkCapacityRange(venue.max_capacity, capacityFilter);
    const matchesStatus = !statusFilter || (statusFilter === "Active" ? venue.is_active : !venue.is_active);

    return matchesSearch && matchesLocation && matchesCapacity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "Name (A-Z)") return (a.venue_name || "").localeCompare(b.venue_name || "");
    if (sortBy === "Name (Z-A)") return (b.venue_name || "").localeCompare(a.venue_name || "");
    if (sortBy === "Capacity (Low-High)") return (a.max_capacity || 0) - (b.max_capacity || 0);
    if (sortBy === "Capacity (High-Low)") return (b.max_capacity || 0) - (a.max_capacity || 0);
    return 0;
  });

  const checkCapacityRange = (capacity: number, range: string) => {
    if (range === "0-100") return capacity <= 100;
    if (range === "100-300") return capacity > 100 && capacity <= 300;
    if (range === "300-500") return capacity > 300 && capacity <= 500;
    if (range === "500+") return capacity > 500;
    return true;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(word => word[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading venues...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.text }]}>All Venues</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage and view all event venues</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => router.push("./add_venue")}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Venue</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filter Section */}
          <View style={[styles.filterSection, { zIndex: 100 }]}>
            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name, location, or venue type..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* Filters Row */}
          <View style={[styles.filterRow, { zIndex: 99 }]}>
            {/* Location Filter */}
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setLocationDropdownOpen(!locationDropdownOpen)}
            >
              <Ionicons name="location" size={16} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: locationFilter ? Palette.primary : theme.textSecondary }]}>
                {locationFilter || "All Locations"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {locationDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {availableLocations.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setLocationFilter(loc === locationFilter ? null : loc);
                      setLocationDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Type Filter */}
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
            >
              <Ionicons name="business" size={16} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: typeFilter ? Palette.primary : theme.textSecondary }]}>
                {typeFilter || "All Types"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {typeDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {availableTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setTypeFilter(type === typeFilter ? null : type);
                      setTypeDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Capacity Filter */}
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setCapacityDropdownOpen(!capacityDropdownOpen)}
            >
              <Ionicons name="people" size={16} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: capacityFilter ? Palette.primary : theme.textSecondary }]}>
                {capacityFilter || "All Capacities"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {capacityDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {availableCapacities.map((cap) => (
                  <TouchableOpacity
                    key={cap}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCapacityFilter(cap === capacityFilter ? null : cap);
                      setCapacityDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{cap}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Status Filter */}
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <Ionicons name="filter" size={16} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: statusFilter ? Palette.primary : theme.textSecondary }]}>
                {statusFilter || "All Status"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {statusDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {["Active", "Inactive"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatusFilter(status === statusFilter ? null : status);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sort Dropdown */}
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <Ionicons name="swap-vertical" size={16} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: theme.text }]}>{sortBy}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {sortDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {["Name (A-Z)", "Name (Z-A)", "Capacity (Low-High)", "Capacity (High-Low)"].map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortBy(sort);
                      setSortDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{sort}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Venues Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Thumbnail</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.5 }]}>Venue Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Location</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Capacity</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Venue Type</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredVenues.map((venue) => (
                <View key={venue.venue_id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Thumbnail */}
                  <View style={{ flex: 0.8 }}>
                    <View style={[styles.thumbnail, { backgroundColor: Palette.primary, justifyContent: "center", alignItems: "center" }]}>
                      {venue.images && venue.images.length > 0 ? (
                        <Image source={{ uri: venue.images[0]?.image_path }} style={{ width: "100%", height: "100%", borderRadius: 4 }} />
                      ) : (
                        <>
                          <Ionicons name="image" size={20} color={Palette.light.text} style={{ marginBottom: 4 }} />
                          <Text style={styles.thumbnailText}>{getInitials(venue.venue_name || "")}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Venue Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.5 }]}>{venue.venue_name}</Text>

                  {/* Location */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2 }]}>{venue.city}, {venue.province}</Text>

                  {/* Capacity */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 0.8 }]}>{venue.max_capacity}</Text>

                  {/* Venue Type */}
                  <View style={{ flex: 1 }}>
                    <View style={[styles.typeBadge, { backgroundColor: Palette.primary + "20" }]}>
                      <Text style={[styles.typeBadgeText, { color: Palette.primary }]}>{venue.country}</Text>
                    </View>
                  </View>

                  {/* Status Toggle */}
                  <View style={{ flex: 0.8, justifyContent: "center", alignItems: "center" }}>
                    <Switch value={venue.is_active} disabled trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                  </View>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 0.8 }]}>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => router.push(`./venue_details?venueId=${venue.venue_id}`)}
                    >
                      <Ionicons name="eye" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => router.push(`./edit_venue?venueId=${venue.venue_id}`)}
                    >
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: Palette.black,
    fontSize: 14,
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 24,
    zIndex: 100,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
    zIndex: 99,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    minWidth: 120,
  },
  filterButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 99999,
    elevation: 100,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  dropdownItemText: {
    fontSize: 14,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  columnHeader: {
    fontWeight: "600",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  thumbnailText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  cellText: {
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsColumn: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionIcon: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
