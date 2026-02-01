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

export default function AddOnCategories() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Add Modal State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIsActive, setNewCategoryIsActive] = useState(true);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Edit Modal State
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryIsActive, setEditCategoryIsActive] = useState(true);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchCategories();
  }, []);

  const containsNumbers = (text: string): boolean => {
    return /\d/.test(text);
  };

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

  const formatDescription = (description: string): string => {
    const trimmedDesc = description.trim();
    if (!trimmedDesc) return "";
    
    // Format each sentence
    const sentences = trimmedDesc.split('. ');
    const formattedSentences = sentences.map(sentence => {
      if (!sentence) return "";
      const words = sentence.split(' ');
      const formattedWords = words.map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
      return formattedWords.join(' ');
    });
    
    return formattedSentences.join('. ');
  };

  const validateCategoryName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Category name is required";
    }
    
    if (containsNumbers(trimmedName)) {
      return "Category name cannot contain numbers";
    }
    
    if (trimmedName.length < 2) {
      return "Category name must be at least 2 characters long";
    }
    
    if (trimmedName.length > 50) {
      return "Category name must be less than 50 characters";
    }
    
    // Format the name
    const formattedName = formatCategoryName(trimmedName);
    
    return formattedName;
  };

  // Check if category name already exists
  const checkDuplicateCategoryName = async (categoryName: string): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const formattedName = formatCategoryName(categoryName);
      
      const { data, error: checkError } = await supabase
        .from("add_on_categories")
        .select("category_name")
        .ilike("category_name", formattedName)
        .limit(1);
      
      if (checkError) throw checkError;
      
      return (data && data.length > 0);
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const fetchCategories = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("add_on_categories")
        .select("*")
        .order("category_name", { ascending: sortOrder === "A-Z" });
      
      if (fetchError) throw fetchError;
      
      const mapped = (data || []).map((d: any) => ({
        id: d.category_id,
        name: d.category_name,
        description: d.description || "",
        is_active: d.is_active,
        created_at: d.created_at ? formatDate(d.created_at) : null,
        updated_at: d.updated_at ? formatDate(d.updated_at) : null,
      }));
      
      setCategories(mapped);
    } catch (err: any) {
      console.error("fetchCategories error", err);
      setError(err.message || "Failed to load add-on categories");
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

  const resetAddModal = () => {
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryIsActive(true);
    setAddValidationError(null);
    setDuplicateError(null);
  };

  const handleAddCategory = async () => {
    // Clear previous errors
    setAddValidationError(null);
    setDuplicateError(null);
    
    // Validate category name
    const formattedName = validateCategoryName(newCategoryName);
    
    if (!formattedName || typeof formattedName !== "string") {
      setAddValidationError(formattedName || "Category name is required");
      return;
    }
    
    // Check for duplicates before inserting
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicateCategoryName(newCategoryName);
      
      if (isDuplicate) {
        setDuplicateError(`Category "${formattedName}" already exists. Please use a different name.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setErrorMessage("Failed to validate category. Please try again.");
      setShowErrorModal(true);
      setIsCheckingDuplicate(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("add_on_categories")
        .insert([{ 
          category_name: formattedName,
          description: newCategoryDescription.trim() || "",
          is_active: newCategoryIsActive
        }])
        .select();
      
      if (insertError) {
        if (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('duplicate key')) {
          setDuplicateError(`Category "${formattedName}" already exists. Please use a different name.`);
          return;
        }
        throw insertError;
      }
      
      if (data && data[0]) {
        const d = data[0];
        const newCategory = {
          id: d.category_id,
          name: d.category_name,
          description: d.description || "",
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : null,
          updated_at: d.updated_at ? formatDate(d.updated_at) : null,
        };
        
        setCategories((prev) => [...prev, newCategory]);
      }
      resetAddModal();
      setShowAddModal(false);
      setSuccessMessage("Category added successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("addCategory error", err);
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Category "${formattedName}" already exists. Please use a different name.`);
      } else {
        setErrorMessage(err.message || "Failed to add category");
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
      setIsCheckingDuplicate(false);
    }
  };

  // Handle category name change with duplicate checking and number validation
  const handleCategoryNameChange = async (text: string) => {
    // Remove numbers from input
    const cleanedText = text.replace(/\d/g, '');
    setNewCategoryName(cleanedText);
    setAddValidationError(null);
    
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    // Check for numbers and show validation error
    if (containsNumbers(text)) {
      setAddValidationError("Category name cannot contain numbers");
    }
    
    if (cleanedText.trim().length >= 2) {
      const formattedName = formatCategoryName(cleanedText.trim());
      if (formattedName) {
        const existing = categories.find(c => 
          c.name.toLowerCase() === formattedName.toLowerCase()
        );
        
        if (existing) {
          setDuplicateError(`Category "${formattedName}" already exists.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle category name blur - final validation
  const handleCategoryNameBlur = async () => {
    if (newCategoryName.trim()) {
      const formattedName = formatCategoryName(newCategoryName);
      setNewCategoryName(formattedName);
      
      if (formattedName) {
        const isDuplicate = await checkDuplicateCategoryName(formattedName);
        if (isDuplicate) {
          setDuplicateError(`Category "${formattedName}" already exists. Please use a different name.`);
        }
      }
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setEditCategoryDescription(cat.description || "");
    setEditCategoryIsActive(!!cat.is_active);
    setEditValidationError(null);
    setShowEditModal(true);
  };

  const handleSaveEditCategory = async () => {
    const finalDescription = formatDescription(editCategoryDescription);
    
    if (!finalDescription) {
      setEditValidationError("Description is required");
      return;
    }

    if (!editingCategory) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("add_on_categories")
        .update({ 
          description: finalDescription,
          is_active: editCategoryIsActive
        })
        .eq("category_id", editingCategory.id)
        .select();
      
      if (updateError) throw updateError;
      
      if (data && data[0]) {
        const updatedCategory = {
          id: data[0].category_id,
          name: data[0].category_name,
          description: data[0].description || "",
          is_active: data[0].is_active,
          created_at: data[0].created_at ? formatDate(data[0].created_at) : editingCategory.created_at,
          updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
        };
        
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? updatedCategory : c
          )
        );
      } else {
        await fetchCategories();
      }
      
      setShowEditModal(false);
      setEditingCategory(null);
      setSuccessMessage("Category updated successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("updateCategory error", err);
      setErrorMessage(err.message || "Failed to update category");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cat: any) => {
    setSelectedCategory(cat);
    setShowDetailsModal(true);
  };

  const handleToggleActive = async (categoryId: number) => {
    try {
      setLoading(true);
      const target = categories.find((c) => c.id === categoryId);
      if (!target) return;
      const newStatus = !target.is_active;
      const { data, error: toggleError } = await supabase
        .from("add_on_categories")
        .update({ is_active: newStatus })
        .eq("category_id", categoryId)
        .select();
      
      if (toggleError) throw toggleError;
      
      if (data && data[0]) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  is_active: data[0].is_active,
                  updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
                }
              : c
          )
        );
        // No popup for status toggle (as requested)
      } else {
        await fetchCategories();
      }
    } catch (err: any) {
      console.error("toggleActive error", err);
      setErrorMessage(err.message || "Failed to update status");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === "A-Z" ? "Z-A" : "A-Z";
    setSortOrder(newSortOrder);
    fetchCategories();
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
        .from("add_on_categories")
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

  // Check if add form is valid
  const isAddFormValid = newCategoryName.trim() && !duplicateError && !isCheckingDuplicate && !containsNumbers(newCategoryName);

  // Check if edit form has changes and is valid
  const hasEditChanges = editingCategory ? 
    (editCategoryDescription.trim() !== editingCategory.description || 
     editCategoryIsActive !== editingCategory.is_active) : false;
  
  const isEditFormValid = editCategoryDescription.trim() && hasEditChanges;

  const filtered = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || 
      (statusFilter === "Active" ? c.is_active : !c.is_active);
    return matchesSearch && matchesStatus;
  });

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
                Add-on Categories
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Manage add-on categories
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={() => {
                resetAddModal();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: Palette.red, backgroundColor: isDarkMode ? '#3f1f1f' : '#ffefef' }]}> 
              <Text style={{ color: Palette.red, fontSize: 13, fontFamily: 'Poppins-Regular' }}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by Category Name"
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <Text style={[styles.filterButtonText, { color: theme.text }]}>{statusFilter}</Text>
                <Ionicons name={statusDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              {statusDropdownOpen && (
                <View style={[
                  styles.dropdownMenu, 
                  { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border,
                    zIndex: 1000,
                  }
                ]}>
                  <ScrollView style={{ maxHeight: 150 }}>
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
                  </ScrollView>
                </View>
              )}
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
              <View style={[styles.columnHeaderWrapper, { flex: 1.2 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Category Name</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1.8 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Description</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Status</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Actions</Text>
              </View>
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
                <View key={c.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <View style={[styles.cellWrapper, { flex: 1.2, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>
                      {c.name}
                    </Text>
                  </View>

                  <View style={[styles.cellWrapper, { flex: 1.8, justifyContent: "center" }]}>
                    <Text 
                      style={[styles.cellText, { color: theme.textSecondary }]} 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                    >
                      {c.description || "No description"}
                    </Text>
                  </View>

                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <Switch 
                      value={!!c.is_active} 
                      onValueChange={() => handleToggleActive(c.id)} 
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={c.is_active ? Palette.white : Palette.black}
                      ios_backgroundColor={theme.textSecondary}
                    />
                  </View>

                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleViewDetails(c)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
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
        animationType="fade"
        onRequestClose={() => {
          setShowAddModal(false);
          resetAddModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowAddModal(false);
              resetAddModal();
            }}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.card,
              width: "95%",
              maxHeight: "85%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Category</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create a new add-on category
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetAddModal();
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
                        borderColor: addValidationError && !newCategoryName.trim() ? Palette.red : 
                                  duplicateError ? Palette.red : 
                                  containsNumbers(newCategoryName) ? Palette.red :
                                  theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Category Name"
                    placeholderTextColor={theme.textSecondary}
                    value={newCategoryName}
                    onChangeText={handleCategoryNameChange}
                    onBlur={handleCategoryNameBlur}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {isCheckingDuplicate && (
                    <View style={styles.checkingContainer}>
                      <ActivityIndicator size="small" color={Palette.blue} />
                      <Text style={[styles.checkingText, { color: theme.textSecondary }]}>
                        Checking availability...
                      </Text>
                    </View>
                  )}
                  {addValidationError && !newCategoryName.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                  {addValidationError && containsNumbers(newCategoryName) && (
                    <View style={styles.duplicateErrorContainer}>
                      <Ionicons name="alert-circle" size={14} color={Palette.red} />
                      <Text style={styles.duplicateErrorText}>{addValidationError}</Text>
                    </View>
                  )}
                  {duplicateError && (
                    <View style={styles.duplicateErrorContainer}>
                      <Ionicons name="alert-circle" size={14} color={Palette.red} />
                      <Text style={styles.duplicateErrorText}>{duplicateError}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Description
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      styles.formTextarea, 
                      { 
                        color: theme.text, 
                        borderColor: addValidationError && !newCategoryDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Category Description"
                    placeholderTextColor={theme.textSecondary}
                    value={newCategoryDescription}
                    onChangeText={(text) => {
                      setNewCategoryDescription(text);
                      setAddValidationError(null);
                    }}
                    onBlur={() => {
                      if (newCategoryDescription.trim()) {
                        setNewCategoryDescription(formatDescription(newCategoryDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {addValidationError && !newCategoryDescription.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={newCategoryIsActive}
                      onValueChange={setNewCategoryIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={newCategoryIsActive ? Palette.white : Palette.black}
                    />
                  </View>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    Inactive categories won't be available for selection
                  </Text>
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
                  resetAddModal();
                }}
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
                    backgroundColor: isAddFormValid ? Palette.primary : theme.border,
                    opacity: loading || isCheckingDuplicate || containsNumbers(newCategoryName) ? 0.7 : 1
                  }
                ]}
                onPress={handleAddCategory}
                disabled={!isAddFormValid || loading || isCheckingDuplicate || containsNumbers(newCategoryName)}
              >
                {loading || isCheckingDuplicate ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={isAddFormValid ? Palette.black : theme.textSecondary} />
                    <Text style={[
                      styles.saveButtonText,
                      { color: isAddFormValid ? Palette.black : theme.textSecondary }
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
        animationType="fade"
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
              maxHeight: "85%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Category</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {editingCategory ? `Editing: ${editingCategory.name}` : "Update category details"}
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
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Category Name
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {editingCategory?.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Description
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      styles.formTextarea, 
                      { 
                        color: theme.text, 
                        borderColor: editValidationError && !editCategoryDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Category Description"
                    placeholderTextColor={theme.textSecondary}
                    value={editCategoryDescription}
                    onChangeText={(text) => {
                      setEditCategoryDescription(text);
                      setEditValidationError(null);
                    }}
                    onBlur={() => {
                      if (editCategoryDescription.trim()) {
                        setEditCategoryDescription(formatDescription(editCategoryDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {editValidationError && !editCategoryDescription.trim() && (
                    <Text style={styles.errorText}>{editValidationError}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={editCategoryIsActive}
                      onValueChange={setEditCategoryIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={editCategoryIsActive ? Palette.white : Palette.black}
                    />
                  </View>
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
                  setShowEditModal(false);
                  setEditingCategory(null);
                }}
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
                    backgroundColor: hasEditChanges && isEditFormValid ? Palette.primary : theme.border,
                    opacity: loading ? 0.7 : 1
                  }
                ]}
                onPress={handleSaveEditCategory}
                disabled={!hasEditChanges || !isEditFormValid || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={hasEditChanges && isEditFormValid ? Palette.black : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.saveButtonText,
                      { color: hasEditChanges && isEditFormValid ? Palette.black : theme.textSecondary }
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

      {/* View Details Modal */}
      <Modal 
        visible={showDetailsModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDetailsModal(false)}
          />
          <View style={[
            styles.smallModalContent, 
            { 
              backgroundColor: theme.card,
              width: "85%",
              maxHeight: "70%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Category Details
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalBody}>
                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Category Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedCategory?.name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedCategory?.description || "No description provided"}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: selectedCategory?.is_active 
                        ? Palette.green + "20" 
                        : Palette.red + "20" 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: selectedCategory?.is_active ? Palette.green : Palette.red }
                    ]}>
                      {selectedCategory?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Created At
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedCategory?.created_at}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedCategory?.updated_at || 'Never'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={[
              styles.modalFooter,
              { 
                borderTopColor: theme.border,
                justifyContent: "flex-end"
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: Palette.primary }
                ]}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.closeButtonText}>
                  Close
                </Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    position: 'relative',
  },
  filterDropdownContainer: {
    position: 'relative',
    zIndex: 999,
  },
  searchBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    gap: 8,
    flex: 1
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 140,
    zIndex: 1000,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 150,
    elevation: 1000,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
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
  columnHeaderWrapper: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  columnHeader: { 
    fontWeight: "600", 
    fontSize: 12,
    textAlign: "center",
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
  cellWrapper: {
    justifyContent: "center",
    alignItems: "flex-start",
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
  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    color: Palette.red,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular'
  },
  duplicateErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  duplicateErrorText: {
    color: Palette.red,
    fontSize: 12,
    fontFamily: 'Poppins-Regular'
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular'
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  checkingText: {
    fontSize: 12,
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
  formTextarea: { 
    minHeight: 100, 
    textAlignVertical: "top" 
  },
  readOnlyField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: "500",
    fontFamily: 'Poppins-Medium'
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
  smallModalContent: {
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
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  closeButtonText: {
    color: Palette.black,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  detailGroup: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Poppins-Regular'
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
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
});