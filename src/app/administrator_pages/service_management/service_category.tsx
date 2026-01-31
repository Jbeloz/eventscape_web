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

export default function ServiceCategories() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
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
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("service_categories")
        .select("*")
        .order("category_id", { ascending: true });
      if (fetchError) throw fetchError;
      const mapped = (data || []).map((d: any) => ({
        id: d.category_id,
        name: d.category_name,
        created_at: d.created_at ? d.created_at.split("T")[0] : null,
        updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
      }));
      setCategories(mapped);
    } catch (err: any) {
      console.error("fetchCategories error", err);
      setError(err.message || "Failed to load service categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("service_categories")
        .insert([{ category_name: newCategoryName.trim() }])
        .select();
      if (insertError) throw insertError;
      if (data && data[0]) {
        const d = data[0];
        setCategories((prev) => [
          ...prev,
          {
            id: d.category_id,
            name: d.category_name,
            created_at: d.created_at ? d.created_at.split("T")[0] : null,
            updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
          },
        ]);
      }
      setNewCategoryName("");
      setShowAddModal(false);
    } catch (err: any) {
      console.error("addCategory error", err);
      if (err?.code === "23505" || /unique/i.test(err?.message || "")) {
        setError("Category name already exists.");
      } else {
        setError(err.message || "Failed to add category");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setShowEditModal(true);
  };

  const handleSaveEditCategory = async () => {
    if (!editCategoryName.trim() || !editingCategory) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("service_categories")
        .update({ category_name: editCategoryName.trim() })
        .eq("category_id", editingCategory.id)
        .select();
      if (updateError) throw updateError;
      if (data && data[0]) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? {
                  id: data[0].category_id,
                  name: data[0].category_name,
                  created_at: data[0].created_at ? data[0].created_at.split("T")[0] : null,
                  updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : null,
                }
              : c
          )
        );
      } else {
        await fetchCategories();
      }
      setShowEditModal(false);
      setEditingCategory(null);
    } catch (err: any) {
      console.error("updateCategory error", err);
      if (err?.code === "23505" || /unique/i.test(err?.message || "")) {
        setError("Category name already exists.");
      } else {
        setError(err.message || "Failed to update category");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Category", "Are you sure you want to delete this category?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteCategory(id) },
    ]);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase.from("service_categories").delete().eq("category_id", id);
      if (deleteError) throw deleteError;
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error("deleteCategory error", err);
      setError(err.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
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
          <View style={styles.titleSection}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.text }]}>Service Categories</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage service categories</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: Palette.red, backgroundColor: isDarkMode ? '#3f1f1f' : '#ffefef' }]}> 
              <Text style={{ color: Palette.red, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search categories..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.8 }]}>Category Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No categories found</Text>
              </View>
            ) : (
              filtered.map((c) => (
                <View key={c.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.8, fontWeight: "500" }]}>{c.name}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{c.created_at}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{c.updated_at}</Text>

                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditCategory(c)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => confirmDelete(c.id)}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Category</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new service category</Text>
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
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewCategoryName("");
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAddCategory}>
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Category</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update category name</Text>
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
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEditCategory}>
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
  container: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, padding: 16 },
  titleSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  createButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  createButtonText: { color: Palette.black, fontSize: 14, fontWeight: "600" },
  filterSection: { flexDirection: "row", gap: 12, marginBottom: 24, alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 8, flex: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  tableContainer: { borderRadius: 8, overflow: "hidden", borderWidth: 1, marginBottom: 24 },
  tableHeader: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center" },
  columnHeader: { fontWeight: "600", fontSize: 12 },
  tableRow: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center", gap: 8 },
  cellText: { fontSize: 14 },
  actionsColumn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 },
  actionIcon: { padding: 6 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyContainer: { padding: 48, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 14, marginTop: 12 },
  errorBox: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { borderRadius: 12, width: "90%", maxHeight: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalScroll: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0, 0, 0, 0.1)" },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  modalSubtitle: { fontSize: 14 },
  modalBody: { paddingHorizontal: 24, paddingVertical: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  formInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  modalFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(0, 0, 0, 0.1)", justifyContent: "flex-end" },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 100, alignItems: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "500" },
  saveButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 100, justifyContent: "center" },
  saveButtonText: { fontSize: 14, fontWeight: "600" },
});
