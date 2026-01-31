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
import { supabase } from "../../../services/supabase";

export default function PackageTypes() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  // Add Modal State
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeIsActive, setTypeIsActive] = useState(true);

  // Edit Modal State
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeDescription, setEditTypeDescription] = useState("");
  const [editTypeIsActive, setEditTypeIsActive] = useState(true);

  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("package_types")
        .select("*")
        .order("package_type_id", { ascending: true });
      if (fetchError) throw fetchError;
      const mapped = (data || []).map((d: any) => ({
        id: d.package_type_id,
        type_name: d.type_name,
        description: d.description,
        is_active: d.is_active,
        created_at: d.created_at ? d.created_at.split("T")[0] : null,
        updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
      }));
      setTypes(mapped);
    } catch (err: any) {
      console.error("fetchTypes error", err);
      setError(err.message || "Failed to load package types");
    } finally {
      setLoading(false);
    }
  }; 

  const resetAddModal = () => {
    setTypeName("");
    setTypeDescription("");
    setTypeIsActive(true);
  };

  const handleAddType = async () => {
    if (!typeName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("package_types")
        .insert([
          {
            type_name: typeName.trim(),
            description: typeDescription,
            is_active: typeIsActive,
          },
        ])
        .select();
      if (insertError) throw insertError;
      if (data && data[0]) {
        const d = data[0];
        const newType = {
          id: d.package_type_id,
          type_name: d.type_name,
          description: d.description,
          is_active: d.is_active,
          created_at: d.created_at ? d.created_at.split("T")[0] : null,
          updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
        };
        setTypes((prev) => [...prev, newType]);
      }
      resetAddModal();
      setShowAddModal(false);
    } catch (err: any) {
      console.error("addType error", err);
      setError(err.message || "Failed to add package type");
    } finally {
      setLoading(false);
    }
  }; 

  const handleEditType = (type: any) => {
    setEditingType(type);
    setEditTypeName(type.type_name);
    setEditTypeDescription(type.description);
    setEditTypeIsActive(!!type.is_active);
    setShowEditModal(true);
  };

  const handleSaveEditType = async () => {
    if (!editTypeName.trim() || !editingType) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("package_types")
        .update({
          type_name: editTypeName.trim(),
          description: editTypeDescription,
          is_active: editTypeIsActive,
        })
        .eq("package_type_id", editingType.id)
        .select();
      if (updateError) throw updateError;
      if (data && data[0]) {
        setTypes((prev) =>
          prev.map((t) =>
            t.id === editingType.id
              ? {
                  id: data[0].package_type_id,
                  type_name: data[0].type_name,
                  description: data[0].description,
                  is_active: data[0].is_active,
                  created_at: data[0].created_at ? data[0].created_at.split("T")[0] : null,
                  updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : null,
                }
              : t
          )
        );
      } else {
        await fetchTypes();
      }
      setShowEditModal(false);
      setEditingType(null);
    } catch (err: any) {
      console.error("updateType error", err);
      setError(err.message || "Failed to update package type");
    } finally {
      setLoading(false);
    }
  }; 

  const handleToggleActive = async (typeId: number) => {
    try {
      setLoading(true);
      setError(null);
      const target = types.find((t) => t.id === typeId);
      if (!target) return;
      const newStatus = !target.is_active;
      const { data, error: toggleError } = await supabase
        .from("package_types")
        .update({ is_active: newStatus })
        .eq("package_type_id", typeId)
        .select();
      if (toggleError) throw toggleError;
      if (data && data[0]) {
        setTypes((prev) =>
          prev.map((t) =>
            t.id === typeId
              ? {
                  ...t,
                  is_active: data[0].is_active,
                  updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : t.updated_at,
                }
              : t
          )
        );
      } else {
        await fetchTypes();
      }
    } catch (err: any) {
      console.error("toggleActive error", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }; 

  const handleDeleteType = async (typeId: number) => {
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from("package_types")
        .delete()
        .eq("package_type_id", typeId);
      if (deleteError) throw deleteError;
      setTypes((prev) => prev.filter((t) => t.id !== typeId));
    } catch (err: any) {
      console.error("deleteType error", err);
      setError(err.message || "Failed to delete package type");
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = types.filter((t) => {
    const matchesSearch =
      t.type_name.toLowerCase().includes(searchText.toLowerCase()) ||
      t.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "All Status" || (statusFilter === "Active" ? t.is_active : !t.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading package types...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Package Types</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Define and manage package types</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Type</Text>
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
                placeholder="Search by type name..."
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

          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Type Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.8 }]}>Description</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {filteredTypes.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No package types found</Text>
              </View>
            ) : (
              filteredTypes.map((t) => (
                <View key={t.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2, fontWeight: "500" }]}>{t.type_name}</Text>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.8 }]} numberOfLines={1} ellipsizeMode="tail">
                    {t.description}
                  </Text>

                  <View style={{ flex: 0.8, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: t.is_active ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={!!t.is_active}
                        onValueChange={() => handleToggleActive(t.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                      />
                      <Text style={[styles.statusText, { color: t.is_active ? Palette.green : theme.textSecondary }]}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{t.created_at}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{t.updated_at}</Text>

                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Ionicons name="eye" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditType(t)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteType(t.id)}>
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Package Type</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new package type</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Type Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter type name"
                    placeholderTextColor={theme.textSecondary}
                    value={typeName}
                    onChangeText={setTypeName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter type description"
                    placeholderTextColor={theme.textSecondary}
                    value={typeDescription}
                    onChangeText={setTypeDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={typeIsActive} onValueChange={setTypeIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{typeIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

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
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAddType}>
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
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Package Type</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update package type details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Type Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter type name"
                    placeholderTextColor={theme.textSecondary}
                    value={editTypeName}
                    onChangeText={setEditTypeName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter type description"
                    placeholderTextColor={theme.textSecondary}
                    value={editTypeDescription}
                    onChangeText={setEditTypeDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={editTypeIsActive} onValueChange={setEditTypeIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{editTypeIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEditType}>
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
  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
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