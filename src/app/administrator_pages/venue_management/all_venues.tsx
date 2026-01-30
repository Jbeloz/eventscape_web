import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import { useTheme } from "../../../context/theme-context";

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

  // Mock data - replace with actual API calls
  const mockVenues = [
    {
      id: 1,
      name: "Convention Hall A",
      location: "Business District, Chicago",
      capacity: 1200,
      type: "Convention Center",
      status: true,
      thumbnail: "https://images.unsplash.com/photo-1519167758993-c5924266c810?w=200&h=200&fit=crop",
    },
    {
      id: 2,
      name: "Executive Meeting Room",
      location: "Business Tower, Boston",
      capacity: 50,
      type: "Meeting Room",
      status: false,
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop",
    },
    {
      id: 3,
      name: "Garden Paradise",
      location: "Countryside, California",
      capacity: 200,
      type: "Outdoor Garden",
      status: true,
      thumbnail: "https://images.unsplash.com/photo-1519671482677-0ac3dba0ef0e?w=200&h=200&fit=crop",
    },
    {
      id: 4,
      name: "Grand Ballroom",
      location: "Downtown City Center, New York",
      capacity: 500,
      type: "Banquet Hall",
      status: true,
      thumbnail: "https://images.unsplash.com/photo-1519671482677-0ac3dba0ef0e?w=200&h=200&fit=crop",
    },
  ];

  const availableLocations = ["Business District", "Downtown", "Countryside", "Business Tower"];
  const availableTypes = ["Convention Center", "Meeting Room", "Outdoor Garden", "Banquet Hall"];
  const availableCapacities = ["0-100", "100-300", "300-500", "500+"];

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from("venues")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      
      // For now, using mock data
      setVenues(mockVenues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch = venue.name.toLowerCase().includes(searchText.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesLocation = !locationFilter || venue.location.includes(locationFilter);
    const matchesType = !typeFilter || venue.type === typeFilter;
    const matchesCapacity = !capacityFilter || checkCapacityRange(venue.capacity, capacityFilter);
    const matchesStatus = !statusFilter || (statusFilter === "Active" ? venue.status : !venue.status);

    return matchesSearch && matchesLocation && matchesType && matchesCapacity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "Name (A-Z)") return a.name.localeCompare(b.name);
    if (sortBy === "Name (Z-A)") return b.name.localeCompare(a.name);
    if (sortBy === "Capacity (Low-High)") return a.capacity - b.capacity;
    if (sortBy === "Capacity (High-Low)") return b.capacity - a.capacity;
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
            {filteredVenues.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No venues found</Text>
              </View>
            ) : (
              filteredVenues.map((venue) => (
                <View key={venue.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Thumbnail */}
                  <View style={{ flex: 0.8 }}>
                    {venue.thumbnail ? (
                      <Image source={{ uri: venue.thumbnail }} style={[styles.thumbnail, { borderRadius: 8 }]} />
                    ) : (
                      <View style={[styles.thumbnail, { backgroundColor: Palette.primary, justifyContent: "center", alignItems: "center" }]}>
                        <Text style={styles.thumbnailText}>{getInitials(venue.name)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Venue Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.5 }]}>{venue.name}</Text>

                  {/* Location */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2 }]}>{venue.location}</Text>

                  {/* Capacity */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 0.8 }]}>{venue.capacity}</Text>

                  {/* Venue Type */}
                  <View style={{ flex: 1 }}>
                    <View style={[styles.typeBadge, { backgroundColor: Palette.primary + "20" }]}>
                      <Text style={[styles.typeBadgeText, { color: Palette.primary }]}>{venue.type}</Text>
                    </View>
                  </View>

                  {/* Status Toggle */}
                  <View style={{ flex: 0.8, justifyContent: "center", alignItems: "center" }}>
                    <Switch value={venue.status} disabled trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                  </View>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 0.8 }]}>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => router.push(`./venue_details?venueId=${venue.id}`)}
                    >
                      <Ionicons name="eye" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => router.push(`./edit_venue?venueId=${venue.id}`)}
                    >
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
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
