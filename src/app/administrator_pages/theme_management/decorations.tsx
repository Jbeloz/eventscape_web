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

export default function DecorationManagement() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Removed Description and Status states
  const [newStyleName, setNewStyleName] = useState("");
  
  const [editingStyle, setEditingStyle] = useState<any>(null);
  const [editStyleName, setEditStyleName] = useState("");

  const [decorationStyles, setDecorationStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  // Mock data - Removed Description and Status fields
  const mockDecorationStyles = [
    {
      id: 1,
      style_name: "Rustic",
      createdDate: "2024-01-15",
      lastUpdated: "2024-12-10",
    },
    {
      id: 2,
      style_name: "Bohemian",
      createdDate: "2024-01-20",
      lastUpdated: "2024-12-05",
    },
    {
      id: 3,
      style_name: "Modern Minimalist",
      createdDate: "2024-02-01",
      lastUpdated: "2024-11-28",
    },
    {
      id: 4,
      style_name: "Vintage Glamour",
      createdDate: "2024-02-10",
      lastUpdated: "2024-10-15",
    },
    {
      id: 5,
      style_name: "Industrial",
      createdDate: "2024-03-05",
      lastUpdated: "2024-12-01",
    },
  ];

  useEffect(() => {
    fetchDecorationStyles();
  }, []);

  const fetchDecorationStyles = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("decoration_styles")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;

      const formattedStyles = data?.map((style: any) => ({
        id: style.decoration_style_id,
        style_name: style.style_name,
        createdDate: style.created_at ? style.created_at.split("T")[0] : "",
        lastUpdated: style.updated_at ? style.updated_at.split("T")[0] : "",
      })) || [];

      setDecorationStyles(formattedStyles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", "Failed to load decoration styles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStyle = async () => {
    if (newStyleName.trim()) {
      try {
        const { error: err } = await supabase
          .from("decoration_styles")
          .insert([{ style_name: newStyleName }]);

        if (err) throw err;

        Alert.alert("Success", "Decoration style added successfully");
        setNewStyleName("");
        setShowAddModal(false);
        await fetchDecorationStyles();
      } catch (err: any) {
        Alert.alert("Error", "Failed to add decoration style: " + err.message);
      }
    }
  };

  const handleCancelModal = () => {
    setNewStyleName("");
    setShowAddModal(false);
  };

  const handleEditStyle = (style: any) => {
    setEditingStyle(style);
    setEditStyleName(style.style_name);
    setShowEditModal(true);
  };

  const handleSaveEditStyle = async () => {
    if (editStyleName.trim() && editingStyle) {
      try {
        const { error: err } = await supabase
          .from("decoration_styles")
          .update({ style_name: editStyleName })
          .eq("decoration_style_id", editingStyle.id);

        if (err) throw err;

        Alert.alert("Success", "Decoration style updated successfully");
        setShowEditModal(false);
        setEditingStyle(null);
        setEditStyleName("");
        await fetchDecorationStyles();
      } catch (err: any) {
        Alert.alert("Error", "Failed to update decoration style: " + err.message);
      }
    }
  };

  const handleCancelEditModal = () => {
    setShowEditModal(false);
    setEditingStyle(null);
    setEditStyleName("");
  };

  const handleDeleteStyle = (styleId: number) => {
    Alert.alert(
      "Delete Decoration Style",
      "Are you sure you want to delete this decoration style?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const { error: err } = await supabase
                .from("decoration_styles")
                .delete()
                .eq("decoration_style_id", styleId);

              if (err) throw err;

              Alert.alert("Success", "Decoration style deleted successfully");
              await fetchDecorationStyles();
            } catch (err: any) {
              Alert.alert("Error", "Failed to delete decoration style: " + err.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const filteredDecorationStyles = decorationStyles
    .filter((style) => {
      // Removed description search and status filter
      return style.style_name.toLowerCase().includes(searchText.toLowerCase());
    });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading decoration styles...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Decoration Styles</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage decoration styles for events and themes</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Style</Text>
            </TouchableOpacity>
          </View>

          {/* Search Section (Removed Status Filter) */}
          <View style={[styles.filterSection, { zIndex: 100, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, flex: 1, marginBottom: 0 }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by style name..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* Decoration Styles Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header - Removed Description and Status */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 2 }]}>Style Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Created Date</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Last Updated</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredDecorationStyles.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No decoration styles found</Text>
              </View>
            ) : (
              filteredDecorationStyles.map((style) => (
                <View key={style.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Style Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 2, fontWeight: "500" }]}>{style.style_name}</Text>

                  {/* Created Date */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1 }]}>{style.createdDate}</Text>

                  {/* Last Updated */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1 }]}>{style.lastUpdated}</Text>

                  {/* Actions - Removed Eye Icon */}
                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "flex-start", gap: 12 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditStyle(style)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteStyle(style.id)}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Style Modal - Removed Description Input */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={handleCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Decoration Style</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new decoration style</Text>
              </View>
              <TouchableOpacity onPress={handleCancelModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Style Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter style name"
                  placeholderTextColor={theme.textSecondary}
                  value={newStyleName}
                  onChangeText={setNewStyleName}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={handleCancelModal}>
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAddStyle}>
                <Ionicons name="checkmark" size={18} color={Palette.black} />
                <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Style Modal - Removed Description Input */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={handleCancelEditModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Decoration Style</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update style details</Text>
              </View>
              <TouchableOpacity onPress={handleCancelEditModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Style Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter style name"
                  placeholderTextColor={theme.textSecondary}
                  value={editStyleName}
                  onChangeText={setEditStyleName}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={handleCancelEditModal}>
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEditStyle}>
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
  actionsColumn: {
    flexDirection: "row",
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