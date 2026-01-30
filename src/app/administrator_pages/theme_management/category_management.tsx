import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import { useTheme } from "../../../context/theme-context";
import { supabase } from "../../../services/supabase";

export default function CategoryManagement() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("event_categories")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (err) throw err;
      
      const formattedCategories = data?.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        createdDate: cat.created_at ? cat.created_at.split("T")[0] : "",
        lastUpdated: cat.updated_at ? cat.updated_at.split("T")[0] : "",
      })) || [];
      
      setCategories(formattedCategories);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", "Failed to load categories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const { data, error: err } = await supabase
          .from("event_categories")
          .insert([
            {
              category_name: newCategoryName,
            },
          ])
          .select();
        
        if (err) throw err;
        
        if (data && data.length > 0) {
          const newCategory = {
            id: data[0].category_id,
            name: data[0].category_name,
            createdDate: data[0].created_at ? data[0].created_at.split("T")[0] : "",
            lastUpdated: data[0].updated_at ? data[0].updated_at.split("T")[0] : "",
          };
          setCategories([newCategory, ...categories]);
          setNewCategoryName("");
          setShowAddModal(false);
          Alert.alert("Success", "Category added successfully!");
        }
      } catch (err: any) {
        Alert.alert("Error", "Failed to add category: " + err.message);
      }
    }
  };

  const handleCancelModal = () => {
    setNewCategoryName("");
    setShowAddModal(false);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setShowEditModal(true);
  };

  const handleSaveEditCategory = async () => {
    if (editCategoryName.trim() && editingCategory) {
      try {
        const { error: err } = await supabase
          .from("event_categories")
          .update({
            category_name: editCategoryName,
          })
          .eq("category_id", editingCategory.id);
        
        if (err) throw err;
        
        setCategories(
          categories.map((cat) =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: editCategoryName,
                  lastUpdated: new Date().toISOString().split("T")[0],
                }
              : cat
          )
        );
        setShowEditModal(false);
        setEditingCategory(null);
        setEditCategoryName("");
        Alert.alert("Success", "Category updated successfully!");
      } catch (err: any) {
        Alert.alert("Error", "Failed to update category: " + err.message);
      }
    }
  };

  const handleCancelEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const handleDeleteCategory = (categoryId: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const { error: err } = await supabase
                .from("event_categories")
                .delete()
                .eq("category_id", categoryId);
              
              if (err) throw err;
              
              setCategories(categories.filter((cat) => cat.id !== categoryId));
              Alert.alert("Success", "Category deleted successfully!");
            } catch (err: any) {
              Alert.alert("Error", "Failed to delete category: " + err.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const filteredCategories = categories
    .filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Category Management</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage event categories for themes and events</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          {/* Search Section and Filter */}
          <View style={[styles.filterSection, { zIndex: 100, marginBottom: 24 }]}>
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
          </View>

          {/* Categories Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 2 }]}>Category Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.5 }]}>Created Date</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.5 }]}>Last Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Actions</Text>
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
                  <Text style={[styles.cellText, { color: theme.text, flex: 2, fontWeight: "500" }]}>{category.name}</Text>

                  {/* Created Date */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.5 }]}>{category.createdDate}</Text>

                  {/* Last Updated */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.5 }]}>{category.lastUpdated}</Text>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 1, justifyContent: "center" }]}>
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
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={handleCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Category</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new event category</Text>
              </View>
              <TouchableOpacity onPress={handleCancelModal}>
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
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={handleCancelModal}>
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAddCategory}>
                <Ionicons name="checkmark" size={18} color={Palette.black} />
                <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={handleCancelEditModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Category</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update category details</Text>
              </View>
              <TouchableOpacity onPress={handleCancelEditModal}>
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
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={handleCancelEditModal}>
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEditCategory}>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
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
