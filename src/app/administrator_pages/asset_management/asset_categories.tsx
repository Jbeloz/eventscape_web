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

export default function AssetCategories() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Add Category Modal State
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("Active");

  // Edit Category Modal State
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryStatus, setEditCategoryStatus] = useState("Active");

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  const mockCategories = [
    {
      id: 1,
      name: "Chairs",
      description: "All types of seating furniture",
      status: "Active",
      assetCount: 12,
      createdDate: "2024-01-10",
      lastUpdated: "2024-01-15",
    },
    {
      id: 2,
      name: "Tables",
      description: "Dining and event tables",
      status: "Active",
      assetCount: 8,
      createdDate: "2024-01-10",
      lastUpdated: "2024-01-20",
    },
    {
      id: 3,
      name: "Lighting",
      description: "Lighting fixtures and equipment",
      status: "Active",
      assetCount: 15,
      createdDate: "2024-01-10",
      lastUpdated: "2024-01-18",
    },
    {
      id: 4,
      name: "Decorations",
      description: "Decorative elements and accessories",
      status: "Active",
      assetCount: 20,
      createdDate: "2024-01-12",
      lastUpdated: "2024-01-22",
    },
    {
      id: 5,
      name: "Stage Equipment",
      description: "Stage and performance equipment",
      status: "Inactive",
      assetCount: 5,
      createdDate: "2024-01-15",
      lastUpdated: "2024-01-20",
    },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setCategories(mockCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (categoryName.trim()) {
      const newCategory = {
        id: Math.max(...categories.map(c => c.id), 0) + 1,
        name: categoryName,
        description: categoryDescription,
        status: categoryStatus,
        assetCount: 0,
        createdDate: new Date().toISOString().split("T")[0],
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      setCategories([...categories, newCategory]);
      resetAddModal();
      setShowAddModal(false);
    }
  };

  const resetAddModal = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryStatus("Active");
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description);
    setEditCategoryStatus(category.status);
    setShowEditModal(true);
  };

  const handleSaveEditCategory = () => {
    if (editCategoryName.trim() && editingCategory) {
      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: editCategoryName,
                description: editCategoryDescription,
                status: editCategoryStatus,
                lastUpdated: new Date().toISOString().split("T")[0],
              }
            : c
        )
      );
      setShowEditModal(false);
      setEditingCategory(null);
    }
  };

  const handleToggleStatus = (categoryId: number) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? { ...c, status: c.status === "Active" ? "Inactive" : "Active", lastUpdated: new Date().toISOString().split("T")[0] }
          : c
      )
    );
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategories(categories.filter((c) => c.id !== categoryId));
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading categories...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Asset Categories</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage asset categories and classifications</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by category name..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <Text style={[styles.filterButtonText, { color: theme.text }]}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {statusDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 999 }]}>
                {["All Status", "Active", "Inactive"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatusFilter(status);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Categories Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Category Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.5 }]}>Description</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Assets</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created Date</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Last Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredCategories.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No categories found</Text>
              </View>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Category Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2, fontWeight: "500" }]}>
                    {category.name}
                  </Text>

                  {/* Description */}
                  <Text
                    style={[styles.cellText, { color: theme.textSecondary, flex: 1.5 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {category.description}
                  </Text>

                  {/* Asset Count */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.8, textAlign: "center" }]}>
                    {category.assetCount}
                  </Text>

                  {/* Status */}
                  <View style={{ flex: 0.8, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: category.status === "Active" ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={category.status === "Active"}
                        onValueChange={() => handleToggleStatus(category.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                      />
                      <Text style={[styles.statusText, { color: category.status === "Active" ? Palette.green : theme.textSecondary }]}>
                        {category.status}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>
                    {category.createdDate}
                  </Text>

                  {/* Last Updated */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>
                    {category.lastUpdated}
                  </Text>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Ionicons name="eye" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditCategory(category)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteCategory(category.id)}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Category Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Category</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new asset category</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter category name"
                    placeholderTextColor={theme.textSecondary}
                    value={categoryName}
                    onChangeText={setCategoryName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter category description"
                    placeholderTextColor={theme.textSecondary}
                    value={categoryDescription}
                    onChangeText={setCategoryDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: theme.text }]}>
                      {categoryStatus}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetAddModal();
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                  onPress={handleAddCategory}
                >
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Category</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update category details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter category name"
                    placeholderTextColor={theme.textSecondary}
                    value={editCategoryName}
                    onChangeText={setEditCategoryName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter category description"
                    placeholderTextColor={theme.textSecondary}
                    value={editCategoryDescription}
                    onChangeText={setEditCategoryDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: theme.text }]}>
                      {editCategoryStatus}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                  onPress={handleSaveEditCategory}
                >
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 140,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  cellText: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  actionsColumn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
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
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalScroll: {
    flex: 1,
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
    marginBottom: 16,
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
  formDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  dropdownPlaceholder: {
    fontSize: 14,
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
