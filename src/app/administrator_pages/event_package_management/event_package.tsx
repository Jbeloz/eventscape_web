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

export default function EventPackages() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [packages, setPackages] = useState<any[]>([]);
  const [packageTypes, setPackageTypes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [selectedServiceCategoryId, setSelectedServiceCategoryId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");

  // add/edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Form states
  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formExcessPaxPrice, setFormExcessPaxPrice] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [formPaxPrices, setFormPaxPrices] = useState<Array<{ pax_count: number; price: string }>>([]);
  const [formServiceIds, setFormServiceIds] = useState<number[]>([]);

  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [viewingPkg, setViewingPkg] = useState<any | null>(null);

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Validation states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only active package types
      const [typesRes, servicesRes, categoriesRes] = await Promise.all([
        supabase.from("package_types").select("*").eq("is_active", true).order("type_name", { ascending: true }),
        supabase.from("services").select("*").eq("is_active", true).order("service_name", { ascending: true }),
        supabase.from("service_categories").select("*").order("category_name", { ascending: true }),
      ]);
      
      if (typesRes.error) throw typesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      
      setPackageTypes((typesRes.data || []).map((t: any) => ({ 
        id: t.package_type_id, 
        name: t.type_name,
        description: t.description 
      })));
      
      const svcList = (servicesRes.data || []).map((s: any) => ({ 
        id: s.service_id, 
        name: s.service_name, 
        category_id: s.category_id,
        description: s.description 
      }));
      
      setServices(svcList);
      
      // Filter categories that have active services
      const categories = (categoriesRes.data || [])
        .filter((c: any) => svcList.some((s: any) => s.category_id === c.category_id))
        .map((c: any) => ({ 
          id: c.category_id, 
          name: c.category_name 
        }));
      
      setServiceCategories(categories);

      await fetchPackages();
    } catch (err: any) {
      console.error("fetchAllData error", err);
      showError("Failed to load data");
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Main package query with type join
      const { data: packagesData, error: pkgError } = await supabase
        .from("event_packages")
        .select(`
          *,
          package_types:package_type_id (type_name, description)
        `)
        .order("created_at", { ascending: false });
      
      if (pkgError) throw pkgError;

      const pkgIds = (packagesData || []).map((p: any) => p.package_id);

      // Fetch related data in parallel
      const [{ data: paxData, error: paxError }, { data: svcAssocData, error: svcAssocError }] = await Promise.all([
        supabase.from("package_pax_prices").select("*").in("package_id", pkgIds).order("pax_count", { ascending: true }),
        supabase.from("package_services").select("*").in("package_id", pkgIds),
      ]);

      if (paxError) throw paxError;
      if (svcAssocError) throw svcAssocError;

      // Get services for the associated service IDs
      const svcIds = (svcAssocData || []).map((ps: any) => ps.service_id);
      const { data: svcData, error: svcError } = await supabase
        .from("services")
        .select("*")
        .in("service_id", svcIds)
        .eq("is_active", true);
      
      if (svcError) throw svcError;

      // Organize data by package
      const paxByPackage: Record<number, any[]> = {};
      (paxData || []).forEach((pp: any) => {
        paxByPackage[pp.package_id] = paxByPackage[pp.package_id] || [];
        paxByPackage[pp.package_id].push({ 
          pax_count: pp.pax_count, 
          price: pp.price 
        });
      });

      const svcByPackage: Record<number, any[]> = {};
      (svcAssocData || []).forEach((ps: any) => {
        svcByPackage[ps.package_id] = svcByPackage[ps.package_id] || [];
        const svc = svcData?.find((s: any) => s.service_id === ps.service_id);
        if (svc) {
          svcByPackage[ps.package_id].push({
            service_id: svc.service_id,
            name: svc.service_name,
            category_id: svc.category_id,
            description: svc.description
          });
        }
      });

      // Map final package data
      const mapped = (packagesData || []).map((p: any) => ({
        id: p.package_id,
        package_type_id: p.package_type_id,
        package_type_name: p.package_types?.type_name || "Unknown",
        package_name: p.package_name,
        description: p.description,
        excess_pax_price: p.excess_pax_price,
        is_active: p.is_active,
        pax_prices: paxByPackage[p.package_id] || [],
        services: svcByPackage[p.package_id] || [],
        created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : null,
        updated_at: p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : null,
      }));

      setPackages(mapped);
    } catch (err: any) {
      console.error("fetchPackages error", err);
      showError("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  // Check if package name already exists in the same package type
  const checkDuplicatePackageName = async (packageName: string, packageTypeId: number): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const formattedName = formatName(packageName);
      
      const { data, error: checkError } = await supabase
        .from("event_packages")
        .select("package_name")
        .ilike("package_name", formattedName)
        .eq("package_type_id", packageTypeId)
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

  const resetForm = () => {
    setFormTypeId(null);
    setFormName("");
    setFormDescription("");
    setFormExcessPaxPrice("");
    setFormIsActive(true);
    setFormPaxPrices([]);
    setFormServiceIds([]);
    setValidationError(null);
    setDuplicateError(null);
  };

  const openAdd = () => {
    resetForm();
    setEditingPkg(null);
    setSelectedServiceCategoryId(serviceCategories[0]?.id ?? null);
    setFormPaxPrices([{ pax_count: 0, price: "" }]);
    setShowAddModal(true);
  };

  const openEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setFormTypeId(pkg.package_type_id);
    setFormName(pkg.package_name);
    setFormDescription(pkg.description);
    setFormExcessPaxPrice(String(pkg.excess_pax_price ?? ""));
    setFormIsActive(!!pkg.is_active);
    setFormPaxPrices((pkg.pax_prices || []).map((pp: any) => ({ 
      pax_count: pp.pax_count, 
      price: String(pp.price) 
    })));
    setFormServiceIds((pkg.services || []).map((s: any) => s.service_id));
    setSelectedServiceCategoryId(serviceCategories[0]?.id || null);
    setValidationError(null);
    setDuplicateError(null);
    setShowEditModal(true);
  };

  const openView = (pkg: any) => {
    setViewingPkg(pkg);
    setShowViewModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showError = (message: string) => {
    setError(message);
    setShowErrorModal(true);
  };

  const formatName = (text: string) => {
    // Remove numbers and special characters, capitalize first letter of each word
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
    return cleaned
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle package name change with duplicate checking - ONLY checks within selected package type
  const handlePackageNameChange = async (text: string) => {
    const formatted = formatName(text);
    setFormName(formatted);
    setValidationError(null);
    
    // Clear duplicate error when user starts typing
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    // Check for duplicates after a short delay (if we have a package type selected)
    if (formatted.trim().length >= 2 && formTypeId) {
      // Check if this name already exists in the SAME package type in current list (for add modal)
      if (showAddModal) {
        const existing = packages.find(p => 
          p.package_name.toLowerCase() === formatted.toLowerCase() &&
          p.package_type_id === formTypeId  // Only check within same package type
        );
        
        if (existing) {
          setDuplicateError(`Package "${formatted}" already exists in this package type.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle package name blur - final validation
  const handlePackageNameBlur = async () => {
    if (formName.trim() && formTypeId) {
      const formattedName = formatName(formName);
      setFormName(formattedName);
      
      // Final duplicate check for add modal only - ONLY within same package type
      if (showAddModal && formattedName && formTypeId) {
        const isDuplicate = await checkDuplicatePackageName(formattedName, formTypeId);
        if (isDuplicate) {
          setDuplicateError(`Package "${formattedName}" already exists in this package type. Please use a different name.`);
        }
      }
    }
  };

  // When package type changes, re-check for duplicates in that type
  const handlePackageTypeChange = async (typeId: number) => {
    setFormTypeId(typeId);
    setShowTypeDropdown(false);
    
    // Clear any existing duplicate error when package type changes
    setDuplicateError(null);
    
    // If we have a package name, check for duplicates in the new package type
    if (formName.trim() && showAddModal) {
      const formattedName = formatName(formName);
      if (formattedName) {
        const existing = packages.find(p => 
          p.package_name.toLowerCase() === formattedName.toLowerCase() &&
          p.package_type_id === typeId
        );
        
        if (existing) {
          setDuplicateError(`Package "${formattedName}" already exists in this package type.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  const validateForm = () => {
    setValidationError(null);
    setDuplicateError(null);

    if (!formTypeId) {
      setValidationError("Package type is required.");
      return false;
    }
    
    if (!formName.trim()) {
      setValidationError("Package name is required.");
      return false;
    }

    if (formName.trim().length > 150) {
      setValidationError("Package name must be 150 characters or less.");
      return false;
    }
    
    if (!formDescription.trim()) {
      setValidationError("Description is required.");
      return false;
    }
    
    const excess = parseFloat(formExcessPaxPrice);
    if (isNaN(excess) || formExcessPaxPrice === "") {
      setValidationError("Excess pax price must be a valid number.");
      return false;
    }

    if (excess < 0) {
      setValidationError("Excess pax price must be >= 0.");
      return false;
    }

    if (formExcessPaxPrice.startsWith('0') && formExcessPaxPrice.length > 1) {
      setValidationError("Excess pax price cannot start with 0.");
      return false;
    }
    
    if (!formPaxPrices.length) {
      setValidationError("At least one pax tier is required.");
      return false;
    }
    
    // Check for duplicate pax counts
    const paxCounts = formPaxPrices.map(pp => pp.pax_count);
    const uniquePaxCounts = [...new Set(paxCounts)];
    if (uniquePaxCounts.length !== paxCounts.length) {
      setValidationError("Duplicate pax counts are not allowed.");
      return false;
    }
    
    for (const pp of formPaxPrices) {
      if (!Number.isInteger(pp.pax_count) || pp.pax_count < 0) {
        setValidationError("Pax count must be a whole number >= 0.");
        return false;
      }

      if (String(pp.pax_count).startsWith('0') && String(pp.pax_count).length > 1) {
        setValidationError("Pax count cannot start with 0.");
        return false;
      }
      
      if (isNaN(parseFloat(pp.price)) || pp.price === "") {
        setValidationError("Pax price must be a valid number.");
        return false;
      }

      if (parseFloat(pp.price) < 0) {
        setValidationError("Pax price must be >= 0.");
        return false;
      }

      if (pp.price.startsWith('0') && pp.price.length > 1) {
        setValidationError("Pax price cannot start with 0.");
        return false;
      }
    }
    
    if (formServiceIds.length < 1) {
      setValidationError("At least one service must be selected.");
      return false;
    }
    
    return true;
  };

  const hasFormChanges = () => {
    if (!editingPkg) return false;
    
    // Check if any field has changed
    if (formTypeId !== editingPkg.package_type_id) return true;
    if (formName !== editingPkg.package_name) return true;
    if (formDescription !== editingPkg.description) return true;
    if (parseFloat(formExcessPaxPrice) !== editingPkg.excess_pax_price) return true;
    if (formIsActive !== editingPkg.is_active) return true;
    
    // Check pax prices changes
    const currentPaxPrices = editingPkg.pax_prices || [];
    if (formPaxPrices.length !== currentPaxPrices.length) return true;
    
    for (let i = 0; i < formPaxPrices.length; i++) {
      const newPax = formPaxPrices[i];
      const oldPax = currentPaxPrices[i];
      if (!oldPax) return true;
      if (newPax.pax_count !== oldPax.pax_count || parseFloat(newPax.price) !== oldPax.price) {
        return true;
      }
    }
    
    // Check services changes
    const currentServiceIds = (editingPkg.services || []).map((s: any) => s.service_id);
    if (formServiceIds.length !== currentServiceIds.length) return true;
    
    const sortedCurrent = [...currentServiceIds].sort();
    const sortedNew = [...formServiceIds].sort();
    for (let i = 0; i < sortedCurrent.length; i++) {
      if (sortedCurrent[i] !== sortedNew[i]) return true;
    }
    
    return false;
  };

  const isFormValid = () => {
    // Basic field checks
    if (!formTypeId || !formName.trim() || !formDescription.trim() || 
        formServiceIds.length < 1) {
      return false;
    }
    
    // Excess price check
    const excess = parseFloat(formExcessPaxPrice);
    if (isNaN(excess) || excess < 0 || (formExcessPaxPrice.startsWith('0') && formExcessPaxPrice.length > 1) || formExcessPaxPrice === "") {
      return false;
    }
    
    // Pax prices check
    if (formPaxPrices.length === 0) {
      return false;
    }
    
    // Check for duplicate pax counts
    const paxCounts = formPaxPrices.map(pp => pp.pax_count);
    const uniquePaxCounts = [...new Set(paxCounts)];
    if (uniquePaxCounts.length !== paxCounts.length) {
      return false;
    }
    
    // Check each pax price entry
    for (const pp of formPaxPrices) {
      const paxCountStr = String(pp.pax_count);
      const priceStr = pp.price;
      
      if (!Number.isInteger(pp.pax_count) || pp.pax_count < 0 ||
          (paxCountStr.startsWith('0') && paxCountStr.length > 1) ||
          isNaN(parseFloat(priceStr)) || parseFloat(priceStr) < 0 ||
          (priceStr.startsWith('0') && priceStr.length > 1) ||
          paxCountStr === "" || priceStr === "") {
        return false;
      }
    }
    
    // Check for any validation or duplicate errors
    if (validationError || duplicateError) {
      return false;
    }
    
    return true;
  };

  const handleAdd = async () => {
    // Clear previous errors
    setValidationError(null);
    setDuplicateError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check for duplicates before inserting - ONLY within same package type
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicatePackageName(formName, formTypeId!);
      
      if (isDuplicate) {
        setDuplicateError(`Package "${formName}" already exists in this package type. Please use a different name.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      showError("Failed to validate package name. Please try again.");
      setIsCheckingDuplicate(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Insert package
      const { data: packageData, error: insertError } = await supabase
        .from("event_packages")
        .insert([
          {
            package_type_id: formTypeId,
            package_name: formName.trim(),
            description: formDescription.trim(),
            excess_pax_price: parseFloat(formExcessPaxPrice),
            is_active: formIsActive,
          },
        ])
        .select()
        .single();
      
      if (insertError) {
        // Check for duplicate key constraint error
        if (insertError.code === '23505' || insertError.message.includes('unique constraint') || insertError.message.includes('duplicate key')) {
          setDuplicateError(`Package "${formName}" already exists in this package type. Please use a different name.`);
          return;
        }
        throw insertError;
      }
      
      const pkgId = packageData.package_id;

      // Insert pax price tiers
      if (formPaxPrices.length) {
        const toInsertPax = formPaxPrices.map((pp) => ({ 
          package_id: pkgId, 
          pax_count: pp.pax_count, 
          price: parseFloat(pp.price)
        }));
        const { error: paxError } = await supabase.from("package_pax_prices").insert(toInsertPax);
        if (paxError) throw paxError;
      }
      
      // Insert package services
      if (formServiceIds.length) {
        const toInsert = formServiceIds.map((sid) => ({ 
          package_id: pkgId, 
          service_id: sid 
        }));
        const { error: psError } = await supabase.from("package_services").insert(toInsert);
        if (psError) throw psError;
      }

      await fetchPackages();
      setShowAddModal(false);
      resetForm();
      showSuccess("Package created successfully!");
    } catch (err: any) {
      console.error("add package error", err);
      
      // Handle specific error cases
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Package "${formName}" already exists in this package type. Please use a different name.`);
      } else {
        showError(err.message || "Failed to add package");
      }
    } finally {
      setLoading(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPkg) return;
    
    // Clear previous errors
    setValidationError(null);
    setDuplicateError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Update package
      const { data, error: updateError } = await supabase
        .from("event_packages")
        .update({
          package_name: formName.trim(),
          description: formDescription.trim(),
          excess_pax_price: parseFloat(formExcessPaxPrice),
          is_active: formIsActive,
        })
        .eq("package_id", editingPkg.id)
        .select()
        .single();
      
      if (updateError) {
        // Check for duplicate key constraint error
        if (updateError.code === '23505' || updateError.message.includes('unique constraint') || updateError.message.includes('duplicate key')) {
          setDuplicateError(`Package "${formName}" already exists in this package type. Please use a different name.`);
          return;
        }
        throw updateError;
      }

      // Replace pax prices
      const { error: delPaxError } = await supabase
        .from("package_pax_prices")
        .delete()
        .eq("package_id", editingPkg.id);
      
      if (delPaxError) throw delPaxError;
      
      if (formPaxPrices.length) {
        const toInsertPax = formPaxPrices.map((pp) => ({ 
          package_id: editingPkg.id, 
          pax_count: pp.pax_count, 
          price: parseFloat(pp.price) 
        }));
        const { error: paxError } = await supabase.from("package_pax_prices").insert(toInsertPax);
        if (paxError) throw paxError;
      }

      // Replace package services
      const { error: delPsError } = await supabase
        .from("package_services")
        .delete()
        .eq("package_id", editingPkg.id);
      
      if (delPsError) throw delPsError;
      
      if (formServiceIds.length) {
        const toInsert = formServiceIds.map((sid) => ({ 
          package_id: editingPkg.id, 
          service_id: sid 
        }));
        const { error: psError } = await supabase.from("package_services").insert(toInsert);
        if (psError) throw psError;
      }

      await fetchPackages();
      setShowEditModal(false);
      setEditingPkg(null);
      resetForm();
      showSuccess("Package updated successfully!");
    } catch (err: any) {
      console.error("update package error", err);
      
      // Handle specific error cases
      if (err.code === '23505' || err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
        setDuplicateError(`Package "${formName}" already exists in this package type. Please use a different name.`);
      } else {
        showError(err.message || "Failed to update package");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      setLoading(true);
      const target = packages.find((p) => p.id === id);
      if (!target) return;
      
      const newStatus = !target.is_active;
      const { error: toggleError } = await supabase
        .from("event_packages")
        .update({ is_active: newStatus })
        .eq("package_id", id);
      
      if (toggleError) throw toggleError;
      
      // Update local state
      setPackages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: newStatus } : p
        )
      );
      // No popup for status toggle
    } catch (err: any) {
      console.error("toggle package error", err);
      showError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const addPaxPriceRow = () => {
    setFormPaxPrices((prev) => [...prev, { pax_count: 0, price: "" }]);
  };
  
  const removePaxPriceRow = (index: number) => {
    if (formPaxPrices.length <= 1) {
      setValidationError("At least one pax tier is required");
      return;
    }
    setFormPaxPrices((prev) => prev.filter((_, i) => i !== index));
  };
  
  const updatePaxRow = (index: number, field: "pax_count" | "price", value: any) => {
    setFormPaxPrices((prev) => 
      prev.map((r, i) => 
        i === index ? { 
          ...r, 
          [field]: field === "pax_count" ? parseInt(value || 0, 10) : value 
        } : r
      )
    );
    
    // Clear validation error when user edits pax values
    if (validationError && validationError.includes("Duplicate pax counts")) {
      setValidationError(null);
    }
  };

  const toggleServiceSelection = (id: number) => {
    setFormServiceIds((prev) => 
      prev.includes(id) 
        ? prev.filter((x) => x !== id) 
        : [...prev, id]
    );
  };

  const getFilteredPackages = () => {
    let filtered = packages.filter((p) =>
      p.package_name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.description.toLowerCase().includes(searchText.toLowerCase()) ||
      p.package_type_name.toLowerCase().includes(searchText.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "A-Z") {
        return a.package_name.localeCompare(b.package_name);
      } else {
        return b.package_name.localeCompare(a.package_name);
      }
    });

    return filtered;
  };

  const filteredPackages = getFilteredPackages();
  const selectedPackageType = packageTypes.find(pt => pt.id === formTypeId);

  if (loading && packages.length === 0) {
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
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading packages...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Event Packages</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Manage packages, pax prices and services
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={openAdd}
            >
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Package</Text>
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
                  placeholder="Search packages..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              
              {/* Sort Order */}
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  { borderColor: theme.border, backgroundColor: theme.card }
                ]}
                onPress={() => setSortOrder(sortOrder === "A-Z" ? "Z-A" : "A-Z")}
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
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.5 }]}>
                Package Name
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>
                Type
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>
                Services
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>
                Pax Tiers & Prices
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>
                Status
              </Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>
                Actions
              </Text>
            </View>

            {filteredPackages.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No packages found
                </Text>
              </View>
            ) : (
              filteredPackages.map((p) => (
                <View 
                  key={p.id} 
                  style={[styles.tableRow, { borderColor: theme.border }]}
                >
                  <View style={{ flex: 1.5, justifyContent: "center" }}>
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]}>
                      {p.package_name}
                    </Text>
                    <Text style={[styles.cellDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                      {p.description}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]}>
                      {p.package_type_name}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text 
                      style={[styles.cellText, { color: theme.textSecondary }]} 
                      numberOfLines={2} 
                      ellipsizeMode="tail"
                    >
                      {p.services.map((s: any) => s.name).join(", ") || "No services"}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    {p.pax_prices.map((pp: any, idx: number) => (
                      <Text key={idx} style={[styles.cellDescription, { color: theme.textSecondary }]}>
                        {pp.pax_count} pax: ₱{pp.price}
                      </Text>
                    ))}
                    <Text style={[styles.cellDescription, { color: theme.textSecondary }]}>
                      Excess: ₱{p.excess_pax_price} per pax
                    </Text>
                  </View>
                  
                  <View style={{ flex: 0.8, justifyContent: "center", alignItems: "center" }}>
                    <Switch 
                      value={!!p.is_active} 
                      onValueChange={() => handleToggle(p.id)} 
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={p.is_active ? Palette.white : Palette.black}
                      ios_backgroundColor={theme.textSecondary}
                    />
                  </View>
                  
                  <View style={[styles.actionsColumn, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => openView(p)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => openEdit(p)}
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
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowTypeDropdown(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowAddModal(false);
              setShowTypeDropdown(false);
            }}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.card,
              maxHeight: "85%",
              width: "95%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add Event Package
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create new package and define pax prices & services
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setShowTypeDropdown(false);
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
                {/* Package Type - Custom Dropdown */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Package Type
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={{ position: 'relative', zIndex: 1000 }}>
                    <TouchableOpacity
                      style={[
                        styles.customDropdown,
                        { 
                          backgroundColor: theme.card, 
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => {
                        setShowTypeDropdown(!showTypeDropdown);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText, 
                        { color: selectedPackageType ? theme.text : theme.textSecondary }
                      ]}>
                        {selectedPackageType ? selectedPackageType.name : "Pick Event Type"}
                      </Text>
                      <Ionicons 
                        name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={theme.textSecondary} 
                      />
                    </TouchableOpacity>
                    
                    {showTypeDropdown && (
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
                          {packageTypes.map((pt) => (
                            <TouchableOpacity
                              key={pt.id}
                              style={styles.dropdownOption}
                              onPress={() => handlePackageTypeChange(pt.id)}
                            >
                              <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                                {pt.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Package Name */}
                <View style={[styles.formGroup, { marginTop: showTypeDropdown ? 150 : 0 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Package Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: duplicateError ? Palette.red : theme.border
                      }
                    ]}
                    placeholder="Enter Package Name"
                    placeholderTextColor={theme.textSecondary}
                    value={formName}
                    onChangeText={handlePackageNameChange}
                    onBlur={handlePackageNameBlur}
                    maxLength={150}
                    autoCapitalize="words"
                  />
                  {isCheckingDuplicate && (
                    <View style={styles.checkingContainer}>
                      <ActivityIndicator size="small" color={Palette.blue} />
                      <Text style={[styles.checkingText, { color: theme.textSecondary }]}>
                        Checking availability...
                      </Text>
                    </View>
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
                        borderColor: theme.border
                      }
                    ]}
                    placeholder="Enter Package Description"
                    placeholderTextColor={theme.textSecondary}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Excess Pax Price */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Excess Pax Price (per pax)
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.formInputWithPrefix,
                    { borderColor: theme.border }
                  ]}>
                    <Text style={{ color: theme.text, marginRight: 8 }}>₱</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        color: theme.text, 
                        borderWidth: 0,
                        flex: 1 
                      }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={formExcessPaxPrice}
                      onChangeText={(text) => {
                        // Allow only numbers
                        const cleaned = text.replace(/[^0-9]/g, '');
                        // Remove leading zeros
                        const withoutLeadingZeros = cleaned.replace(/^0+/, '');
                        setFormExcessPaxPrice(withoutLeadingZeros || "");
                      }}
                    />
                  </View>
                </View>

                {/* Pax Prices */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Pax Pricing Tiers
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={styles.paxTableHeader}>
                    <View style={[styles.paxHeaderCell, { flex: 1 }]}>
                      <Text style={[styles.paxHeaderText, { color: theme.text }]}>
                        Pax Count
                      </Text>
                    </View>
                    <View style={[styles.paxHeaderCell, { flex: 1 }]}>
                      <Text style={[styles.paxHeaderText, { color: theme.text }]}>
                        Price (₱)
                      </Text>
                    </View>
                    <View style={[styles.paxHeaderCell, { flex: 0.3 }]} />
                  </View>
                  
                  {formPaxPrices.map((pp, idx) => (
                    <View key={idx} style={styles.paxRow}>
                      <View style={[styles.paxInputContainer, { flex: 1 }]}>
                        <TextInput
                          style={[
                            styles.paxInput,
                            { 
                              color: theme.text, 
                              borderColor: theme.border,
                              height: 45
                            }
                          ]}
                          keyboardType="numeric"
                          value={String(pp.pax_count)}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary}
                          onChangeText={(v) => {
                            const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(num) && num >= 0) {
                              // Remove leading zeros
                              const withoutLeadingZeros = v.replace(/^0+/, '');
                              updatePaxRow(idx, 'pax_count', withoutLeadingZeros || "");
                            } else {
                              updatePaxRow(idx, 'pax_count', "");
                            }
                          }}
                        />
                      </View>
                      <View style={[styles.paxInputContainer, { flex: 1 }]}>
                        <View style={[styles.paxInputWithPrefix, { borderColor: theme.border, height: 45 }]}>
                          <Text style={{ color: theme.text, marginRight: 4 }}>₱</Text>
                          <TextInput
                            style={[styles.paxInput, { 
                              color: theme.text, 
                              borderWidth: 0,
                              flex: 1 
                            }]}
                            keyboardType="numeric"
                            value={pp.price}
                            placeholder="0"
                            placeholderTextColor={theme.textSecondary}
                            onChangeText={(v) => {
                              const cleaned = v.replace(/[^0-9]/g, '');
                              // Remove leading zeros
                              const withoutLeadingZeros = cleaned.replace(/^0+/, '');
                              updatePaxRow(idx, 'price', withoutLeadingZeros || "");
                            }}
                          />
                        </View>
                      </View>
                      <View style={[styles.paxActionContainer, { flex: 0.3 }]}>
                        <TouchableOpacity 
                          onPress={() => removePaxPriceRow(idx)}
                          style={styles.deletePaxButton}
                          disabled={formPaxPrices.length <= 1}
                        >
                          <Ionicons 
                            name="trash" 
                            size={18} 
                            color={formPaxPrices.length <= 1 ? theme.textSecondary : Palette.red} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  <TouchableOpacity 
                    onPress={addPaxPriceRow}
                    style={styles.addPaxButton}
                  >
                    <Ionicons name="add-circle" size={18} color={Palette.primary} />
                    <Text style={{ color: Palette.primary, marginLeft: 4 }}>
                      Add Pax Tier
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Services */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Services
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  
                  {/* Category Filter */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedServiceCategoryId(null)}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: selectedServiceCategoryId === null 
                            ? Palette.primary 
                            : 'transparent',
                          borderColor: selectedServiceCategoryId === null 
                            ? Palette.primary 
                            : theme.border
                        }
                      ]}
                    >
                      <Text style={{
                        color: selectedServiceCategoryId === null 
                          ? Palette.black 
                          : theme.text
                      }}>
                        All Services
                      </Text>
                    </TouchableOpacity>
                    {serviceCategories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedServiceCategoryId(c.id)}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor: selectedServiceCategoryId === c.id 
                              ? Palette.primary 
                            : 'transparent',
                            borderColor: selectedServiceCategoryId === c.id 
                              ? Palette.primary 
                              : theme.border
                          }
                        ]}
                      >
                        <Text style={{
                          color: selectedServiceCategoryId === c.id 
                            ? Palette.black 
                            : theme.text
                        }}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Services Grid */}
                  <View style={styles.servicesGrid}>
                    {(selectedServiceCategoryId 
                      ? services.filter(s => s.category_id === selectedServiceCategoryId)
                      : services
                    ).map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => toggleServiceSelection(s.id)}
                        style={[
                          styles.serviceOption,
                          {
                            backgroundColor: formServiceIds.includes(s.id)
                              ? Palette.primary + "20"
                              : theme.lightBg,
                            borderColor: formServiceIds.includes(s.id)
                              ? Palette.primary
                              : theme.border
                          }
                        ]}
                      >
                        <View style={styles.serviceCheckbox}>
                          {formServiceIds.includes(s.id) && (
                            <Ionicons name="checkmark" size={16} color={Palette.primary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.serviceName,
                            { color: theme.text }
                          ]}>
                            {s.name}
                          </Text>
                          <Text 
                            style={[
                              styles.serviceDescription,
                              { color: theme.textSecondary }
                            ]}
                            numberOfLines={2}
                          >
                            {s.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Active Status */}
                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={formIsActive}
                      onValueChange={setFormIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={formIsActive ? Palette.white : Palette.black}
                    />
                  </View>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    Inactive packages won't be available for selection
                  </Text>
                </View>

                {/* Validation Error Display */}
                {validationError && (
                  <View style={[
                    styles.errorBox,
                    { 
                      borderColor: Palette.red, 
                      backgroundColor: isDarkMode ? '#3f1f1f' : '#ffefef',
                      marginTop: 8
                    }
                  ]}>
                    <Ionicons name="alert-circle" size={14} color={Palette.red} />
                    <Text style={[styles.errorText, { color: Palette.red }]}>
                      {validationError}
                    </Text>
                  </View>
                )}
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
                  setShowTypeDropdown(false);
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
                    backgroundColor: isFormValid() && !isCheckingDuplicate ? Palette.primary : theme.border,
                    opacity: loading || isCheckingDuplicate ? 0.7 : 1
                  }
                ]}
                onPress={handleAdd}
                disabled={!isFormValid() || loading || isCheckingDuplicate}
              >
                {loading || isCheckingDuplicate ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={isFormValid() ? Palette.black : theme.textSecondary} />
                    <Text style={[
                      styles.saveButtonText,
                      { color: isFormValid() ? Palette.black : theme.textSecondary }
                    ]}>
                      Create Package
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
          setShowTypeDropdown(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEditModal(false);
              setShowTypeDropdown(false);
            }}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.card,
              maxHeight: "85%",
              width: "95%"
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Edit Event Package
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Update package details
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setShowTypeDropdown(false);
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
                {/* Package Type (Read-only) */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Package Type
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>
                      {editingPkg?.package_type_name}
                    </Text>
                  </View>
                </View>

                {/* Package Name */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Package Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>
                      {editingPkg?.package_name}
                    </Text>
                  </View>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                    Package name cannot be changed after creation
                  </Text>
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
                        borderColor: theme.border
                      }
                    ]}
                    placeholder="Enter Package Description"
                    placeholderTextColor={theme.textSecondary}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Excess Pax Price */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Excess Pax Price (per pax)
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.formInputWithPrefix,
                    { borderColor: theme.border }
                  ]}>
                    <Text style={{ color: theme.text, marginRight: 8 }}>₱</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        color: theme.text, 
                        borderWidth: 0,
                        flex: 1 
                      }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={formExcessPaxPrice}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        // Remove leading zeros
                        const withoutLeadingZeros = cleaned.replace(/^0+/, '');
                        setFormExcessPaxPrice(withoutLeadingZeros || "");
                      }}
                    />
                  </View>
                </View>

                {/* Pax Prices */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Pax Pricing Tiers
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={styles.paxTableHeader}>
                    <View style={[styles.paxHeaderCell, { flex: 1 }]}>
                      <Text style={[styles.paxHeaderText, { color: theme.text }]}>
                        Pax Count
                      </Text>
                    </View>
                    <View style={[styles.paxHeaderCell, { flex: 1 }]}>
                      <Text style={[styles.paxHeaderText, { color: theme.text }]}>
                        Price (₱)
                      </Text>
                    </View>
                    <View style={[styles.paxHeaderCell, { flex: 0.3 }]} />
                  </View>
                  
                  {formPaxPrices.map((pp, idx) => (
                    <View key={idx} style={styles.paxRow}>
                      <View style={[styles.paxInputContainer, { flex: 1 }]}>
                        <TextInput
                          style={[
                            styles.paxInput,
                            { 
                              color: theme.text, 
                              borderColor: theme.border,
                              height: 45
                            }
                          ]}
                          keyboardType="numeric"
                          value={String(pp.pax_count)}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary}
                          onChangeText={(v) => {
                            const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(num) && num >= 0) {
                              // Remove leading zeros
                              const withoutLeadingZeros = v.replace(/^0+/, '');
                              updatePaxRow(idx, 'pax_count', withoutLeadingZeros || "");
                            } else {
                              updatePaxRow(idx, 'pax_count', "");
                            }
                          }}
                        />
                      </View>
                      <View style={[styles.paxInputContainer, { flex: 1 }]}>
                        <View style={[styles.paxInputWithPrefix, { borderColor: theme.border, height: 45 }]}>
                          <Text style={{ color: theme.text, marginRight: 4 }}>₱</Text>
                          <TextInput
                            style={[styles.paxInput, { 
                              color: theme.text, 
                              borderWidth: 0,
                              flex: 1 
                            }]}
                            keyboardType="numeric"
                            value={pp.price}
                            placeholder="0"
                            placeholderTextColor={theme.textSecondary}
                            onChangeText={(v) => {
                              const cleaned = v.replace(/[^0-9]/g, '');
                              // Remove leading zeros
                              const withoutLeadingZeros = cleaned.replace(/^0+/, '');
                              updatePaxRow(idx, 'price', withoutLeadingZeros || "");
                            }}
                          />
                        </View>
                      </View>
                      <View style={[styles.paxActionContainer, { flex: 0.3 }]}>
                        <TouchableOpacity 
                          onPress={() => removePaxPriceRow(idx)}
                          style={styles.deletePaxButton}
                          disabled={formPaxPrices.length <= 1}
                        >
                          <Ionicons 
                            name="trash" 
                            size={18} 
                            color={formPaxPrices.length <= 1 ? theme.textSecondary : Palette.red} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  <TouchableOpacity 
                    onPress={addPaxPriceRow}
                    style={styles.addPaxButton}
                  >
                    <Ionicons name="add-circle" size={18} color={Palette.primary} />
                    <Text style={{ color: Palette.primary, marginLeft: 4 }}>
                      Add Pax Tier
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Services */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Services
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  
                  {/* Category Filter */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedServiceCategoryId(null)}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: selectedServiceCategoryId === null 
                            ? Palette.primary 
                            : 'transparent',
                          borderColor: selectedServiceCategoryId === null 
                            ? Palette.primary 
                            : theme.border
                        }
                      ]}
                    >
                      <Text style={{
                        color: selectedServiceCategoryId === null 
                          ? Palette.black 
                          : theme.text
                      }}>
                        All Services
                      </Text>
                    </TouchableOpacity>
                    {serviceCategories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedServiceCategoryId(c.id)}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor: selectedServiceCategoryId === c.id 
                              ? Palette.primary 
                            : 'transparent',
                            borderColor: selectedServiceCategoryId === c.id 
                              ? Palette.primary 
                              : theme.border
                          }
                        ]}
                      >
                        <Text style={{
                          color: selectedServiceCategoryId === c.id 
                            ? Palette.black 
                            : theme.text
                        }}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Services Grid */}
                  <View style={styles.servicesGrid}>
                    {(selectedServiceCategoryId 
                      ? services.filter(s => s.category_id === selectedServiceCategoryId)
                      : services
                    ).map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => toggleServiceSelection(s.id)}
                        style={[
                          styles.serviceOption,
                          {
                            backgroundColor: formServiceIds.includes(s.id)
                              ? Palette.primary + "20"
                              : theme.lightBg,
                            borderColor: formServiceIds.includes(s.id)
                              ? Palette.primary
                              : theme.border
                          }
                        ]}
                      >
                        <View style={styles.serviceCheckbox}>
                          {formServiceIds.includes(s.id) && (
                            <Ionicons name="checkmark" size={16} color={Palette.primary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.serviceName,
                            { color: theme.text }
                          ]}>
                            {s.name}
                          </Text>
                          <Text 
                            style={[
                              styles.serviceDescription,
                              { color: theme.textSecondary }
                            ]}
                            numberOfLines={2}
                          >
                            {s.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Active Status */}
                <View style={styles.formGroup}>
                  <View style={styles.activeRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Active Status
                    </Text>
                    <Switch
                      value={formIsActive}
                      onValueChange={setFormIsActive}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={formIsActive ? Palette.white : Palette.black}
                    />
                  </View>
                </View>

                {/* Validation Error Display */}
                {(validationError || duplicateError) && (
                  <View style={[
                    styles.errorBox,
                    { 
                      borderColor: Palette.red, 
                      backgroundColor: isDarkMode ? '#3f1f1f' : '#ffefef',
                      marginTop: 8
                    }
                  ]}>
                    <Ionicons name="alert-circle" size={14} color={Palette.red} />
                    <Text style={[styles.errorText, { color: Palette.red }]}>
                      {validationError || duplicateError}
                    </Text>
                  </View>
                )}
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
                  setShowTypeDropdown(false);
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
                    backgroundColor: hasFormChanges() && isFormValid() && !duplicateError ? Palette.primary : theme.border,
                    opacity: loading ? 0.7 : 1
                  }
                ]}
                onPress={handleSaveEdit}
                disabled={!hasFormChanges() || !isFormValid() || !!duplicateError || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={hasFormChanges() && isFormValid() && !duplicateError ? Palette.black : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.saveButtonText,
                      { color: hasFormChanges() && isFormValid() && !duplicateError ? Palette.black : theme.textSecondary }
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
                  Package Details
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
                    Package Type
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingPkg?.package_type_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Package Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingPkg?.package_name}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingPkg?.description}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Excess Pax Price
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    ₱{viewingPkg?.excess_pax_price} per pax
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Pax Pricing Tiers
                  </Text>
                  <View style={styles.paxDetailsContainer}>
                    {viewingPkg?.pax_prices?.map((pp: any, idx: number) => (
                      <View key={idx} style={styles.paxDetailItem}>
                        <Text style={[styles.paxDetailCount, { color: theme.text }]}>
                          {pp.pax_count} pax
                        </Text>
                        <Text style={[styles.paxDetailPrice, { color: theme.text }]}>
                          ₱{pp.price}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Services
                  </Text>
                  <View style={styles.servicesDetailsContainer}>
                    {viewingPkg?.services?.map((s: any, idx: number) => (
                      <View key={idx} style={styles.serviceDetailItem}>
                        <Ionicons name="checkmark-circle" size={16} color={Palette.primary} />
                        <Text style={[styles.serviceDetailName, { color: theme.text }]}>
                          {s.name}
                        </Text>
                      </View>
                    ))}
                    {(!viewingPkg?.services || viewingPkg.services.length === 0) && (
                      <Text style={[styles.noServicesText, { color: theme.textSecondary }]}>
                        No services assigned
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: viewingPkg?.is_active 
                        ? Palette.green + "20" 
                        : Palette.red + "20" 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: viewingPkg?.is_active ? Palette.green : Palette.red }
                    ]}>
                      {viewingPkg?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Created At
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingPkg?.created_at}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Last Updated
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {viewingPkg?.updated_at || 'Never'}
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
                {error}
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
  container: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, padding: 16 },
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
  customDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 140,
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
  cellText: { 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  cellDescription: { 
    fontSize: 12, 
    marginTop: 2,
    fontFamily: 'Poppins-Regular'
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: Palette.red,
    fontSize: 12,
    flex: 1,
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
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  modalFooter: { 
    flexDirection: "row", 
    gap: 12, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    justifyContent: "flex-end" 
  },
  formGroup: { marginBottom: 20 },
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
  formInputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paxTableHeader: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  paxHeaderCell: {
    paddingHorizontal: 4,
  },
  paxHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  paxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  paxInputContainer: {
    paddingHorizontal: 4,
  },
  paxInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  paxInputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paxActionContainer: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePaxButton: {
    padding: 8,
  },
  addPaxButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  servicesGrid: {
    gap: 8,
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: 'Poppins-Medium'
  },
  serviceDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular'
  },
  activeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  hintText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular'
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
  paxDetailsContainer: {
    gap: 8,
  },
  paxDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paxDetailCount: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  paxDetailPrice: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold'
  },
  servicesDetailsContainer: {
    gap: 8,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  serviceDetailName: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  noServicesText: {
    fontSize: 14,
    fontStyle: 'italic',
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