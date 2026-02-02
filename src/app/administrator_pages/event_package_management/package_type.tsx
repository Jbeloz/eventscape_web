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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [viewingType, setViewingType] = useState<any>(null);

  // Add Modal State
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeIsActive, setTypeIsActive] = useState(true);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Edit Modal State
  const [editTypeDescription, setEditTypeDescription] = useState("");
  const [editTypeIsActive, setEditTypeIsActive] = useState(true);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  // Success/Error Modal Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchTypes();
  }, []);

  // Validation and formatting functions
  const formatTypeName = (name: string): string => {
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

  const validateTypeName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Type name is required";
    }
    
    if (trimmedName.length < 2) {
      return "Type name must be at least 2 characters long";
    }
    
    if (trimmedName.length > 50) {
      return "Type name must be less than 50 characters";
    }
    
    // Check if name contains numbers
    if (/\d/.test(trimmedName)) {
      return "Type name cannot contain numbers";
    }
    
    // Format the name
    const formattedName = formatTypeName(trimmedName);
    
    return formattedName;
  };

  // Function to prevent numbers in type name input
  const filterNumbersFromTypeName = (text: string): string => {
    return text.replace(/[0-9]/g, '');
  };

  // Check if type name already exists
  const checkDuplicateTypeName = async (typeName: string): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const formattedName = formatTypeName(typeName);
      
      const { data, error: checkError } = await supabase
        .from("package_types")
        .select("type_name")
        .ilike("type_name", formattedName)
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
        created_at: d.created_at ? formatDate(d.created_at) : null,
        updated_at: d.updated_at ? formatDate(d.updated_at) : null,
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
    setAddValidationError(null);
    setDuplicateError(null);
  };

  const handleAddType = async () => {
    // Clear previous errors
    setAddValidationError(null);
    setDuplicateError(null);
    
    // Validate type name
    const formattedName = validateTypeName(typeName);
    
    if (!formattedName || typeof formattedName !== "string") {
      setAddValidationError(formattedName || "Type name is required");
      return;
    }
    
    // Validate description
    const finalDescription = formatDescription(typeDescription);
    if (!finalDescription) {
      setAddValidationError("Description is required");
      return;
    }
    
    // Check for duplicates before inserting
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicateTypeName(typeName);
      
      if (isDuplicate) {
        setDuplicateError(`Package type "${formattedName}" already exists. Please use a different name.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setErrorMessage("Failed to validate package type. Please try again.");
      setShowErrorModal(true);
      setIsCheckingDuplicate(false);
      return;
    }
    
    // If no duplicates, proceed with insertion
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("package_types")
        .insert([
          {
            type_name: formattedName,
            description: finalDescription,
            is_active: typeIsActive,
          },
        ])
        .select();
      
      if (insertError) {
        // Check for duplicate key constraint error
        if (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('duplicate key')) {
          setDuplicateError(`Package type "${formattedName}" already exists. Please use a different name.`);
          return;
        }
        throw insertError;
      }
      
      if (data && data[0]) {
        const d = data[0];
        const newType = {
          id: d.package_type_id,
          type_name: d.type_name,
          description: d.description,
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : null,
          updated_at: d.updated_at ? formatDate(d.updated_at) : null,
        };
        setTypes((prev) => [...prev, newType]);
      }
      resetAddModal();
      setShowAddModal(false);
      setSuccessMessage("Package type added successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("addType error", err);
      
      // Handle specific error cases
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Package type "${formattedName}" already exists. Please use a different name.`);
      } else {
        setErrorMessage(err.message || "Failed to add package type");
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
      setIsCheckingDuplicate(false);
    }
  }; 

  // Handle type name change with duplicate checking
  const handleTypeNameChange = async (text: string) => {
    // Prevent numbers from being entered
    const filteredText = filterNumbersFromTypeName(text);
    setTypeName(filteredText);
    setAddValidationError(null);
    
    // Clear duplicate error when user starts typing
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    // Check for duplicates after a short delay (debounce effect)
    if (filteredText.trim().length >= 2) {
      const formattedName = formatTypeName(filteredText.trim());
      if (formattedName) {
        // Check if this name already exists in the current list
        const existing = types.find(t => 
          t.type_name.toLowerCase() === formattedName.toLowerCase()
        );
        
        if (existing) {
          setDuplicateError(`Package type "${formattedName}" already exists.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle type name blur - final validation
  const handleTypeNameBlur = async () => {
    if (typeName.trim()) {
      const formattedName = formatTypeName(typeName);
      setTypeName(formattedName);
      
      // Final duplicate check
      if (formattedName) {
        const isDuplicate = await checkDuplicateTypeName(formattedName);
        if (isDuplicate) {
          setDuplicateError(`Package type "${formattedName}" already exists. Please use a different name.`);
        }
      }
    }
  };

  const handleEditType = (type: any) => {
    setEditingType(type);
    setEditTypeDescription(type.description);
    setEditTypeIsActive(!!type.is_active);
    setEditValidationError(null);
    setShowEditModal(true);
  };

  const handleSaveEditType = async () => {
    const finalDescription = formatDescription(editTypeDescription);
    
    if (!finalDescription) {
      setEditValidationError("Description is required");
      return;
    }

    if (!editingType) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("package_types")
        .update({
          description: finalDescription,
          is_active: editTypeIsActive,
        })
        .eq("package_type_id", editingType.id)
        .select();
      if (updateError) throw updateError;
      if (data && data[0]) {
        const updatedType = {
          id: data[0].package_type_id,
          type_name: data[0].type_name,
          description: data[0].description,
          is_active: data[0].is_active,
          created_at: data[0].created_at ? formatDate(data[0].created_at) : editingType.created_at,
          updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
        };
        
        setTypes((prev) =>
          prev.map((t) =>
            t.id === editingType.id ? updatedType : t
          )
        );
      } else {
        await fetchTypes();
      }
      setShowEditModal(false);
      setEditingType(null);
      setSuccessMessage("Package type updated successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("updateType error", err);
      setErrorMessage(err.message || "Failed to update package type");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }; 

  const handleViewType = (type: any) => {
    setViewingType(type);
    setShowViewModal(true);
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
                  updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
                }
              : t
          )
        );
        // No popup for status toggle - removed success modal call
      } else {
        await fetchTypes();
      }
    } catch (err: any) {
      console.error("toggleActive error", err);
      setErrorMessage(err.message || "Failed to update status");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Search function - Now searches ONLY by package type name
  const filteredTypes = types.filter((t) => {
    // Handle status filter
    const matchesStatus =
      statusFilter === "All Status" || (statusFilter === "Active" ? t.is_active : !t.is_active);
    
    // If no search text, return based on status only
    if (!searchText || searchText.trim() === '') {
      return matchesStatus;
    }
    
    // Prepare search text
    const searchTerm = searchText.toLowerCase().trim();
    
    // Get package type name safely with fallback
    const typeName = String(t.type_name || '').toLowerCase();
    
    // Check if package type name contains the search term
    const matchesSearch = typeName.includes(searchTerm);
    
    return matchesSearch && matchesStatus;
  });

  // Check if add form is valid
  const isAddFormValid = typeName.trim() && typeDescription.trim() && !duplicateError && !isCheckingDuplicate;

  // Check if edit form has changes and is valid
  const hasEditChanges = editingType ? 
    (editTypeDescription.trim() !== editingType.description || 
     editTypeIsActive !== editingType.is_active) : false;
  
  const isEditFormValid = editTypeDescription.trim() && hasEditChanges;

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
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={() => {
                resetAddModal();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Type</Text>
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
                placeholder="Search by package type name..."
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
                <Text style={[styles.columnHeader, { color: theme.text }]}>Type Name</Text>
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

            {filteredTypes.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {searchText ? `No package types found for "${searchText}"` : "No package types found"}
                </Text>
              </View>
            ) : (
              filteredTypes.map((t) => (
                <View key={t.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <View style={[styles.cellWrapper, { flex: 1.2, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>{t.type_name}</Text>
                  </View>

                  <View style={[styles.cellWrapper, { flex: 1.8, justifyContent: "center" }]}>
                    <Text 
                      style={[styles.cellText, { color: theme.textSecondary }]} 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                    >
                      {t.description}
                    </Text>
                  </View>

                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <Switch 
                      value={!!t.is_active} 
                      onValueChange={() => handleToggleActive(t.id)} 
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={t.is_active ? Palette.white : Palette.black}
                      ios_backgroundColor={theme.textSecondary}
                    />
                  </View>

                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleViewType(t)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleEditType(t)}
                      >
                        <Ionicons name="pencil" size={18} color={Palette.primary} />
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Package Type</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create a new package type
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
                      Type Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: addValidationError && !typeName.trim() ? Palette.red : 
                                  duplicateError ? Palette.red : 
                                  theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Package Type Name"
                    placeholderTextColor={theme.textSecondary}
                    value={typeName}
                    onChangeText={handleTypeNameChange}
                    onBlur={handleTypeNameBlur}
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
                  {addValidationError && !typeName.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
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
                        borderColor: addValidationError && !typeDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Package Type Description"
                    placeholderTextColor={theme.textSecondary}
                    value={typeDescription}
                    onChangeText={(text) => {
                      setTypeDescription(text);
                      setAddValidationError(null);
                    }}
                    onBlur={() => {
                      if (typeDescription.trim()) {
                        setTypeDescription(formatDescription(typeDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {addValidationError && !typeDescription.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={typeIsActive}
                      onValueChange={setTypeIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={typeIsActive ? Palette.white : Palette.black}
                    />
                  </View>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    Inactive types won't be available for selection
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
                    opacity: loading || isCheckingDuplicate ? 0.7 : 1
                  }
                ]}
                onPress={handleAddType}
                disabled={!isAddFormValid || loading || isCheckingDuplicate}
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
                      Create Type
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
          setEditingType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEditModal(false);
              setEditingType(null);
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Package Type</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {editingType ? `Editing: ${editingType.type_name}` : "Update package type details"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setEditingType(null);
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
                    Type Name
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {editingType?.type_name}
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
                        borderColor: editValidationError && !editTypeDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Package Type Description"
                    placeholderTextColor={theme.textSecondary}
                    value={editTypeDescription}
                    onChangeText={(text) => {
                      setEditTypeDescription(text);
                      setEditValidationError(null);
                    }}
                    onBlur={() => {
                      if (editTypeDescription.trim()) {
                        setEditTypeDescription(formatDescription(editTypeDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {editValidationError && !editTypeDescription.trim() && (
                    <Text style={styles.errorText}>{editValidationError}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={editTypeIsActive}
                      onValueChange={setEditTypeIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={editTypeIsActive ? Palette.white : Palette.black}
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
                  setEditingType(null);
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
                onPress={handleSaveEditType}
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
        visible={showViewModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowViewModal(false)}
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
                  Package Type Details
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
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
                    Type Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingType?.type_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingType?.description}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: viewingType?.is_active 
                        ? Palette.green + "20" 
                        : Palette.red + "20" 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: viewingType?.is_active ? Palette.green : Palette.red }
                    ]}>
                      {viewingType?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Created At
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingType?.created_at}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingType?.updated_at || 'Never'}
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
                  styles.closeButton,
                  { backgroundColor: Palette.primary }
                ]}
                onPress={() => setShowViewModal(false)}
              >
                <Text style={styles.closeButtonText}>
                  Close
                </Text>
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
    alignSelf: "center",
    width: "100%",
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
});