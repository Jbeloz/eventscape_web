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

export default function Services() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewingService, setViewingService] = useState<any>(null);
  const [deletingService, setDeletingService] = useState<any>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All Status" | "Active" | "Inactive">("All Status");
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addServiceName, setAddServiceName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addIsActive, setAddIsActive] = useState(true);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [addCategoryDropdownOpen, setAddCategoryDropdownOpen] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  // Duplicate checking
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, servicesRes] = await Promise.all([
        supabase.from("service_categories").select("*").order("category_name", { ascending: true }),
        supabase.from("services").select("*, service_categories(category_name)").order("service_name", { ascending: true })
      ]);
      
      if (categoriesRes.error) throw categoriesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      
      setCategories((categoriesRes.data || []).map((d: any) => ({ 
        id: d.category_id, 
        name: d.category_name 
      })));
      
      const mapped = (servicesRes.data || []).map((d: any) => ({
        id: d.service_id,
        category_id: d.category_id,
        // Handle both array and object cases for service_categories
        category_name: Array.isArray(d.service_categories) 
          ? (d.service_categories[0]?.category_name || "")
          : (d.service_categories?.category_name || ""),
        service_name: d.service_name || "",
        description: d.description || "",
        is_active: d.is_active,
        created_at: d.created_at ? formatDate(d.created_at) : null,
        updated_at: d.updated_at ? formatDate(d.updated_at) : null,
      }));
      
      // Sort the services
      const sorted = [...mapped].sort((a, b) => {
        if (sortOrder === "A-Z") {
          return a.service_name.localeCompare(b.service_name);
        } else {
          return b.service_name.localeCompare(a.service_name);
        }
      });
      
      setServices(sorted);
    } catch (err: any) {
      console.error("fetchAllData error", err);
      setErrorMessage(err.message || "Failed to load data");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Date formatting function
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

  // Validation and formatting functions
  const formatServiceName = (name: string): string => {
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

  // Function to prevent numbers in service name input
  const filterNumbersFromServiceName = (text: string): string => {
    return text.replace(/[0-9]/g, '');
  };

  const validateServiceName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Service name is required";
    }
    
    if (trimmedName.length < 2) {
      return "Service name must be at least 2 characters long";
    }
    
    if (trimmedName.length > 150) {
      return "Service name must be less than 150 characters";
    }
    
    // Check if name contains numbers
    if (/\d/.test(trimmedName)) {
      return "Service name cannot contain numbers";
    }
    
    // Format the name
    const formattedName = formatServiceName(trimmedName);
    
    return formattedName;
  };

  // Check if service name already exists in the same category
  const checkDuplicateServiceName = async (serviceName: string, categoryId: number): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const formattedName = formatServiceName(serviceName);
      
      const { data, error: checkError } = await supabase
        .from("services")
        .select("service_id")
        .ilike("service_name", formattedName)
        .eq("category_id", categoryId)
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

  const resetAddModal = () => {
    setAddCategoryId(null);
    setAddServiceName("");
    setAddDescription("");
    setAddIsActive(true);
    setAddValidationError(null);
    setDuplicateError(null);
  };

  // Handle service name change with duplicate checking - ONLY checks within selected category
  const handleServiceNameChange = async (text: string) => {
    // Prevent numbers from being entered
    const filteredText = filterNumbersFromServiceName(text);
    setAddServiceName(filteredText);
    setAddValidationError(null);
    
    // Clear duplicate error when user starts typing
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    // Check for duplicates after a short delay (if we have a category selected)
    if (filteredText.trim().length >= 2 && addCategoryId) {
      const formattedName = formatServiceName(filteredText.trim());
      if (formattedName) {
        // Check if this name already exists in the SAME category in current list
        const existing = services.find(s => 
          s.service_name.toLowerCase() === formattedName.toLowerCase() &&
          s.category_id === addCategoryId  // Only check within same category
        );
        
        if (existing) {
          setDuplicateError(`Service "${formattedName}" already exists in this category.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle service name blur - final validation
  const handleServiceNameBlur = async () => {
    if (addServiceName.trim() && addCategoryId) {
      const formattedName = formatServiceName(addServiceName);
      setAddServiceName(formattedName);
      
      // Final duplicate check - ONLY within same category
      if (formattedName && addCategoryId) {
        const isDuplicate = await checkDuplicateServiceName(formattedName, addCategoryId);
        if (isDuplicate) {
          setDuplicateError(`Service "${formattedName}" already exists in this category. Please use a different name.`);
        }
      }
    }
  };

  const handleAddService = async () => {
    // Clear previous errors
    setAddValidationError(null);
    setDuplicateError(null);
    
    // Validate category
    if (!addCategoryId) {
      setAddValidationError("Category is required");
      return;
    }
    
    // Validate service name
    const formattedName = validateServiceName(addServiceName);
    
    if (!formattedName || typeof formattedName !== "string") {
      setAddValidationError(formattedName || "Service name is required");
      return;
    }
    
    // Validate description
    const finalDescription = formatDescription(addDescription);
    if (!finalDescription) {
      setAddValidationError("Description is required");
      return;
    }
    
    // Check for duplicates before inserting - ONLY within same category
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicateServiceName(formattedName, addCategoryId);
      
      if (isDuplicate) {
        setDuplicateError(`Service "${formattedName}" already exists in this category. Please use a different name.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setErrorMessage("Failed to validate service. Please try again.");
      setShowErrorModal(true);
      setIsCheckingDuplicate(false);
      return;
    }
    
    // If no duplicates in same category, proceed with insertion
    try {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("services")
        .insert([
          {
            category_id: addCategoryId,
            service_name: formattedName,
            description: finalDescription,
            is_active: addIsActive,
          },
        ])
        .select("*, service_categories(category_name)");
      
      if (insertError) {
        // Check for duplicate key constraint error
        if (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('duplicate key')) {
          setDuplicateError(`Service "${formattedName}" already exists in this category. Please use a different name.`);
          return;
        }
        throw insertError;
      }
      
      if (data && data[0]) {
        const d = data[0];
        const newService = {
          id: d.service_id,
          category_id: d.category_id,
          // Handle both array and object cases for service_categories
          category_name: Array.isArray(d.service_categories) 
            ? (d.service_categories[0]?.category_name || "")
            : (d.service_categories?.category_name || ""),
          service_name: d.service_name,
          description: d.description,
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : null,
          updated_at: d.updated_at ? formatDate(d.updated_at) : null,
        };
        
        // Update the services list
        const updatedServices = [...services, newService].sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.service_name.localeCompare(b.service_name);
          } else {
            return b.service_name.localeCompare(a.service_name);
          }
        });
        
        setServices(updatedServices);
        setSuccessMessage("Service added successfully!");
        setShowSuccessModal(true);
      }
      
      resetAddModal();
      setShowAddModal(false);
    } catch (err: any) {
      console.error("add error", err);
      
      // Handle specific error cases
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Service "${formattedName}" already exists in this category. Please use a different name.`);
      } else {
        setErrorMessage(err.message || "Failed to add service");
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setEditCategoryId(service.category_id);
    setEditServiceName(service.service_name);
    setEditDescription(service.description || "");
    setEditIsActive(!!service.is_active);
    setEditValidationError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const finalDescription = formatDescription(editDescription);
    
    if (!finalDescription) {
      setEditValidationError("Description is required");
      return;
    }

    if (!editingService) return;
    
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from("services")
        .update({
          description: finalDescription,
          is_active: editIsActive,
        })
        .eq("service_id", editingService.id)
        .select("*, service_categories(category_name)");
      
      if (updateError) throw updateError;
      
      if (data && data[0]) {
        const d = data[0];
        const updatedService = {
          id: d.service_id,
          category_id: d.category_id,
          // Handle both array and object cases for service_categories
          category_name: Array.isArray(d.service_categories) 
            ? (d.service_categories[0]?.category_name || "")
            : (d.service_categories?.category_name || ""),
          service_name: d.service_name,
          description: d.description,
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : editingService.created_at,
          updated_at: d.updated_at ? formatDate(d.updated_at) : 'Just now',
        };
        
        // Update the services list
        const updatedServices = services.map((s) => 
          s.id === editingService.id ? updatedService : s
        ).sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.service_name.localeCompare(b.service_name);
          } else {
            return b.service_name.localeCompare(a.service_name);
          }
        });
        
        setServices(updatedServices);
        setSuccessMessage("Service updated successfully!");
        setShowSuccessModal(true);
      } else {
        await fetchAllData();
      }
      
      setShowEditModal(false);
      setEditingService(null);
    } catch (err: any) {
      console.error("update error", err);
      setErrorMessage(err.message || "Failed to update service");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewService = (service: any) => {
    setViewingService(service);
    setShowViewModal(true);
  };

  const showDeleteConfirmation = (service: any) => {
    setDeletingService(service);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingService) return;
    
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("service_id", deletingService.id);
      
      if (deleteError) throw deleteError;
      
      setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
      setSuccessMessage(`Service "${deletingService.service_name}" deleted successfully!`);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("delete error", err);
      setErrorMessage("Failed to delete service");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingService(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingService(null);
  };

  const handleToggleActive = async (id: number) => {
    try {
      setLoading(true);
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
        setServices((prev) => prev.map((s) => s.id === id ? { 
          ...s, 
          is_active: data[0].is_active,
          updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
        } : s));
        // No popup for status toggle
      } else {
        await fetchAllData();
      }
    } catch (err: any) {
      console.error("toggle error", err);
      setErrorMessage(err.message || "Failed to update status");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === "A-Z" ? "Z-A" : "A-Z";
    setSortOrder(newSortOrder);
    
    const sortedServices = [...services].sort((a, b) => {
      if (newSortOrder === "A-Z") {
        return a.service_name.localeCompare(b.service_name);
      } else {
        return b.service_name.localeCompare(a.service_name);
      }
    });
    
    setServices(sortedServices);
  };

  // Search function - searches ONLY by service name
  const filteredServices = services.filter((s) => {
    // Handle category filter
    const matchesCategory = !filterCategoryId || s.category_id === filterCategoryId;
    
    // Handle status filter
    const matchesStatus = statusFilter === "All Status" || 
      (statusFilter === "Active" ? s.is_active : !s.is_active);
    
    // If no search text, return based on category and status only
    if (!searchText || searchText.trim() === '') {
      return matchesCategory && matchesStatus;
    }
    
    // Prepare search text
    const searchTerm = searchText.toLowerCase().trim();
    
    // Get service name safely with fallback
    const serviceName = String(s.service_name || '').toLowerCase();
    
    // Check if service name contains the search term
    const matchesSearch = serviceName.includes(searchTerm);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedCategory = categories.find(c => c.id === filterCategoryId);
  const selectedAddCategory = categories.find(c => c.id === addCategoryId);
  const selectedEditCategory = categories.find(c => c.id === editCategoryId);

  // Check if add form is valid
  const isAddFormValid = addCategoryId && addServiceName.trim() && addDescription.trim() && !duplicateError && !isCheckingDuplicate;

  // Check if edit form has changes and is valid
  const hasEditChanges = editingService ? 
    (editDescription.trim() !== editingService.description || 
     editIsActive !== editingService.is_active) : false;
  
  const isEditFormValid = editDescription.trim() && hasEditChanges;

  if (loading && services.length === 0) {
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
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage services and categories</Text>
            </View>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={() => {
                resetAddModal();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by service name..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Category Filter Dropdown */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
              >
                <Text style={[styles.filterButtonText, { color: selectedCategory ? theme.text : theme.textSecondary }]}>
                  {selectedCategory ? selectedCategory.name : "All Categories"}
                </Text>
                <Ionicons name={categoryDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              {categoryDropdownOpen && (
                <View style={[
                  styles.dropdownMenu, 
                  { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border,
                    zIndex: 1000,
                  }
                ]}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFilterCategoryId(null);
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                        All Categories
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFilterCategoryId(cat.id);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Status Filter Dropdown */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setCategoryDropdownOpen(false);
                }}
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
                          setStatusFilter(status as any);
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
            
            {/* Sort Order */}
            <TouchableOpacity
              style={[
                styles.sortButton,
                { borderColor: theme.border, backgroundColor: theme.card }
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
              <View style={[styles.columnHeaderWrapper, { flex: 1.5 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Service Name</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Category</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1.5 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Description</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Status</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Actions</Text>
              </View>
            </View>

            {filteredServices.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {searchText ? `No services found for "${searchText}"` : "No services found"}
                </Text>
              </View>
            ) : (
              filteredServices.map((s) => (
                <View 
                  key={s.id} 
                  style={[styles.tableRow, { borderColor: theme.border }]}
                >
                  <View style={[styles.cellWrapper, { flex: 1.5, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>
                      {s.service_name}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 1, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]}>
                      {s.category_name}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 1.5, justifyContent: "center" }]}>
                    <Text 
                      style={[styles.cellText, { color: theme.textSecondary }]} 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                    >
                      {s.description}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <Switch 
                      value={!!s.is_active} 
                      onValueChange={() => handleToggleActive(s.id)} 
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={s.is_active ? Palette.white : Palette.black}
                      ios_backgroundColor={theme.textSecondary}
                    />
                  </View>
                  
                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleViewService(s)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleEditService(s)}
                      >
                        <Ionicons name="pencil" size={18} color={Palette.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => showDeleteConfirmation(s)}
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
          setAddCategoryDropdownOpen(false);
          resetAddModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowAddModal(false);
              setAddCategoryDropdownOpen(false);
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Service</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create a new service
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setAddCategoryDropdownOpen(false);
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
                {/* Category - Custom Dropdown */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Category
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={{ position: 'relative', zIndex: 1000 }}>
                    <TouchableOpacity
                      style={[
                        styles.customDropdown,
                        { 
                          backgroundColor: theme.lightBg, 
                          borderColor: addValidationError && !addCategoryId ? Palette.red : theme.border
                        }
                      ]}
                      onPress={() => {
                        setAddCategoryDropdownOpen(!addCategoryDropdownOpen);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText, 
                        { color: selectedAddCategory ? theme.text : theme.textSecondary }
                      ]}>
                        {selectedAddCategory ? selectedAddCategory.name : "Select Category"}
                      </Text>
                      <Ionicons 
                        name={addCategoryDropdownOpen ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={theme.textSecondary} 
                      />
                    </TouchableOpacity>
                    
                    {addCategoryDropdownOpen && (
                      <View style={[
                        styles.dropdownOptions,
                        { 
                          backgroundColor: theme.card, 
                          borderColor: theme.border,
                          position: 'absolute',
                          top: 50,
                          left: 0,
                          right: 0,
                          zIndex: 1001,
                          elevation: 1000,
                        }
                      ]}>
                        <ScrollView style={{ maxHeight: 150 }}>
                          {categories.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setAddCategoryId(cat.id);
                                setAddCategoryDropdownOpen(false);
                                // Clear any existing duplicate error when category changes
                                setDuplicateError(null);
                                // Check for duplicates in the new category
                                if (addServiceName.trim()) {
                                  const formattedName = formatServiceName(addServiceName);
                                  const existing = services.find(s => 
                                    s.service_name.toLowerCase() === formattedName.toLowerCase() &&
                                    s.category_id === cat.id
                                  );
                                  
                                  if (existing) {
                                    setDuplicateError(`Service "${formattedName}" already exists in this category.`);
                                  } else {
                                    setDuplicateError(null);
                                  }
                                }
                              }}
                            >
                              <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  {addValidationError && !addCategoryId && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                </View>

                {/* Service Name */}
                <View style={[styles.formGroup, { marginTop: addCategoryDropdownOpen ? 150 : 0 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Service Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: addValidationError && !addServiceName.trim() ? Palette.red : 
                                  duplicateError ? Palette.red : 
                                  theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Service Name (Letters only)"
                    placeholderTextColor={theme.textSecondary}
                    value={addServiceName}
                    onChangeText={handleServiceNameChange}
                    onBlur={handleServiceNameBlur}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={150}
                  />
                  {isCheckingDuplicate && (
                    <View style={styles.checkingContainer}>
                      <ActivityIndicator size="small" color={Palette.blue} />
                      <Text style={[styles.checkingText, { color: theme.textSecondary }]}>
                        Checking availability...
                      </Text>
                    </View>
                  )}
                  {addValidationError && !addServiceName.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                  {duplicateError && (
                    <View style={styles.duplicateErrorContainer}>
                      <Ionicons name="alert-circle" size={14} color={Palette.red} />
                      <Text style={styles.duplicateErrorText}>{duplicateError}</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
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
                        borderColor: addValidationError && !addDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Service Description"
                    placeholderTextColor={theme.textSecondary}
                    value={addDescription}
                    onChangeText={(text) => {
                      setAddDescription(text);
                      setAddValidationError(null);
                    }}
                    onBlur={() => {
                      if (addDescription.trim()) {
                        setAddDescription(formatDescription(addDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {addValidationError && !addDescription.trim() && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                </View>

                {/* Active Status */}
                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={addIsActive}
                      onValueChange={setAddIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={addIsActive ? Palette.white : Palette.black}
                    />
                  </View>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    Inactive services won't be available for selection
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
                  setAddCategoryDropdownOpen(false);
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
                onPress={handleAddService}
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
                      Create Service
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
          setEditingService(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEditModal(false);
              setEditingService(null);
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Service</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {editingService ? `Editing: ${editingService.service_name}` : "Update service details"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setEditingService(null);
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
                {/* Category (Read-only) */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Category
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {selectedEditCategory?.name || editingService?.category_name}
                    </Text>
                  </View>
                </View>

                {/* Service Name (Read-only) */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Service Name
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {editingService?.service_name}
                    </Text>
                  </View>
                </View>

                {/* Description */}
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
                        borderColor: editValidationError && !editDescription.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Service Description"
                    placeholderTextColor={theme.textSecondary}
                    value={editDescription}
                    onChangeText={(text) => {
                      setEditDescription(text);
                      setEditValidationError(null);
                    }}
                    onBlur={() => {
                      if (editDescription.trim()) {
                        setEditDescription(formatDescription(editDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {editValidationError && !editDescription.trim() && (
                    <Text style={styles.errorText}>{editValidationError}</Text>
                  )}
                </View>

                {/* Active Status */}
                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={editIsActive}
                      onValueChange={setEditIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={editIsActive ? Palette.white : Palette.black}
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
                  setEditingService(null);
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
                onPress={handleSaveEdit}
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
                  Service Details
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
                    Service Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingService?.service_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingService?.category_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingService?.description}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: viewingService?.is_active 
                        ? Palette.green + "20" 
                        : Palette.red + "20" 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: viewingService?.is_active ? Palette.green : Palette.red }
                    ]}>
                      {viewingService?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Created At
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingService?.created_at}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingService?.updated_at || 'Never'}
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
                Delete Service
              </Text>
            </View>
            <View style={styles.alertBody}>
              <Ionicons name="alert-circle" size={48} color={Palette.red} />
              <Text style={[styles.alertMessage, { color: theme.text }]}>
                Are you sure you want to delete "{deletingService?.service_name}"?
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
  customDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    zIndex: 1000,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  dropdownOptions: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 150,
    elevation: 1000,
    zIndex: 1001,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownOptionText: {
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