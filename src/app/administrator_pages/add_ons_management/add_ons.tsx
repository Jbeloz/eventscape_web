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

export default function AddOns() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [addOns, setAddOns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewingAddOn, setViewingAddOn] = useState<any>(null);
  const [deletingAddOn, setDeletingAddOn] = useState<any>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All Status" | "Active" | "Inactive">("All Status");
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addAddOnName, setAddAddOnName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addPriceType, setAddPriceType] = useState<"fixed" | "per_pax">("fixed");
  const [addDefaultPrice, setAddDefaultPrice] = useState<string>("");
  const [addIsActive, setAddIsActive] = useState(true);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [addCategoryDropdownOpen, setAddCategoryDropdownOpen] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<any>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editPriceType, setEditPriceType] = useState<"fixed" | "per_pax">("fixed");
  const [editDefaultPrice, setEditDefaultPrice] = useState<string>("");
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
      const [categoriesRes, addOnsRes] = await Promise.all([
        supabase
          .from("add_on_categories")
          .select("*")
          .order("category_name", { ascending: true }),
        supabase
          .from("add_ons")
          .select("*, add_on_categories(category_name)")
          .order("add_on_name", { ascending: true })
      ]);
      
      if (categoriesRes.error) throw categoriesRes.error;
      if (addOnsRes.error) throw addOnsRes.error;
      
      setCategories((categoriesRes.data || []).map((d: any) => ({ 
        id: d.category_id, 
        name: d.category_name,
        is_active: d.is_active 
      })));
      
      const mapped = (addOnsRes.data || []).map((d: any) => ({
        id: d.add_on_id,
        category_id: d.category_id,
        category_name: d.add_on_categories?.category_name || "",
        add_on_name: d.add_on_name || "",
        description: d.description || "",
        price_type: d.price_type || "fixed",
        default_price: parseFloat(d.default_price) || 0,
        is_active: d.is_active,
        created_at: d.created_at ? formatDate(d.created_at) : null,
        updated_at: d.updated_at ? formatDate(d.updated_at) : null,
      }));
      
      // Sort the add-ons
      const sorted = [...mapped].sort((a, b) => {
        if (sortOrder === "A-Z") {
          return a.add_on_name.localeCompare(b.add_on_name);
        } else {
          return b.add_on_name.localeCompare(a.add_on_name);
        }
      });
      
      setAddOns(sorted);
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
  const formatAddOnName = (name: string): string => {
    const trimmedName = name.trim();
    if (!trimmedName) return "";
    
    const words = trimmedName.split(/\s+/);
    const formattedWords = words.map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return formattedWords.join(" ");
  };

  // MODIFIED: Updated formatDescription to allow numbers
  const formatDescription = (description: string): string => {
    const trimmedDesc = description.trim();
    if (!trimmedDesc) return "";
    
    // Just return the trimmed description as-is to preserve numbers
    return trimmedDesc;
  };

  const validateAddOnName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Add-on name is required";
    }
    
    if (trimmedName.length < 2) {
      return "Add-on name must be at least 2 characters long";
    }
    
    if (trimmedName.length > 150) {
      return "Add-on name must be less than 150 characters";
    }
    
    // Check if name contains numbers
    if (/\d/.test(trimmedName)) {
      return "Add-on name cannot contain numbers";
    }
    
    // Format the name
    const formattedName = formatAddOnName(trimmedName);
    
    return formattedName;
  };

  // MODIFIED: Updated validateDescription to allow numbers
  const validateDescription = (description: string): string | null => {
    const trimmedDesc = description.trim();
    
    // Description is optional, no restrictions on content
    // You can add length limits if needed
    if (trimmedDesc.length > 500) {
      return "Description must be less than 500 characters";
    }
    
    return null;
  };

  const validatePrice = (price: string): { isValid: boolean; value: number; error?: string } => {
    const trimmedPrice = price.trim();
    
    if (!trimmedPrice) {
      return { isValid: false, value: 0, error: "Price is required" };
    }
    
    // Check for invalid patterns like "0", "01", "-0", etc.
    if (trimmedPrice === "0" || trimmedPrice === "0." || trimmedPrice.startsWith("0") && trimmedPrice !== "0.00") {
      return { isValid: false, value: 0, error: "Price cannot be zero or start with zero followed by other digits" };
    }
    
    if (trimmedPrice.startsWith("-0")) {
      return { isValid: false, value: 0, error: "Invalid price format" };
    }
    
    const priceValue = parseFloat(trimmedPrice);
    
    if (isNaN(priceValue)) {
      return { isValid: false, value: 0, error: "Please enter a valid number" };
    }
    
    if (priceValue < 0) {
      return { isValid: false, value: priceValue, error: "Price cannot be negative" };
    }
    
    if (priceValue > 999999.99) {
      return { isValid: false, value: priceValue, error: "Price is too high" };
    }
    
    // Check for too many decimal places
    if (trimmedPrice.includes('.') && trimmedPrice.split('.')[1].length > 2) {
      return { isValid: false, value: priceValue, error: "Price can have maximum 2 decimal places" };
    }
    
    return { isValid: true, value: priceValue };
  };

  // Check if add-on name already exists in the same category
  const checkDuplicateAddOnName = async (addOnName: string, categoryId: number): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const formattedName = formatAddOnName(addOnName);
      
      const { data, error: checkError } = await supabase
        .from("add_ons")
        .select("add_on_id")
        .ilike("add_on_name", formattedName)
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
    setAddAddOnName("");
    setAddDescription("");
    setAddPriceType("fixed");
    setAddDefaultPrice("");
    setAddIsActive(true);
    setAddValidationError(null);
    setDuplicateError(null);
  };

  // Handle add-on name change with duplicate checking
  const handleAddOnNameChange = async (text: string) => {
    // Don't allow numbers
    const filteredText = text.replace(/[0-9]/g, '');
    setAddAddOnName(filteredText);
    setAddValidationError(null);
    
    // Clear duplicate error when user starts typing
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    // Check for duplicates after a short delay (if we have a category selected)
    if (filteredText.trim().length >= 2 && addCategoryId) {
      const formattedName = formatAddOnName(filteredText.trim());
      if (formattedName) {
        // Check if this name already exists in the current list with same category
        const existing = addOns.find(a => 
          a.add_on_name.toLowerCase() === formattedName.toLowerCase() &&
          a.category_id === addCategoryId
        );
        
        if (existing) {
          setDuplicateError(`Add-on "${formattedName}" already exists in this category.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle add-on name blur - final validation
  const handleAddOnNameBlur = async () => {
    if (addAddOnName.trim() && addCategoryId) {
      const formattedName = formatAddOnName(addAddOnName);
      setAddAddOnName(formattedName);
      
      // Final duplicate check
      if (formattedName && addCategoryId) {
        const isDuplicate = await checkDuplicateAddOnName(formattedName, addCategoryId);
        if (isDuplicate) {
          setDuplicateError(`Add-on "${formattedName}" already exists in this category. Please use a different name.`);
        }
      }
    }
  };

  // MODIFIED: Updated handleDescriptionChange to allow numbers
  const handleDescriptionChange = (text: string) => {
    setAddDescription(text);
    setAddValidationError(null);
  };

  // Handle price change - validate input
  const handlePriceChange = (text: string, isEdit: boolean = false) => {
    // Allow only numbers and one decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Don't allow "0" followed by other digits (except "0." or "0.xx")
    if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0.")) {
      cleaned = "0";
    }
    
    // Don't allow negative zero
    if (cleaned.startsWith("-0")) {
      cleaned = cleaned.replace("-", "");
    }
    
    if (isEdit) {
      setEditDefaultPrice(cleaned);
      setEditValidationError(null);
    } else {
      setAddDefaultPrice(cleaned);
      setAddValidationError(null);
    }
  };

  const handleAddAddOn = async () => {
    // Clear previous errors
    setAddValidationError(null);
    setDuplicateError(null);
    
    // Validate category
    if (!addCategoryId) {
      setAddValidationError("Category is required");
      return;
    }
    
    // Validate add-on name
    const nameValidation = validateAddOnName(addAddOnName);
    if (typeof nameValidation === 'string' && nameValidation.includes("cannot contain numbers")) {
      setAddValidationError(nameValidation);
      return;
    }
    
    if (!nameValidation || typeof nameValidation !== "string") {
      setAddValidationError(nameValidation || "Add-on name is required");
      return;
    }
    
    // Validate description
    const descValidation = validateDescription(addDescription);
    if (descValidation) {
      setAddValidationError(descValidation);
      return;
    }
    
    // Validate price
    const priceValidation = validatePrice(addDefaultPrice);
    if (!priceValidation.isValid) {
      setAddValidationError(priceValidation.error || "Invalid price");
      return;
    }
    
    // Validate description (optional)
    const finalDescription = formatDescription(addDescription);
    
    // Check for duplicates before inserting
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicateAddOnName(nameValidation, addCategoryId);
      
      if (isDuplicate) {
        setDuplicateError(`Add-on "${nameValidation}" already exists in this category. Please use a different name.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setErrorMessage("Failed to validate add-on. Please try again.");
      setShowErrorModal(true);
      setIsCheckingDuplicate(false);
      return;
    }
    
    // If no duplicates, proceed with insertion
    try {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("add_ons")
        .insert([
          {
            category_id: addCategoryId,
            add_on_name: nameValidation,
            description: finalDescription,
            price_type: addPriceType,
            default_price: priceValidation.value,
            is_active: addIsActive,
          },
        ])
        .select("*, add_on_categories(category_name)");
      
      if (insertError) {
        // Check for duplicate key constraint error
        if (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('duplicate key')) {
          setDuplicateError(`Add-on "${nameValidation}" already exists in this category. Please use a different name.`);
          return;
        }
        throw insertError;
      }
      
      if (data && data[0]) {
        const d = data[0];
        const newAddOn = {
          id: d.add_on_id,
          category_id: d.category_id,
          category_name: d.add_on_categories?.category_name || "",
          add_on_name: d.add_on_name,
          description: d.description,
          price_type: d.price_type,
          default_price: parseFloat(d.default_price) || 0,
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : null,
          updated_at: d.updated_at ? formatDate(d.updated_at) : null,
        };
        
        // Update the add-ons list
        const updatedAddOns = [...addOns, newAddOn].sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.add_on_name.localeCompare(b.add_on_name);
          } else {
            return b.add_on_name.localeCompare(a.add_on_name);
          }
        });
        
        setAddOns(updatedAddOns);
        setSuccessMessage("Add-on added successfully!");
        setShowSuccessModal(true);
      }
      
      resetAddModal();
      setShowAddModal(false);
    } catch (err: any) {
      console.error("add error", err);
      
      // Handle specific error cases
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Add-on "${nameValidation}" already exists in this category. Please use a different name.`);
      } else {
        setErrorMessage(err.message || "Failed to add add-on");
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleEditAddOn = (addOn: any) => {
    setEditingAddOn(addOn);
    setEditDescription(addOn.description || "");
    setEditPriceType(addOn.price_type);
    setEditDefaultPrice(String(addOn.default_price) || "");
    setEditIsActive(!!addOn.is_active);
    setEditValidationError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAddOn) return;
    
    // Validate description
    const descValidation = validateDescription(editDescription);
    if (descValidation) {
      setEditValidationError(descValidation);
      return;
    }
    
    // Validate price
    const priceValidation = validatePrice(editDefaultPrice);
    if (!priceValidation.isValid) {
      setEditValidationError(priceValidation.error || "Invalid price");
      return;
    }
    
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from("add_ons")
        .update({
          description: formatDescription(editDescription),
          price_type: editPriceType,
          default_price: priceValidation.value,
          is_active: editIsActive,
        })
        .eq("add_on_id", editingAddOn.id)
        .select("*, add_on_categories(category_name)");
      
      if (updateError) throw updateError;
      
      if (data && data[0]) {
        const d = data[0];
        const updatedAddOn = {
          id: d.add_on_id,
          category_id: d.category_id,
          category_name: d.add_on_categories?.category_name || "",
          add_on_name: d.add_on_name,
          description: d.description,
          price_type: d.price_type,
          default_price: parseFloat(d.default_price) || 0,
          is_active: d.is_active,
          created_at: d.created_at ? formatDate(d.created_at) : editingAddOn.created_at,
          updated_at: d.updated_at ? formatDate(d.updated_at) : 'Just now',
        };
        
        // Update the add-ons list
        const updatedAddOns = addOns.map((a) => 
          a.id === editingAddOn.id ? updatedAddOn : a
        ).sort((a, b) => {
          if (sortOrder === "A-Z") {
            return a.add_on_name.localeCompare(b.add_on_name);
          } else {
            return b.add_on_name.localeCompare(a.add_on_name);
          }
        });
        
        setAddOns(updatedAddOns);
        setSuccessMessage("Add-on updated successfully!");
        setShowSuccessModal(true);
      } else {
        await fetchAllData();
      }
      
      setShowEditModal(false);
      setEditingAddOn(null);
    } catch (err: any) {
      console.error("update error", err);
      setErrorMessage(err.message || "Failed to update add-on");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAddOn = (addOn: any) => {
    setViewingAddOn(addOn);
    setShowViewModal(true);
  };

  const showDeleteConfirmation = (addOn: any) => {
    setDeletingAddOn(addOn);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddOn) return;
    
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("add_ons")
        .delete()
        .eq("add_on_id", deletingAddOn.id);
      
      if (deleteError) throw deleteError;
      
      setAddOns((prev) => prev.filter((a) => a.id !== deletingAddOn.id));
      setSuccessMessage(`Add-on "${deletingAddOn.add_on_name}" deleted successfully!`);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("delete error", err);
      setErrorMessage("Failed to delete add-on");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingAddOn(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingAddOn(null);
  };

  const handleToggleActive = async (id: number) => {
    try {
      setLoading(true);
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
        setAddOns((prev) => prev.map((a) => a.id === id ? { 
          ...a, 
          is_active: data[0].is_active,
          updated_at: data[0].updated_at ? formatDate(data[0].updated_at) : 'Just now',
        } : a));
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
    
    const sortedAddOns = [...addOns].sort((a, b) => {
      if (newSortOrder === "A-Z") {
        return a.add_on_name.localeCompare(b.add_on_name);
      } else {
        return b.add_on_name.localeCompare(a.add_on_name);
      }
    });
    
    setAddOns(sortedAddOns);
  };

  // FIXED SEARCH FUNCTION - Search only by add-on name
  const filteredAddOns = addOns.filter((a) => {
    // Handle category filter
    const matchesCategory = !filterCategoryId || a.category_id === filterCategoryId;
    
    // Handle status filter
    const matchesStatus = statusFilter === "All Status" || 
      (statusFilter === "Active" ? a.is_active : !a.is_active);
    
    // If no search text, return based on category and status only
    if (!searchText || searchText.trim() === '') {
      return matchesCategory && matchesStatus;
    }
    
    // Prepare search text
    const searchTerm = searchText.toLowerCase().trim();
    
    // Search only by add-on name
    const addOnName = String(a.add_on_name || '').toLowerCase();
    
    // Check if add-on name contains the search term
    const matchesSearch = addOnName.includes(searchTerm);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedCategory = categories.find(c => c.id === filterCategoryId);
  const selectedAddCategory = categories.find(c => c.id === addCategoryId);

  // Get active categories for dropdowns
  const activeCategories = categories.filter(c => c.is_active);

  // Check if add form is valid
  const priceValidation = validatePrice(addDefaultPrice);
  const isAddFormValid = addCategoryId && addAddOnName.trim() && priceValidation.isValid && !duplicateError && !isCheckingDuplicate;

  // Check if edit form has changes and is valid - FIXED LOGIC
  const hasEditChanges = editingAddOn ? 
    (editDescription.trim() !== editingAddOn.description ||
     editPriceType !== editingAddOn.price_type ||
     parseFloat(editDefaultPrice) !== editingAddOn.default_price ||
     editIsActive !== editingAddOn.is_active) : false;
  
  // For edit form, we don't validate add-on name since it's read-only
  const editPriceValidation = validatePrice(editDefaultPrice);
  const isEditFormValid = editPriceValidation.isValid && hasEditChanges;

  if (loading && addOns.length === 0) {
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
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage add-ons and categories</Text>
            </View>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={() => {
                resetAddModal();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Add-on</Text>
            </TouchableOpacity>
          </View>

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
                    {activeCategories.map((cat) => (
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
              <View style={[styles.columnHeaderWrapper, { flex: 1.3 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Add-on Name</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Category</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1.5 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Description</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Price Type</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Price</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Status</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Actions</Text>
              </View>
            </View>

            {filteredAddOns.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No add-ons found
                </Text>
              </View>
            ) : (
              filteredAddOns.map((a) => (
                <View 
                  key={a.id} 
                  style={[styles.tableRow, { borderColor: theme.border }]}
                >
                  <View style={[styles.cellWrapper, { flex: 1.3, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>
                      {a.add_on_name}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 1, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]}>
                      {a.category_name}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 1.5, justifyContent: "center" }]}>
                    <Text 
                      style={[styles.cellText, { color: theme.textSecondary }]} 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                    >
                      {a.description || "No description"}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary, textTransform: 'capitalize' }]}>
                      {a.price_type.replace('_', ' ')}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center" }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]}>
                      ₱{a.default_price.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={[styles.cellWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <Switch 
                      value={!!a.is_active} 
                      onValueChange={() => handleToggleActive(a.id)} 
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={a.is_active ? Palette.white : Palette.black}
                      ios_backgroundColor={theme.textSecondary}
                    />
                  </View>
                  
                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "flex-end", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleViewAddOn(a)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleEditAddOn(a)}
                      >
                        <Ionicons name="pencil" size={18} color={Palette.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => showDeleteConfirmation(a)}
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Add-on</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create a new add-on
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
                          {activeCategories.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setAddCategoryId(cat.id);
                                setAddCategoryDropdownOpen(false);
                                // Clear any existing duplicate error when category changes
                                setDuplicateError(null);
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

                {/* Add-on Name */}
                <View style={[styles.formGroup, { marginTop: addCategoryDropdownOpen ? 150 : 0 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Add-on Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: addValidationError && !addAddOnName.trim() ? Palette.red : 
                                  duplicateError ? Palette.red : 
                                  theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Add-on Name"
                    placeholderTextColor={theme.textSecondary}
                    value={addAddOnName}
                    onChangeText={handleAddOnNameChange}
                    onBlur={handleAddOnNameBlur}
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
                  {addValidationError && !addAddOnName.trim() && (
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
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      styles.formTextarea, 
                      { 
                        color: theme.text, 
                        borderColor: addValidationError && validateDescription(addDescription) ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Add-on Description"
                    placeholderTextColor={theme.textSecondary}
                    value={addDescription}
                    onChangeText={handleDescriptionChange}
                    onBlur={() => {
                      if (addDescription.trim()) {
                        setAddDescription(formatDescription(addDescription));
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {addValidationError && validateDescription(addDescription) && (
                    <Text style={styles.errorText}>{addValidationError}</Text>
                  )}
                </View>

                {/* Price Type */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Price Type
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={styles.priceTypeContainer}>
                    <TouchableOpacity 
                      onPress={() => setAddPriceType("fixed")}
                      style={[
                        styles.priceTypeButton,
                        { 
                          backgroundColor: addPriceType === "fixed" ? Palette.primary : theme.lightBg,
                          borderColor: addPriceType === "fixed" ? Palette.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[
                        styles.priceTypeButtonText,
                        { color: addPriceType === "fixed" ? Palette.black : theme.text }
                      ]}>
                        Fixed
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setAddPriceType("per_pax")}
                      style={[
                        styles.priceTypeButton,
                        { 
                          backgroundColor: addPriceType === "per_pax" ? Palette.primary : theme.lightBg,
                          borderColor: addPriceType === "per_pax" ? Palette.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[
                        styles.priceTypeButtonText,
                        { color: addPriceType === "per_pax" ? Palette.black : theme.text }
                      ]}>
                        Per Pax
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Default Price */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Default Price
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.priceInputContainer, 
                    { 
                      borderColor: addValidationError && !validatePrice(addDefaultPrice).isValid ? Palette.red : theme.border,
                      backgroundColor: theme.lightBg
                    }
                  ]}>
                    <Text style={[styles.currencySymbol, { color: theme.text }]}>₱</Text>
                    <TextInput
                      style={[styles.priceInput, { color: theme.text }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={addDefaultPrice}
                      onChangeText={(text) => handlePriceChange(text, false)}
                      maxLength={10}
                    />
                  </View>
                  {addValidationError && !validatePrice(addDefaultPrice).isValid && (
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
                    Inactive add-ons won't be available for selection
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
                onPress={handleAddAddOn}
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
                      Create Add-on
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
          setEditingAddOn(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEditModal(false);
              setEditingAddOn(null);
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Add-on</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {editingAddOn ? `Editing: ${editingAddOn.add_on_name}` : "Update add-on details"}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeIconButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingAddOn(null);
                }}
              >
                <Ionicons name="close" size={20} color={theme.text} />
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
                      {editingAddOn?.category_name}
                    </Text>
                  </View>
                </View>

                {/* Add-on Name (Read-only) */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Add-on Name
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {editingAddOn?.add_on_name}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Description
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput, 
                      styles.formTextarea, 
                      { 
                        color: theme.text, 
                        borderColor: editValidationError && validateDescription(editDescription) ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Add-on Description (Optional) e.g. 100 chairs"
                    placeholderTextColor={theme.textSecondary}
                    value={editDescription}
                    onChangeText={(text) => {
                      // MODIFIED: Allow numbers in description
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
                  {editValidationError && validateDescription(editDescription) && (
                    <Text style={styles.errorText}>{editValidationError}</Text>
                  )}
                </View>

                {/* Price Type */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Price Type
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={styles.priceTypeContainer}>
                    <TouchableOpacity 
                      onPress={() => setEditPriceType("fixed")}
                      style={[
                        styles.priceTypeButton,
                        { 
                          backgroundColor: editPriceType === "fixed" ? Palette.primary : theme.lightBg,
                          borderColor: editPriceType === "fixed" ? Palette.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[
                        styles.priceTypeButtonText,
                        { color: editPriceType === "fixed" ? Palette.black : theme.text }
                      ]}>
                        Fixed
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setEditPriceType("per_pax")}
                      style={[
                        styles.priceTypeButton,
                        { 
                          backgroundColor: editPriceType === "per_pax" ? Palette.primary : theme.lightBg,
                          borderColor: editPriceType === "per_pax" ? Palette.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[
                        styles.priceTypeButtonText,
                        { color: editPriceType === "per_pax" ? Palette.black : theme.text }
                      ]}>
                        Per Pax
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Default Price */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Default Price
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.priceInputContainer, 
                    { 
                      borderColor: editValidationError && !validatePrice(editDefaultPrice).isValid ? Palette.red : theme.border,
                      backgroundColor: theme.lightBg
                    }
                  ]}>
                    <Text style={[styles.currencySymbol, { color: theme.text }]}>₱</Text>
                    <TextInput
                      style={[styles.priceInput, { color: theme.text }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={editDefaultPrice}
                      onChangeText={(text) => handlePriceChange(text, true)}
                      maxLength={10}
                    />
                  </View>
                  {editValidationError && !validatePrice(editDefaultPrice).isValid && (
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
                  setEditingAddOn(null);
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
            <View style={styles.viewModalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add-on Details
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeIconButton}
                onPress={() => setShowViewModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
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
                    Add-on Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.add_on_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.category_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.description || "No description"}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Price Type
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.price_type?.replace('_', ' ') || "Fixed"}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Default Price
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    ₱{viewingAddOn?.default_price?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: viewingAddOn?.is_active 
                        ? Palette.green + "20" 
                        : Palette.red + "20" 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: viewingAddOn?.is_active ? Palette.green : Palette.red }
                    ]}>
                      {viewingAddOn?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Created At
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.created_at}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingAddOn?.updated_at || 'Never'}
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
                Delete Add-on
              </Text>
            </View>
            <View style={styles.alertBody}>
              <Ionicons name="alert-circle" size={48} color={Palette.red} />
              <Text style={[styles.alertMessage, { color: theme.text }]}>
                Are you sure you want to delete "{deletingAddOn?.add_on_name}"?
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
    justifyContent: "flex-end",
    width: "100%",
    paddingRight: 8,
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
  priceTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  priceTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium'
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    fontFamily: 'Poppins-Medium'
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins-Regular'
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
  viewModalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "rgba(0, 0, 0, 0.1)" 
  },
  closeIconButton: {
    padding: 4,
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