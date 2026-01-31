import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { supabase } from "../../../services/supabase";

export default function Services() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addServiceName, setAddServiceName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addIsActive, setAddIsActive] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("service_categories")
        .select("*")
        .order("category_id", { ascending: true });
      if (fetchError) throw fetchError;
      setCategories((data || []).map((d: any) => ({ id: d.category_id, name: d.category_name })));
    } catch (err: any) {
      console.error("fetchCategories error", err);
      setError(err.message || "Failed to load categories");
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("services")
        .select("*, service_categories(category_name)")
        .order("service_id", { ascending: true });
      if (fetchError) throw fetchError;
      const mapped = (data || []).map((d: any) => ({
        id: d.service_id,
        category_id: d.category_id,
        category_name: d.service_categories?.category_name || "",
        service_name: d.service_name,
        description: d.description,
        is_active: d.is_active,
        created_at: d.created_at ? d.created_at.split("T")[0] : null,
        updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
      }));
      setServices(mapped);
    } catch (err: any) {
      console.error("fetchServices error", err);
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const resetAdd = () => {
    setAddCategoryId(null);
    setAddServiceName("");
    setAddDescription("");
    setAddIsActive(true);
  };

  const handleAdd = async () => {
    if (!addServiceName.trim()) return setError("Service name is required.");
    if (!addCategoryId) return setError("Category is required.");

    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("services")
        .insert([
          {
            category_id: addCategoryId,
            service_name: addServiceName.trim(),
            description: addDescription || "",
            is_active: addIsActive,
          },
        ])
        .select("*, service_categories(category_name)");
      if (insertError) throw insertError;
      if (data && data[0]) {
        const d = data[0];
        setServices((prev) => [
          ...prev,
          {
            id: d.service_id,
            category_id: d.category_id,
            category_name: d.service_categories?.category_name || "",
            service_name: d.service_name,
            description: d.description,
            is_active: d.is_active,
            created_at: d.created_at ? d.created_at.split("T")[0] : null,
            updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
          },
        ]);
      }
      resetAdd();
      setShowAddModal(false);
    } catch (err: any) {
      console.error("add error", err);
      setError(err.message || "Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setEditCategoryId(s.category_id);
    setEditServiceName(s.service_name);
    setEditDescription(s.description);
    setEditIsActive(!!s.is_active);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editServiceName.trim()) return setError("Service name is required.");
    if (!editCategoryId) return setError("Category is required.");

    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("services")
        .update({
          category_id: editCategoryId,
          service_name: editServiceName.trim(),
          description: editDescription || "",
          is_active: editIsActive,
        })
        .eq("service_id", editing.id)
        .select("*, service_categories(category_name)");
      if (updateError) throw updateError;
      if (data && data[0]) {
        const d = data[0];
        setServices((prev) => prev.map((p) => (p.id === editing.id ? {
          id: d.service_id,
          category_id: d.category_id,
          category_name: d.service_categories?.category_name || "",
          service_name: d.service_name,
          description: d.description,
          is_active: d.is_active,
          created_at: d.created_at ? d.created_at.split("T")[0] : null,
          updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
        } : p)));
      } else {
        await fetchServices();
      }
      setShowEditModal(false);
      setEditing(null);
    } catch (err: any) {
      console.error("update error", err);
      setError(err.message || "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Service", "Are you sure you want to delete this service?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase.from("services").delete().eq("service_id", id);
      if (deleteError) throw deleteError;
      setServices((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("delete error", err);
      setError(err.message || "Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const target = services.find((s) => s.id === id);
      if (!target) return;
      const newStatus = !target.is_active;
      const { data, error: toggleError } = await supabase
        .from("services")
        .update({ is_active: newStatus })
        .eq("service_id", id)
        .select();
      if (toggleError) throw toggleError;
      if (data && data[0]) {
        setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: data[0].is_active, updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : s.updated_at } : s));
      } else {
        await fetchServices();
      }
    } catch (err: any) {
      console.error("toggle error", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch = s.service_name.toLowerCase().includes(searchText.toLowerCase()) || s.description.toLowerCase().includes(searchText.toLowerCase()) || s.category_name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !filterCategoryId || s.category_id === filterCategoryId;
    const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.is_active : !s.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading services...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Services</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage services</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: Palette.red, backgroundColor: isDarkMode ? "#3f1f1f" : "#ffefef" }]}> 
              <Text style={{ color: Palette.red, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search services..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <View style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity onPress={() => setFilterCategoryId(null)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: !filterCategoryId ? Palette.primary : 'transparent', borderRadius: 8 }}>
                  <Text style={{ color: !filterCategoryId ? Palette.black : theme.text }}>All Categories</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat.id} onPress={() => setFilterCategoryId(cat.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: filterCategoryId === cat.id ? Palette.primary : 'transparent', borderRadius: 8 }}>
                    <Text style={{ color: filterCategoryId === cat.id ? Palette.black : theme.text }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['All', 'Active', 'Inactive'].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setStatusFilter(s as any)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: statusFilter === s ? Palette.primary : 'transparent', borderRadius: 8 }}>
                    <Text style={{ color: statusFilter === s ? Palette.black : theme.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.4 }]}>Service Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Category</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No services found</Text>
              </View>
            ) : (
              filtered.map((s) => (
                <View key={s.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.4, fontWeight: "500" }]}>{s.service_name}</Text>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                    {s.category_name}
                  </Text>

                  <View style={{ flex: 0.8, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: s.is_active ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={!!s.is_active}
                        onValueChange={() => handleToggle(s.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                      />
                      <Text style={[styles.statusText, { color: s.is_active ? Palette.green : theme.textSecondary }]}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{s.created_at}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{s.updated_at}</Text>

                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(s)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => confirmDelete(s.id)}>
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Service</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new service</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter service name"
                    placeholderTextColor={theme.textSecondary}
                    value={addServiceName}
                    onChangeText={setAddServiceName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                      {categories.map((cat) => (
                        <TouchableOpacity key={cat.id} onPress={() => setAddCategoryId(cat.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: addCategoryId === cat.id ? Palette.primary : 'transparent', borderRadius: 8, marginRight: 8 }}>
                          <Text style={{ color: addCategoryId === cat.id ? Palette.black : theme.text }}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter description"
                    placeholderTextColor={theme.textSecondary}
                    value={addDescription}
                    onChangeText={setAddDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={addIsActive} onValueChange={setAddIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{addIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetAdd();
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAdd}>
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Service</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update service</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter service name"
                    placeholderTextColor={theme.textSecondary}
                    value={editServiceName}
                    onChangeText={setEditServiceName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                      {categories.map((cat) => (
                        <TouchableOpacity key={cat.id} onPress={() => setEditCategoryId(cat.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: editCategoryId === cat.id ? Palette.primary : 'transparent', borderRadius: 8, marginRight: 8 }}>
                          <Text style={{ color: editCategoryId === cat.id ? Palette.black : theme.text }}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter description"
                    placeholderTextColor={theme.textSecondary}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={editIsActive} onValueChange={setEditIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{editIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEdit}>
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
  filterButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 140, gap: 8, overflow: 'hidden' },
  tableContainer: { borderRadius: 8, overflow: "hidden", borderWidth: 1, marginBottom: 24 },
  tableHeader: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center" },
  columnHeader: { fontWeight: "600", fontSize: 12 },
  tableRow: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center", gap: 8 },
  cellText: { fontSize: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "500", marginLeft: 6 },
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
  formTextarea: { minHeight: 100, textAlignVertical: "top" },
  formDropdown: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 40, gap: 8, overflow: 'hidden' },
  modalFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(0, 0, 0, 0.1)", justifyContent: "flex-end" },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 100, alignItems: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "500" },
  saveButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 100, justifyContent: "center" },
  saveButtonText: { fontSize: 14, fontWeight: "600" },
});
