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

export default function AddOns() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // add-ons state
  const [addOns, setAddOns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // categories for dropdown
  const [categories, setCategories] = useState<any[]>([]);

  // search/filter
  const [searchText, setSearchText] = useState("");

  // add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addPriceType, setAddPriceType] = useState<"fixed" | "per_pax">("fixed");
  const [addDefaultPrice, setAddDefaultPrice] = useState<string>("0.00");
  const [addIsActive, setAddIsActive] = useState(true);

  // edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceType, setEditPriceType] = useState<"fixed" | "per_pax">("fixed");
  const [editDefaultPrice, setEditDefaultPrice] = useState<string>("0.00");
  const [editIsActive, setEditIsActive] = useState(true);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchCategories();
    fetchAddOns();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("add_on_categories")
        .select("*")
        .order("category_id", { ascending: true });
      if (fetchError) throw fetchError;
      setCategories((data || []).map((d: any) => ({ id: d.category_id, name: d.category_name })));
    } catch (err: any) {
      console.error("fetchCategories error", err);
      setError(err.message || "Failed to load categories");
    }
  };

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      setError(null);
      // select related category name
      const { data, error: fetchError } = await supabase
        .from("add_ons")
        .select("*, add_on_categories(category_name)")
        .order("add_on_id", { ascending: true });
      if (fetchError) throw fetchError;
      const mapped = (data || []).map((d: any) => ({
        id: d.add_on_id,
        category_id: d.category_id,
        category_name: d.add_on_categories?.category_name || "",
        add_on_name: d.add_on_name,
        description: d.description,
        price_type: d.price_type,
        default_price: d.default_price,
        is_active: d.is_active,
        created_at: d.created_at ? d.created_at.split("T")[0] : null,
        updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
      }));
      setAddOns(mapped);
    } catch (err: any) {
      console.error("fetchAddOns error", err);
      setError(err.message || "Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  };

  const resetAdd = () => {
    setAddCategoryId(null);
    setAddName("");
    setAddDescription("");
    setAddPriceType("fixed");
    setAddDefaultPrice("0.00");
    setAddIsActive(true);
  };

  const handleAdd = async () => {
    // validation
    if (!addName.trim()) return setError("Name is required.");
    if (!addCategoryId) return setError("Category is required.");
    const price = parseFloat(addDefaultPrice) || 0;
    if (price < 0) return setError("Default price must be >= 0.");

    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("add_ons")
        .insert([
          {
            category_id: addCategoryId,
            add_on_name: addName.trim(),
            description: addDescription || "",
            price_type: addPriceType,
            default_price: price,
            is_active: addIsActive,
          },
        ])
        .select("*, add_on_categories(category_name)");
      if (insertError) throw insertError;
      if (data && data[0]) {
        const d = data[0];
        setAddOns((prev) => [
          ...prev,
          {
            id: d.add_on_id,
            category_id: d.category_id,
            category_name: d.add_on_categories?.category_name || "",
            add_on_name: d.add_on_name,
            description: d.description,
            price_type: d.price_type,
            default_price: d.default_price,
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
      if (err?.code === "23505" || /unique/i.test(err?.message || "")) {
        setError("Add-on already exists.");
      } else {
        setError(err.message || "Failed to add add-on");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (a: any) => {
    setEditing(a);
    setEditCategoryId(a.category_id);
    setEditName(a.add_on_name);
    setEditDescription(a.description);
    setEditPriceType(a.price_type);
    setEditDefaultPrice(String(a.default_price ?? "0.00"));
    setEditIsActive(!!a.is_active);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) return setError("Name is required.");
    if (!editCategoryId) return setError("Category is required.");
    const price = parseFloat(editDefaultPrice) || 0;
    if (price < 0) return setError("Default price must be >= 0.");

    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("add_ons")
        .update({
          category_id: editCategoryId,
          add_on_name: editName.trim(),
          description: editDescription || "",
          price_type: editPriceType,
          default_price: price,
          is_active: editIsActive,
        })
        .eq("add_on_id", editing.id)
        .select("*, add_on_categories(category_name)");
      if (updateError) throw updateError;
      if (data && data[0]) {
        const d = data[0];
        setAddOns((prev) => prev.map((p) => (p.id === editing.id ? {
          id: d.add_on_id,
          category_id: d.category_id,
          category_name: d.add_on_categories?.category_name || "",
          add_on_name: d.add_on_name,
          description: d.description,
          price_type: d.price_type,
          default_price: d.default_price,
          is_active: d.is_active,
          created_at: d.created_at ? d.created_at.split("T")[0] : null,
          updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
        } : p)));
      } else {
        await fetchAddOns();
      }
      setShowEditModal(false);
      setEditing(null);
    } catch (err: any) {
      console.error("update error", err);
      setError(err.message || "Failed to update add-on");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Add-on", "Are you sure you want to delete this add-on?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase.from("add_ons").delete().eq("add_on_id", id);
      if (deleteError) throw deleteError;
      setAddOns((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("delete error", err);
      setError(err.message || "Failed to delete add-on");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const target = addOns.find((a) => a.id === id);
      if (!target) return;
      const newStatus = !target.is_active;
      const { data, error: toggleError } = await supabase
        .from("add_ons")
        .update({ is_active: newStatus })
        .eq("add_on_id", id)
        .select();
      if (toggleError) throw toggleError;
      if (data && data[0]) {
        setAddOns((prev) => prev.map((a) => a.id === id ? { ...a, is_active: data[0].is_active, updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : a.updated_at } : a));
      } else {
        await fetchAddOns();
      }
    } catch (err: any) {
      console.error("toggle error", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const filtered = addOns.filter((a) =>
    a.add_on_name.toLowerCase().includes(searchText.toLowerCase()) || a.description.toLowerCase().includes(searchText.toLowerCase()) || a.category_name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading add-ons...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Add-ons</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage add-ons and pricing</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Add-on</Text>
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
                placeholder="Search add-ons..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.4 }]}>Add-on Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Category</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Price Type</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Default Price</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No add-ons found</Text>
              </View>
            ) : (
              filtered.map((a) => (
                <View key={a.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.4, fontWeight: "500" }]}>{a.add_on_name}</Text>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                    {a.category_name}
                  </Text>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{a.price_type}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{a.default_price}</Text>

                  <View style={{ flex: 0.9, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: a.is_active ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={!!a.is_active}
                        onValueChange={() => handleToggle(a.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                      />
                      <Text style={[styles.statusText, { color: a.is_active ? Palette.green : theme.textSecondary }]}>
                        {a.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{a.created_at}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{a.updated_at}</Text>

                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(a)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => confirmDelete(a.id)}>
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Add-on</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new add-on</Text>
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
                    placeholder="Enter add-on name"
                    placeholderTextColor={theme.textSecondary}
                    value={addName}
                    onChangeText={setAddName}
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
                  <Text style={[styles.formLabel, { color: theme.text }]}>Price Type</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity onPress={() => setAddPriceType("fixed")} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: addPriceType === "fixed" ? Palette.primary : theme.card, borderRadius: 8 }}>
                      <Text style={{ color: addPriceType === "fixed" ? Palette.black : theme.text }}>Fixed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAddPriceType("per_pax")} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: addPriceType === "per_pax" ? Palette.primary : theme.card, borderRadius: 8 }}>
                      <Text style={{ color: addPriceType === "per_pax" ? Palette.black : theme.text }}>Per Pax</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Default Price</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={addDefaultPrice}
                    onChangeText={setAddDefaultPrice}
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Add-on</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update add-on</Text>
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
                    placeholder="Enter add-on name"
                    placeholderTextColor={theme.textSecondary}
                    value={editName}
                    onChangeText={setEditName}
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
                  <Text style={[styles.formLabel, { color: theme.text }]}>Price Type</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity onPress={() => setEditPriceType("fixed")} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: editPriceType === "fixed" ? Palette.primary : theme.card, borderRadius: 8 }}>
                      <Text style={{ color: editPriceType === "fixed" ? Palette.black : theme.text }}>Fixed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditPriceType("per_pax")} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: editPriceType === "per_pax" ? Palette.primary : theme.card, borderRadius: 8 }}>
                      <Text style={{ color: editPriceType === "per_pax" ? Palette.black : theme.text }}>Per Pax</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Default Price</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={editDefaultPrice}
                    onChangeText={setEditDefaultPrice}
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
