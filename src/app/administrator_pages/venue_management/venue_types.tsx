import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
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

export default function VenueTypes() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newVenueTypeName, setNewVenueTypeName] = useState("");
  const [newVenueTypeDescription, setNewVenueTypeDescription] = useState("");
  const [editingVenueType, setEditingVenueType] = useState<any>(null);
  const [editVenueTypeName, setEditVenueTypeName] = useState("");
  const [editVenueTypeDescription, setEditVenueTypeDescription] = useState("");
  
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  // Mock data - replace with actual API calls
  const mockVenueTypes = [
    {
      id: 1,
      name: "Convention Center",
      description: "Large venue for conferences and conventions",
      venueCount: 12,
      isActive: true,
    },
    {
      id: 2,
      name: "Meeting Room",
      description: "Intimate rooms for business meetings",
      venueCount: 25,
      isActive: true,
    },
    {
      id: 3,
      name: "Outdoor Garden",
      description: "Garden spaces for outdoor events",
      venueCount: 8,
      isActive: true,
    },
    {
      id: 4,
      name: "Banquet Hall",
      description: "Elegant halls for formal events and banquets",
      venueCount: 15,
      isActive: false,
    },
    {
      id: 5,
      name: "Wedding Venue",
      description: "Specialized venues for wedding ceremonies",
      venueCount: 18,
      isActive: true,
    },
    {
      id: 6,
      name: "Corporate Event Space",
      description: "Modern spaces for corporate functions",
      venueCount: 10,
      isActive: true,
    },
  ];

  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from("venue_types")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      
      // For now, using mock data
      setVenueTypes(mockVenueTypes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenueType = () => {
    if (newVenueTypeName.trim()) {
      const newType = {
        id: Math.max(...venueTypes.map(t => t.id), 0) + 1,
        name: newVenueTypeName,
        description: newVenueTypeDescription,
        venueCount: 0,
        isActive: true,
      };
      setVenueTypes([...venueTypes, newType]);
      setNewVenueTypeName("");
      setNewVenueTypeDescription("");
      setShowAddModal(false);
    }
  };

  const handleCancelModal = () => {
    setNewVenueTypeName("");
    setNewVenueTypeDescription("");
    setShowAddModal(false);
  };

  const handleEditVenueType = (venueType: any) => {
    setEditingVenueType(venueType);
    setEditVenueTypeName(venueType.name);
    setEditVenueTypeDescription(venueType.description);
    setShowEditModal(true);
  };

  const handleSaveEditVenueType = () => {
    if (editVenueTypeName.trim() && editingVenueType) {
      setVenueTypes(
        venueTypes.map((type) =>
          type.id === editingVenueType.id
            ? { ...type, name: editVenueTypeName, description: editVenueTypeDescription }
            : type
        )
      );
      setShowEditModal(false);
      setEditingVenueType(null);
      setEditVenueTypeName("");
      setEditVenueTypeDescription("");
    }
  };

  const handleCancelEditModal = () => {
    setShowEditModal(false);
    setEditingVenueType(null);
    setEditVenueTypeName("");
    setEditVenueTypeDescription("");
  };

  const filteredVenueTypes = venueTypes.filter((type) => {
    const matchesSearch = type.name.toLowerCase().includes(searchText.toLowerCase()) ||
      type.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "Name (A-Z)") return a.name.localeCompare(b.name);
    if (sortBy === "Name (Z-A)") return b.name.localeCompare(a.name);
    if (sortBy === "Venues (Low-High)") return a.venueCount - b.venueCount;
    if (sortBy === "Venues (High-Low)") return b.venueCount - a.venueCount;
    return 0;
  });

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
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading venue types...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Venue Type Management</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage venue categories for the system</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Venue Type</Text>
            </TouchableOpacity>
          </View>

          {/* Search Section and Sort */}
          <View style={[styles.filterSection, { zIndex: 100, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, flex: 1, marginBottom: 0 }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search venue types..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            
            <View style={[styles.filterRow, { zIndex: 99, marginLeft: 12, marginBottom: 0 }]}>
              <TouchableOpacity
                style={[styles.sortButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <Text style={[styles.sortButtonText, { color: theme.text }]}>{sortBy}</Text>
              </TouchableOpacity>

              {sortDropdownOpen && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {["Name (A-Z)", "Name (Z-A)", "Venues (Low-High)", "Venues (High-Low)"].map((sort) => (
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
          </View>

          {/* Venue Types Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 2 }]}>Venue Type Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 2.5 }]}>Description</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredVenueTypes.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No venue types found</Text>
              </View>
            ) : (
              filteredVenueTypes.map((type) => (
                <View key={type.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Type Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 2, fontWeight: "500" }]}>{type.name}</Text>

                  {/* Description */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 2.5 }]} numberOfLines={2}>
                    {type.description}
                  </Text>

                  {/* Status Toggle with Label */}
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-start" }}>
                    <View style={styles.statusContainer}>
                      <Switch value={type.isActive} disabled trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                      <Text style={[styles.statusLabel, { color: type.isActive ? Palette.green : theme.textSecondary }]}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 0.8 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditVenueType(type)}>
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

      {/* Add Venue Type Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Venue Type</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new venue category</Text>
              </View>
              <TouchableOpacity onPress={handleCancelModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Venue Type Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter venue type name"
                  placeholderTextColor={theme.textSecondary}
                  value={newVenueTypeName}
                  onChangeText={setNewVenueTypeName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={newVenueTypeDescription}
                  onChangeText={setNewVenueTypeDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={handleCancelModal}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                onPress={handleAddVenueType}
              >
                <Ionicons name="checkmark" size={18} color={Palette.black} />
                <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Venue Type Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Venue Type</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update venue category details</Text>
              </View>
              <TouchableOpacity onPress={handleCancelEditModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Venue Type Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter venue type name"
                  placeholderTextColor={theme.textSecondary}
                  value={editVenueTypeName}
                  onChangeText={setEditVenueTypeName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={editVenueTypeDescription}
                  onChangeText={setEditVenueTypeDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={handleCancelEditModal}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                onPress={handleSaveEditVenueType}
              >
                <Ionicons name="checkmark" size={18} color={Palette.black} />
                <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  cellText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
