import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchCategories();
  }, []);

  const formatCategoryName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return "";
    
    const words = trimmedName.split(/\s+/);
    const formattedWords = words.map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return formattedWords.join(" ");
  };

  const fetchCategories = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("service_categories")
        .select("*")
        .order("category_name", { ascending: true });
      
      if (fetchError) throw fetchError;
      
      const mapped = (data || []).map((d: any) => ({
        id: d.category_id,
        name: d.category_name,
        created_at: d.created_at ? d.created_at.split("T")[0] : null,
        updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
      }));
      
      const sorted = [...mapped].sort((a, b) => {
        if (sortOrder === "A-Z") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
      
      setCategories(sorted);
    } catch (err: any) {
      console.error("fetchCategories error", err);
      setError(err.message || "Failed to load service categories");
      showError("Failed to load categories. Please try again.");
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const validateCategoryName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    if (trimmedName.length < 2) return false;
    return true;
  };

  // Check if category name already exists (excluding current category for edit)
  const categoryNameExists = (name: string, excludeId?: string) => {
    const formattedName = formatCategoryName(name);
    return categories.some(
      (c) => 
        c.name.toLowerCase() === formattedName.toLowerCase() && 
        c.id !== excludeId
    );
  };

  const getAddButtonDisabled = () => {
    const isDuplicate = categoryNameExists(newCategoryName);
    return !validateCategoryName(newCategoryName) || isDuplicate || loading;
  };

  const getEditButtonDisabled = () => {
    const isDuplicate = categoryNameExists(editCategoryName, editingCategory?.id);
    return !validateCategoryName(editCategoryName) || 
           (editCategoryName.trim() === editingCategory?.name) || 
           isDuplicate || 
           loading;
  };

  const handleAddCategory = async () => {
    if (getAddButtonDisabled()) return;
    
    const formattedName = formatCategoryName(newCategoryName);
    
    // Additional validation for duplicates
    if (categoryNameExists(formattedName)) {
      showError("Category name already exists");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("service_categories")
        .insert([{ category_name: formattedName }])
        .select();
      
      if (insertError) throw insertError;
      
      if (data && data[0]) {
        const d = data[0];
        const newCategory = {
          id: d.category_id,
          name: d.category_name,
          created_at: d.created_at ? d.created_at.split("T")[0] : null,
          updated_at: d.updated_at ? d.updated_at.split("T")[0] : null,
        };
        
        const updatedCategories = [...categories, newCategory].sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
        
        setCategories(updatedCategories);
        setNewCategoryName("");
        setShowAddModal(false);
        showSuccess(`Category "${formattedName}" added successfully!`);
      }
    } catch (err: any) {
      console.error("addCategory error", err);
      if (err?.code === "23505" || /unique/i.test(err?.message || "")) {
        showError("Category name already exists");
      } else {
        showError("Failed to add category");
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
    if (getEditButtonDisabled()) return;
    
    const formattedName = formatCategoryName(editCategoryName);
    
    if (formattedName === editingCategory?.name) return;
    
    // Additional validation for duplicates
    if (categoryNameExists(formattedName, editingCategory?.id)) {
      showError("Category name already exists");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("service_categories")
        .update({ category_name: formattedName })
        .eq("category_id", editingCategory.id)
        .select();
      
      if (updateError) throw updateError;
      
      if (data && data[0]) {
        const updatedCategories = categories.map((c) =>
          c.id === editingCategory.id
            ? {
                id: data[0].category_id,
                name: data[0].category_name,
                created_at: data[0].created_at ? data[0].created_at.split("T")[0] : null,
                updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : null,
              }
            : c
        ).sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
        
        setCategories(updatedCategories);
        setShowEditModal(false);
        setEditingCategory(null);
        showSuccess(`Category updated to "${formattedName}" successfully!`);
      }
    } catch (err: any) {
      console.error("updateCategory error", err);
      if (err?.code === "23505" || /unique/i.test(err?.message || "")) {
        showError("Category name already exists");
      } else {
        showError("Failed to update category");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === "A-Z" ? "Z-A" : "A-Z";
    setSortOrder(newSortOrder);
    
    const sortedCategories = [...categories].sort((a, b) => {
      if (newSortOrder === "A-Z") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    
    setCategories(sortedCategories);
  };

  const showDeleteConfirmation = (cat: any) => {
    setDeletingCategory(cat);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from("service_categories")
        .delete()
        .eq("category_id", deletingCategory.id);
      
      if (deleteError) throw deleteError;
      
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showSuccess(`Category "${deletingCategory.name}" deleted successfully!`);
    } catch (err: any) {
      console.error("deleteCategory error", err);
      showError("Failed to delete category");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingCategory(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
  };

  const filtered = categories.filter((c) => 
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (initialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader 
          isDarkMode={isDarkMode} 
          onThemeToggle={toggleTheme} 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading categories...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AdminHeader 
        isDarkMode={isDarkMode} 
        onThemeToggle={toggleTheme} 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}> 
          <View style={styles.titleSection}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.text }]}>
                Service Categories
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Manage service categories
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <View style={[
                styles.searchBox, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border,
                  flex: 1
                }
              ]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search categories..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  { 
                    borderColor: theme.border, 
                    backgroundColor: theme.card 
                  }
                ]}
                onPress={handleSortToggle}
              >
                <Ionicons 
                  name={sortOrder === "A-Z" ? "arrow-down" : "arrow-up"} 
                  size={16} 
                  color={theme.text} 
                />
                <Text style={[styles.sortButtonText, { color: theme.text }]}>
                  {sortOrder}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[
            styles.tableContainer, 
            { 
              backgroundColor: theme.card, 
              borderColor: theme.border 
            }
          ]}>
            <View style={[
              styles.tableHeader, 
              { 
                backgroundColor: theme.lightBg, 
                borderColor: theme.border 
              }
            ]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 3 }]}>
                Category Name
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1, textAlign: "center" }]}>
                Actions
              </Text>
            </View>

            {filtered.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No categories found
                </Text>
              </View>
            ) : (
              filtered.map((c) => (
                <View 
                  key={c.id} 
                  style={[styles.tableRow, { borderColor: theme.border }]}
                >
                  <View style={{ flex: 3, justifyContent: "center" }}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>
                      {c.name}
                    </Text>
                  </View>

                  <View style={[styles.actionsColumn, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleEditCategory(c)}
                      >
                        <Ionicons name="pencil" size={18} color={Palette.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => showDeleteConfirmation(c)}
                      >
                        <Ionicons name="trash" size={18} color={Palette.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Modal */}
      <Modal 
        visible={showAddModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setNewCategoryName("");
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowAddModal(false);
              setNewCategoryName("");
            }}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.card,
              width: "95%",
              maxHeight: "70%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add Service Category
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create new category
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setNewCategoryName("");
              }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Category Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: !validateCategoryName(newCategoryName) && newCategoryName ? Palette.red : 
                                    categoryNameExists(newCategoryName) ? Palette.red : 
                                    theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Category Name"
                    placeholderTextColor={theme.textSecondary}
                    value={newCategoryName}
                    onChangeText={(text) => {
                      // Prevent numbers
                      const filteredText = text.replace(/[0-9]/g, '');
                      setNewCategoryName(filteredText);
                    }}
                    onBlur={() => {
                      if (newCategoryName.trim()) {
                        setNewCategoryName(formatCategoryName(newCategoryName));
                      }
                    }}
                  />
                  {!validateCategoryName(newCategoryName) && newCategoryName && (
                    <Text style={styles.errorText}>
                      Category name must be at least 2 characters
                    </Text>
                  )}
                  {categoryNameExists(newCategoryName) && (
                    <Text style={styles.errorText}>
                      Category name already exists
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={[
              styles.modalFooter,
              { borderTopColor: theme.border }
            ]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.border }
                ]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewCategoryName("");
                }}
                disabled={loading}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: theme.text }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: !getAddButtonDisabled() ? Palette.primary : theme.border,
                    opacity: loading ? 0.7 : 1
                  }
                ]} 
                onPress={handleAddCategory}
                disabled={getAddButtonDisabled()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={!getAddButtonDisabled() ? Palette.black : theme.textSecondary} />
                    <Text style={[
                      styles.saveButtonText,
                      { color: !getAddButtonDisabled() ? Palette.black : theme.textSecondary }
                    ]}>
                      Create Category
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        visible={showEditModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEditModal(false);
              setEditingCategory(null);
            }}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.card,
              width: "95%",
              maxHeight: "70%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Edit Service Category
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Update category name
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setEditingCategory(null);
              }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Category Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: !validateCategoryName(editCategoryName) && editCategoryName ? Palette.red : 
                                    categoryNameExists(editCategoryName, editingCategory?.id) ? Palette.red : 
                                    theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Category Name"
                    placeholderTextColor={theme.textSecondary}
                    value={editCategoryName}
                    onChangeText={(text) => {
                      // Prevent numbers
                      const filteredText = text.replace(/[0-9]/g, '');
                      setEditCategoryName(filteredText);
                    }}
                    onBlur={() => {
                      if (editCategoryName.trim()) {
                        setEditCategoryName(formatCategoryName(editCategoryName));
                      }
                    }}
                  />
                  {!validateCategoryName(editCategoryName) && editCategoryName && (
                    <Text style={styles.errorText}>
                      Category name must be at least 2 characters
                    </Text>
                  )}
                  {categoryNameExists(editCategoryName, editingCategory?.id) && (
                    <Text style={styles.errorText}>
                      Category name already exists
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={[
              styles.modalFooter,
              { borderTopColor: theme.border }
            ]}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.border }]} 
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: theme.text }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: !getEditButtonDisabled() ? Palette.primary : theme.border,
                    opacity: loading ? 0.7 : 1
                  }
                ]} 
                onPress={handleSaveEditCategory}
                disabled={getEditButtonDisabled()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={!getEditButtonDisabled() ? Palette.black : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.saveButtonText,
                      { color: !getEditButtonDisabled() ? Palette.black : theme.textSecondary }
                    ]}>
                      Save Changes
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleDeleteCancel}
          />
          <View style={[
            styles.alertModalContent,
            { backgroundColor: theme.card }
          ]}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>
                Delete Category
              </Text>
            </View>
            <View style={styles.alertBody}>
              <Ionicons name="alert-circle" size={48} color={Palette.red} />
              <Text style={[styles.alertMessage, { color: theme.text }]}>
                Are you sure you want to delete "{deletingCategory?.name}"?
              </Text>
              <Text style={[styles.alertSubMessage, { color: theme.textSecondary }]}>
                This action cannot be undone.
              </Text>
            </View>
            <View style={styles.alertButtons}>
              <TouchableOpacity
                style={[styles.alertCancelButton, { borderColor: theme.border }]}
                onPress={handleDeleteCancel}
                disabled={loading}
              >
                <Text style={[styles.alertCancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertConfirmButton, { backgroundColor: Palette.red }]}
                onPress={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Text style={styles.alertConfirmButtonText}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSuccessModal(false)}
          />
          <View style={[
            styles.alertModalContent,
            { backgroundColor: theme.card }
          ]}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>
                Success
              </Text>
            </View>
            <View style={styles.alertBody}>
              <Ionicons name="checkmark-circle" size={48} color={Palette.green} />
              <Text style={[styles.alertMessage, { color: theme.text }]}>
                {successMessage}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: Palette.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowErrorModal(false)}
          />
          <View style={[
            styles.alertModalContent,
            { backgroundColor: theme.card }
          ]}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>
                Error
              </Text>
              <TouchableOpacity 
                style={styles.closeButtonTop}
                onPress={() => setShowErrorModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.alertBody}>
              <Ionicons name="alert-circle" size={48} color={Palette.red} />
              <Text style={[styles.alertMessage, { color: theme.text }]}>
                {errorMessage}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: Palette.primary }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  mainContainer: { 
    flex: 1, 
    flexDirection: "row" 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  titleSection: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 24 
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 4,
    fontFamily: 'Poppins-Bold'
  },
  subtitle: { 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  createButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 8 
  },
  createButtonText: { 
    color: Palette.black, 
    fontSize: 14, 
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  filterSection: { 
    marginBottom: 24 
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  searchBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    gap: 8
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  tableContainer: { 
    borderRadius: 8, 
    overflow: "hidden", 
    borderWidth: 1, 
    marginBottom: 24 
  },
  tableHeader: { 
    flexDirection: "row", 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    alignItems: "center" 
  },
  columnHeader: { 
    fontWeight: "600", 
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold'
  },
  tableRow: { 
    flexDirection: "row", 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    alignItems: "center", 
    gap: 8 
  },
  cellText: { 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  actionsColumn: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    justifyContent: "center",
    width: "100%",
  },
  actionIcon: { 
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  emptyContainer: { 
    padding: 48, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  emptyText: { 
    fontSize: 14, 
    marginTop: 12,
    fontFamily: 'Poppins-Regular'
  },
  errorText: {
    color: Palette.red,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular'
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4
  },
  formLabel: { 
    fontSize: 14, 
    fontWeight: "500",
    fontFamily: 'Poppins-Medium'
  },
  formInput: { 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
    justifyContent: "center", 
    alignItems: "center",
    position: 'relative',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: { 
    borderRadius: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84, 
    elevation: 5,
    position: 'relative',
    zIndex: 1001,
  },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingBottom: 16 },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "rgba(0, 0, 0, 0.1)" 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold'
  },
  modalSubtitle: { 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  modalBody: { 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  modalFooter: { 
    flexDirection: "row", 
    gap: 12, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    justifyContent: "flex-end" 
  },
  formGroup: { 
    marginBottom: 20 
  },
  cancelButton: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    minWidth: 100, 
    alignItems: "center" 
  },
  cancelButtonText: { 
    fontSize: 14, 
    fontWeight: "500",
    fontFamily: 'Poppins-Medium'
  },
  saveButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8, 
    minWidth: 120, 
    justifyContent: "center" 
  },
  saveButtonText: { 
    fontSize: 14, 
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  alertModalContent: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
    zIndex: 1002,
    width: "70%",
    minHeight: 200,
    justifyContent: "space-between",
  },
  alertHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  alertBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  alertMessage: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    fontFamily: 'Poppins-Regular'
  },
  alertSubMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontFamily: 'Poppins-Regular'
  },
  alertButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  alertButtonText: {
    color: Palette.black,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  alertButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 20,
  },
  alertCancelButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  alertCancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: 'Poppins-Medium'
  },
  alertConfirmButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  alertConfirmButtonText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  closeButtonTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
});