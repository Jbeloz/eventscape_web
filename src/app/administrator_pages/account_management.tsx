import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Palette } from "../../../assets/colors/palette";
import AdminHeader from "../../components/admin-header";
import AdminSidebar from "../../components/admin-sidebar";
import ErrorSuccessModal from "../../components/error_success_modal";
import { useTheme } from "../../context/theme-context";
import { ROLE_SPECIFIC_FIELDS, UserRole } from "../../models/types";
import { supabase } from "../../services/supabase";

type ModalType = "create" | "view" | "edit" | "delete" | null;

export default function AccountManagement() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    "All Roles",
    "Administrator",
    "Event Organizer",
    "Coordinator",
    "Venue Administrator",
    "Customer",
  ]);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    role: "customer" as UserRole,
    // Role-specific fields
    companyName: "Weekenders",
    companyAddress: "Genzen Bldg. II, DRT Highway, Poblacion/Sto. Cristo, Pulilan, Bulacan",
    businessEmail: "",
    businessNumber: "",
    specialization: "",
    position: "",
    roleDescription: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdUserEmail, setCreatedUserEmail] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;
  
  // Generate random password with requirements
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";

    let password =
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  // Hash token function for OTP and email verification
  const hashToken = (token: string): string => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  };

  // Validate phone number format
  const isValidPhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Format name - capitalize first letter of each word
  const formatName = (text: string): string => {
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
    return cleaned
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check if email already exists
  const checkDuplicateEmail = async (email: string): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const { data, error: checkError } = await supabase
        .from("users")
        .select("email")
        .ilike("email", email.toLowerCase())
        .limit(1);
      
      if (checkError) throw checkError;
      
      return (data && data.length > 0);
    } catch (error) {
      console.error("Error checking duplicate email:", error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      contactNumber: "",
      role: "customer" as UserRole,
      companyName: "Weekenders",
      companyAddress: "Genzen Bldg. II, DRT Highway, Poblacion/Sto. Cristo, Pulilan, Bulacan",
      businessEmail: "",
      businessNumber: "",
      specialization: "",
      position: "",
      roleDescription: "",
    });
    setModalMessage(null);
    setValidationError(null);
    setDuplicateError(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setModalType("create");
  };

  // Open view modal
  const openViewModal = (user: any) => {
    setSelectedUser(user);
    setModalType("view");
  };

  // Open edit modal
  const openEditModal = async (user: any) => {
    setSelectedUser(user);
    const roleKey = user.role.toLowerCase().replace(/\s+/g, "_") as UserRole;
    
    // Load role-specific data
    let roleSpecificData: any = {};
    
    if (roleKey === "event_organizer") {
      const { data } = await supabase
        .from("event_organizers")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        roleSpecificData = {
          companyName: data.company_name || "Weekenders",
          companyAddress: data.company_address || "Genzen Bldg. II, DRT Highway, Poblacion/Sto. Cristo, Pulilan, Bulacan",
          businessEmail: data.business_email || "",
          businessNumber: data.business_number || "",
        };
      }
    } else if (roleKey === "coordinator") {
      const { data } = await supabase
        .from("coordinators")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        roleSpecificData = {
          specialization: data.specialization || "",
        };
      }
    } else if (roleKey === "administrator") {
      const { data } = await supabase
        .from("administrators")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        roleSpecificData = {
          position: data.position || "",
          roleDescription: data.role_description || "",
        };
      }
    }

    setFormData({
      firstName: user.name.split(" ")[0] || "",
      lastName: user.name.split(" ")[1] || "",
      email: user.email,
      contactNumber: user.contact === "N/A" ? "" : user.contact,
      role: roleKey,
      ...roleSpecificData,
    });
    setModalType("edit");
  };

  // Open delete confirmation
  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    resetForm();
  };

  // Close success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedPassword(null);
    setCreatedUserEmail(null);
    setModalType(null);
    resetForm();
  };

  // Handle first name change
  const handleFirstNameChange = (text: string) => {
    const formatted = formatName(text);
    setFormData({ ...formData, firstName: formatted });
    setValidationError(null);
  };

  // Handle last name change
  const handleLastNameChange = (text: string) => {
    const formatted = formatName(text);
    setFormData({ ...formData, lastName: formatted });
    setValidationError(null);
  };

  // Handle email change with duplicate checking
  const handleEmailChange = async (text: string) => {
    setFormData({ ...formData, email: text.toLowerCase() });
    setValidationError(null);
    
    if (duplicateError) {
      setDuplicateError(null);
    }
    
    if (text.trim().length >= 3) {
      if (isValidEmail(text)) {
        const isDuplicate = await checkDuplicateEmail(text);
        if (isDuplicate) {
          setDuplicateError(`Email "${text}" already exists. Please use a different email.`);
        } else {
          setDuplicateError(null);
        }
      }
    }
  };

  // Handle email blur - final validation
  const handleEmailBlur = async () => {
    if (formData.email.trim()) {
      if (isValidEmail(formData.email)) {
        const isDuplicate = await checkDuplicateEmail(formData.email);
        if (isDuplicate) {
          setDuplicateError(`Email "${formData.email}" already exists. Please use a different email.`);
        }
      }
    }
  };

  // Validate form
  const validateForm = () => {
    setValidationError(null);
    setDuplicateError(null);

    if (!formData.firstName.trim()) {
      setValidationError("First name is required.");
      return false;
    }

    if (formData.firstName.trim().length < 2) {
      setValidationError("First name must be at least 2 characters long.");
      return false;
    }

    if (!formData.lastName.trim()) {
      setValidationError("Last name is required.");
      return false;
    }

    if (formData.lastName.trim().length < 2) {
      setValidationError("Last name must be at least 2 characters long.");
      return false;
    }

    if (!formData.email.trim()) {
      setValidationError("Email is required.");
      return false;
    }

    if (!isValidEmail(formData.email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }

    if (formData.contactNumber && !isValidPhoneNumber(formData.contactNumber)) {
      setValidationError("Please enter a valid phone number (10-15 digits).");
      return false;
    }

    // Role-specific validations
    if (formData.role === "event_organizer") {
      if (formData.businessEmail && !isValidEmail(formData.businessEmail)) {
        setValidationError("Please enter a valid business email address.");
        return false;
      }
      if (formData.businessNumber && !isValidPhoneNumber(formData.businessNumber)) {
        setValidationError("Please enter a valid business phone number (10-15 digits).");
        return false;
      }
    }

    return true;
  };

  // Check if create form is valid
  const isCreateFormValid = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() &&
           isValidEmail(formData.email) &&
           (!formData.contactNumber || isValidPhoneNumber(formData.contactNumber)) &&
           !validationError &&
           !duplicateError;
  };

  // Check if edit form has changes
  const hasEditChanges = () => {
    if (!selectedUser) return false;

    const currentFirstName = selectedUser.name.split(" ")[0] || "";
    const currentLastName = selectedUser.name.split(" ")[1] || "";
    const currentContact = selectedUser.contact === "N/A" ? "" : selectedUser.contact;

    if (formData.firstName !== currentFirstName) return true;
    if (formData.lastName !== currentLastName) return true;
    if (formData.contactNumber !== currentContact) return true;

    return false;
  };

  // Create user
  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }

    // Final duplicate check
    try {
      setIsCheckingDuplicate(true);
      const isDuplicate = await checkDuplicateEmail(formData.email);
      
      if (isDuplicate) {
        setDuplicateError(`Email "${formData.email}" already exists. Please use a different email.`);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setModalMessage({ type: "error", text: "Failed to validate email. Please try again." });
      setIsCheckingDuplicate(false);
      return;
    }

    try {
      setSubmitLoading(true);
      const password = generatePassword();
      const roleKey = formData.role as UserRole;

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: password,
      });

      if (authError) {
        setModalMessage({ type: "error", text: authError.message });
        setSubmitLoading(false);
        return;
      }

      if (!authData.user?.id) {
        setModalMessage({ type: "error", text: "Failed to create authentication user" });
        setSubmitLoading(false);
        return;
      }

      // Insert user into users table
      const { data: userData, error: dbError } = await supabase
        .from("users")
        .insert({
          auth_id: authData.user.id,
          email: formData.email.toLowerCase(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.contactNumber || null,
          user_role: roleKey,
          is_active: true,
        })
        .select()
        .single();

      if (dbError) {
        setModalMessage({ type: "error", text: dbError.message });
        setSubmitLoading(false);
        return;
      }

      const userId = userData.user_id;

      // Create role-specific record
      if (roleKey === "customer") {
        await supabase.from("customers").insert({
          user_id: userId,
          preferences: null,
        });
      } else if (roleKey === "event_organizer") {
        await supabase.from("event_organizers").insert({
          user_id: userId,
          company_name: formData.companyName || null,
          company_address: formData.companyAddress || null,
          business_email: formData.businessEmail || null,
          business_number: formData.businessNumber || null,
        });
      } else if (roleKey === "coordinator") {
        await supabase.from("coordinators").insert({
          user_id: userId,
          organizer_id: null,
          specialization: formData.specialization || null,
        });
      } else if (roleKey === "venue_administrator") {
        await supabase.from("venue_administrators").insert({
          user_id: userId,
          assigned_venue_id: null,
        });
      } else if (roleKey === "administrator") {
        await supabase.from("administrators").insert({
          user_id: userId,
          position: formData.position || "System Administrator",
          role_description: formData.roleDescription || "",
        });
      }

      // Create email verification record
      const emailTokenHash = hashToken(`${formData.email}-${Date.now()}-${Math.random()}`);
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
      const now = new Date().toISOString();

      await supabase.from("email_verification").insert({
        user_id: userId,
        email_token_hash: emailTokenHash,
        expires_at: expiryTime.toISOString(),
        is_verified: true,
        last_token_sent: now,
      });

      // Create OTP record
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = hashToken(otpCode);
      const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

      await supabase.from("otp").insert({
        user_id: userId,
        otp_code_hash: otpHash,
        otp_expiry: otpExpiryTime.toISOString(),
        otp_attempts: 0,
        last_otp_sent: now,
      });

      // Show success modal with password
      setCreatedPassword(password);
      setCreatedUserEmail(formData.email);
      setModalType(null);
      
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);
      
      setTimeout(() => {
        fetchUsers();
      }, 500);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to create user" });
    } finally {
      setSubmitLoading(false);
      setIsCheckingDuplicate(false);
    }
  };

  // Update user
  const handleEditUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);

      // Update users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.contactNumber || null,
        })
        .eq("user_id", selectedUser.id);

      if (updateError) {
        setModalMessage({ type: "error", text: updateError.message });
        setSubmitLoading(false);
        return;
      }

      // Update role-specific records
      const roleKey = formData.role as UserRole;
      
      if (roleKey === "event_organizer") {
        const { data: existing } = await supabase
          .from("event_organizers")
          .select("organizer_id")
          .eq("user_id", selectedUser.id)
          .single();

        if (existing) {
          await supabase
            .from("event_organizers")
            .update({
              company_name: formData.companyName || null,
              company_address: formData.companyAddress || null,
              business_email: formData.businessEmail || null,
              business_number: formData.businessNumber || null,
            })
            .eq("user_id", selectedUser.id);
        }
      } else if (roleKey === "coordinator") {
        const { data: existing } = await supabase
          .from("coordinators")
          .select("coordinator_id")
          .eq("user_id", selectedUser.id)
          .single();

        if (existing) {
          await supabase
            .from("coordinators")
            .update({
              specialization: formData.specialization || null,
            })
            .eq("user_id", selectedUser.id);
        }
      } else if (roleKey === "administrator") {
        const { data: existing } = await supabase
          .from("administrators")
          .select("admin_id")
          .eq("user_id", selectedUser.id)
          .single();

        if (existing) {
          await supabase
            .from("administrators")
            .update({
              position: formData.position || "System Administrator",
              role_description: formData.roleDescription || "",
            })
            .eq("user_id", selectedUser.id);
        }
      }

      setModalMessage({ type: "success", text: "User updated successfully!" });

      setTimeout(() => {
        fetchUsers();
        closeModal();
      }, 1500);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to update user" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      setSubmitLoading(true);

      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) {
        setModalMessage({ type: "error", text: deleteError.message });
        setSubmitLoading(false);
        return;
      }

      setModalMessage({ type: "success", text: "User deleted successfully!" });

      setTimeout(() => {
        fetchUsers();
        closeModal();
      }, 1500);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to delete user" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("user_id, email, first_name, last_name, phone_number, user_role, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setUsers([]);
        return;
      }

      if (data) {
        const usersWithDetails = await Promise.all(
          data.map(async (user: any) => {
            const { data: emailVerif } = await supabase
              .from("email_verification")
              .select("is_verified")
              .eq("user_id", user.user_id)
              .single();

            const { data: userPhoto } = await supabase
              .from("user_photos")
              .select("file_url, profile_photo")
              .eq("user_id", user.user_id)
              .maybeSingle();

            return {
              id: user.user_id,
              name: `${user.first_name} ${user.last_name}`,
              role: user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1).replace(/_/g, " "),
              email: user.email,
              contact: user.phone_number || "N/A",
              status: user.is_active,
              emailVerified: emailVerif?.is_verified || false,
              profilePhoto: userPhoto?.file_url || null,
              initials: `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase(),
              createdAt: user.created_at,
              updatedAt: user.updated_at,
            };
          })
        );
        
        setUsers(usersWithDetails);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const handleUpdateStatus = async (userId: number, newStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_active: newStatus })
        .eq("user_id", userId);

      if (!updateError) {
        setUsers(users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.contact.toLowerCase().includes(searchText.toLowerCase());

    const matchesRole = !roleFilter || roleFilter === "All Roles" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes("admin")) return "#dc3545";
    if (lowerRole.includes("organizer")) return "#007bff";
    if (lowerRole.includes("venue")) return "#28a745";
    if (lowerRole.includes("coordinator")) return "#ffc107";
    if (lowerRole.includes("customer")) return "#17a2b8";
    return "#6c757d";
  };

  const toggleUserStatus = (id: any) => {
    const user = users.find((u: any) => u.id === id);
    if (user) {
      handleUpdateStatus(id, !user.status);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading users...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <AdminHeader
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <View style={styles.mainContainer}>
        {/* Sidebar */}
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.text }]}>Account Management</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Create and manage user accounts
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: Palette.primary }]} 
              onPress={openCreateModal}
            >
              <MaterialCommunityIcons name="plus" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={[styles.errorBox, { borderColor: Palette.red, backgroundColor: isDarkMode ? '#3f1f1f' : '#ffefef' }]}> 
              <Text style={{ color: Palette.red, fontSize: 13, fontFamily: 'Poppins-Regular' }}>{error}</Text>
            </View>
          )}

          {/* Search & Filter Bar */}
          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name, email, or contact..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setRoleDropdownOpen(!roleDropdownOpen)}
              >
                <Text style={[styles.filterButtonText, { color: theme.text }]}>
                  {roleFilter || "All Roles"}
                </Text>
                <Ionicons name={roleDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              {roleDropdownOpen && (
                <View style={[
                  styles.dropdownMenu, 
                  { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border,
                    zIndex: 1000,
                  }
                ]}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {availableRoles.map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setRoleFilter(role === "All Roles" ? null : role);
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText, 
                          { 
                            color: roleFilter === role || (role === "All Roles" && !roleFilter) ? Palette.primary : theme.text 
                          }
                        ]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Users Table */}
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
                <Text style={[styles.columnHeader, { color: theme.text }]}>Full Name</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1.2 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Role</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1.5 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Email</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1 }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Contact</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Verified</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 0.8, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Status</Text>
              </View>
              <View style={[styles.columnHeaderWrapper, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
                <Text style={[styles.columnHeader, { color: theme.text }]}>Actions</Text>
              </View>
            </View>

            {filteredUsers.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {searchText || roleFilter ? "No users found" : "No users available"}
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <View key={user.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Name Column with Photo */}
                  <View style={[styles.nameColumn, { flex: 1.5 }]}>
                    {user.profilePhoto ? (
                      <Image
                        source={{ uri: user.profilePhoto }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: Palette.primary }]}>
                        <Text style={styles.avatarText}>{user.initials}</Text>
                      </View>
                    )}
                    <Text style={[styles.cellText, { color: theme.text, fontWeight: "500" }]} numberOfLines={1}>
                      {user.name}
                    </Text>
                  </View>

                  {/* Role Column */}
                  <View style={[styles.roleColumn, { flex: 1.2 }]}>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: getRoleBadgeColor(user.role) + "20" },
                      ]}
                    >
                      <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(user.role) }]}>
                        {user.role}
                      </Text>
                    </View>
                  </View>

                  {/* Email Column */}
                  <View style={[styles.cellWrapper, { flex: 1.5 }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>

                  {/* Contact Column */}
                  <View style={[styles.cellWrapper, { flex: 1 }]}>
                    <Text style={[styles.cellText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {user.contact}
                    </Text>
                  </View>

                  {/* Email Verified Column */}
                  <View style={[styles.verificationColumn, { flex: 0.8 }]}>
                    {user.emailVerified ? (
                      <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                    ) : (
                      <Ionicons name="close-circle" size={20} color="#dc3545" />
                    )}
                  </View>

                  {/* Status Column */}
                  <View style={[styles.statusColumn, { flex: 0.8 }]}>
                    <Switch
                      value={user.status}
                      onValueChange={() => toggleUserStatus(user.id)}
                      trackColor={{ false: theme.textSecondary, true: Palette.gray700 }}
                      thumbColor={user.status ? Palette.white : Palette.black}
                    />
                  </View>

                  {/* Actions Column */}
                  <View style={[styles.actionsColumn, { flex: 1 }]}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => openViewModal(user)}
                      >
                        <Ionicons name="eye" size={18} color={Palette.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => openEditModal(user)}
                      >
                        <Ionicons name="pencil" size={18} color={Palette.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => openDeleteModal(user)}
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

      {/* CREATE MODAL */}
      <Modal 
        visible={modalType === "create"} 
        transparent 
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create Account</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Create a new user account
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[
                styles.modalMessage, 
                modalMessage.type === "error" ? styles.errorMessage : styles.successMessage
              ]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? Palette.red : Palette.green} />
                <Text style={[
                  styles.messageText, 
                  { color: modalMessage.type === "error" ? Palette.red : Palette.green }
                ]}>
                  {modalMessage.text}
                </Text>
              </View>
            )}

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      First Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && !formData.firstName.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter First Name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.firstName}
                    onChangeText={handleFirstNameChange}
                    editable={!submitLoading}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Last Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && !formData.lastName.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Last Name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.lastName}
                    onChangeText={handleLastNameChange}
                    editable={!submitLoading}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Email
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: duplicateError || (validationError && !formData.email.trim()) ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Email"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    editable={!submitLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
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

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Contact Number
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && formData.contactNumber && !isValidPhoneNumber(formData.contactNumber) ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Contact Number"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.contactNumber}
                    onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
                    editable={!submitLoading}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Role
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <View style={[
                    styles.formInput, 
                    { 
                      backgroundColor: theme.lightBg, 
                      borderColor: theme.border,
                      paddingHorizontal: 0,
                      paddingVertical: 0
                    }
                  ]}>
                    {["customer", "event_organizer", "coordinator", "venue_administrator", "administrator"].map((role) => (
                      <TouchableOpacity 
                        key={role}
                        style={[
                          styles.roleSelectItem,
                          { 
                            borderBottomWidth: 1, 
                            borderBottomColor: theme.border,
                            paddingHorizontal: 12,
                            paddingVertical: 12
                          }
                        ]}
                        onPress={() => setFormData({ ...formData, role })}
                      >
                        <Text style={{ 
                          color: formData.role === role ? Palette.primary : theme.text,
                          fontFamily: 'Poppins-Regular'
                        }}>
                          {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Role-Specific Fields */}
                {ROLE_SPECIFIC_FIELDS[formData.role as UserRole]?.map((field) => {
                  const isReadOnly = formData.role === "event_organizer" && (field.key === "companyName" || field.key === "companyAddress");
                  
                  return (
                    <View key={field.key} style={styles.formGroup}>
                      <Text style={[styles.formLabel, { color: theme.text }]}>
                        {field.label}{isReadOnly ? " (Read-only)" : ""}
                      </Text>
                      <TextInput
                        style={[
                          styles.formInput, 
                          { 
                            backgroundColor: theme.lightBg, 
                            color: isReadOnly ? theme.textSecondary : theme.text, 
                            borderColor: theme.border,
                            opacity: isReadOnly ? 0.6 : 1
                          }
                        ]}
                        placeholder={field.label}
                        placeholderTextColor={theme.textSecondary}
                        value={formData[field.key] || ""}
                        onChangeText={(text) => !isReadOnly && setFormData({ ...formData, [field.key]: text })}
                        editable={!isReadOnly && !submitLoading}
                        keyboardType={field.type === "tel" ? "phone-pad" : field.type === "email" ? "email-address" : "default"}
                      />
                    </View>
                  );
                })}

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
                onPress={closeModal}
                disabled={submitLoading}
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
                    backgroundColor: isCreateFormValid() && !isCheckingDuplicate ? Palette.primary : theme.border,
                    opacity: submitLoading || isCheckingDuplicate ? 0.7 : 1
                  }
                ]}
                onPress={handleCreateUser}
                disabled={!isCreateFormValid() || submitLoading || isCheckingDuplicate}
              >
                {submitLoading || isCheckingDuplicate ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={isCreateFormValid() ? Palette.black : theme.textSecondary} />
                    <Text style={[
                      styles.saveButtonText,
                      { color: isCreateFormValid() ? Palette.black : theme.textSecondary }
                    ]}>
                      Create User
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW MODAL */}
      <Modal 
        visible={modalType === "view"} 
        transparent 
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
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
                  User Details
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalBody}>
                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Name
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedUser.name}
                    </Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Email
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedUser.email}
                    </Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Role
                    </Text>
                    <View style={[
                      styles.roleBadge,
                      { 
                        backgroundColor: getRoleBadgeColor(selectedUser.role) + "20",
                        alignSelf: 'flex-start'
                      }
                    ]}>
                      <Text style={[
                        styles.roleBadgeText,
                        { color: getRoleBadgeColor(selectedUser.role) }
                      ]}>
                        {selectedUser.role}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Contact
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedUser.contact}
                    </Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Email Verified
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: selectedUser.emailVerified 
                          ? Palette.green + "20" 
                          : Palette.red + "20",
                        alignSelf: 'flex-start'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: selectedUser.emailVerified ? Palette.green : Palette.red }
                      ]}>
                        {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Status
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: selectedUser.status 
                          ? Palette.green + "20" 
                          : Palette.red + "20",
                        alignSelf: 'flex-start'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: selectedUser.status ? Palette.green : Palette.red }
                      ]}>
                        {selectedUser.status ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Created At
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Last Updated
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={[
              styles.modalFooter,
              { borderTopColor: theme.border }
            ]}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: Palette.primary }
                ]}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal 
        visible={modalType === "edit"} 
        transparent 
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Account</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Update user details
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[
                styles.modalMessage, 
                modalMessage.type === "error" ? styles.errorMessage : styles.successMessage
              ]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? Palette.red : Palette.green} />
                <Text style={[
                  styles.messageText, 
                  { color: modalMessage.type === "error" ? Palette.red : Palette.green }
                ]}>
                  {modalMessage.text}
                </Text>
              </View>
            )}

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      First Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && !formData.firstName.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter First Name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.firstName}
                    onChangeText={handleFirstNameChange}
                    editable={!submitLoading}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Last Name
                    </Text>
                    <Text style={{ color: Palette.red, fontSize: 14 }}>*</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && !formData.lastName.trim() ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Last Name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.lastName}
                    onChangeText={handleLastNameChange}
                    editable={!submitLoading}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Email (Read-only)
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {formData.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Contact Number
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        color: theme.text, 
                        borderColor: validationError && formData.contactNumber && !isValidPhoneNumber(formData.contactNumber) ? Palette.red : theme.border,
                        backgroundColor: theme.lightBg
                      }
                    ]}
                    placeholder="Enter Contact Number"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.contactNumber}
                    onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
                    editable={!submitLoading}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Role (Read-only)
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    { 
                      backgroundColor: theme.lightBg,
                      borderColor: theme.border
                    }
                  ]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                      {formData.role.charAt(0).toUpperCase() + formData.role.slice(1).replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>

                {/* Role-Specific Fields */}
                {ROLE_SPECIFIC_FIELDS[formData.role as UserRole]?.map((field) => {
                  const isReadOnly = formData.role === "event_organizer" && (field.key === "companyName" || field.key === "companyAddress");
                  
                  return (
                    <View key={field.key} style={styles.formGroup}>
                      <Text style={[styles.formLabel, { color: theme.text }]}>
                        {field.label}{isReadOnly ? " (Read-only)" : ""}
                      </Text>
                      <TextInput
                        style={[
                          styles.formInput, 
                          { 
                            backgroundColor: theme.lightBg, 
                            color: isReadOnly ? theme.textSecondary : theme.text, 
                            borderColor: theme.border,
                            opacity: isReadOnly ? 0.6 : 1
                          }
                        ]}
                        placeholder={field.label}
                        placeholderTextColor={theme.textSecondary}
                        value={formData[field.key] || ""}
                        onChangeText={(text) => !isReadOnly && setFormData({ ...formData, [field.key]: text })}
                        editable={!isReadOnly && !submitLoading}
                        keyboardType={field.type === "tel" ? "phone-pad" : field.type === "email" ? "email-address" : "default"}
                      />
                    </View>
                  );
                })}

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
                onPress={closeModal}
                disabled={submitLoading}
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
                    backgroundColor: hasEditChanges() && !validationError ? Palette.primary : theme.border,
                    opacity: submitLoading ? 0.7 : 1
                  }
                ]}
                onPress={handleEditUser}
                disabled={!hasEditChanges() || submitLoading || !!validationError}
              >
                {submitLoading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <>
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={hasEditChanges() && !validationError ? Palette.black : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.saveButtonText,
                      { color: hasEditChanges() && !validationError ? Palette.black : theme.textSecondary }
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

      {/* DELETE MODAL */}
      <Modal 
        visible={modalType === "delete"} 
        transparent 
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={[
            styles.smallModalContent, 
            { 
              backgroundColor: theme.card,
              width: "85%",
              maxHeight: 250
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Delete User</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[
                styles.modalMessage, 
                modalMessage.type === "error" ? styles.errorMessage : styles.successMessage
              ]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? Palette.red : Palette.green} />
                <Text style={[
                  styles.messageText, 
                  { color: modalMessage.type === "error" ? Palette.red : Palette.green }
                ]}>
                  {modalMessage.text}
                </Text>
              </View>
            )}

            {selectedUser && (
              <View style={styles.modalBody}>
                <Text style={[styles.deleteWarning, { color: theme.text }]}>
                  Are you sure you want to delete <Text style={{ fontWeight: "bold" }}>{selectedUser.name}</Text>? This action cannot be undone.
                </Text>
              </View>
            )}

            <View style={[
              styles.modalFooter,
              { borderTopColor: theme.border }
            ]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.border }
                ]}
                onPress={closeModal}
                disabled={submitLoading}
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
                    backgroundColor: Palette.red,
                    opacity: submitLoading ? 0.7 : 1
                  }
                ]}
                onPress={handleDeleteUser}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="white" />
                    <Text style={[
                      styles.saveButtonText,
                      { color: "white" }
                    ]}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACCOUNT CREATED SUCCESS MODAL */}
      <ErrorSuccessModal
        visible={showSuccessModal}
        onClose={closeSuccessModal}
        title="Account Created Successfully!"
        message="Account has been created successfully. A confirmation email has been sent to:"
        type="success"
        password={createdPassword}
        email={createdUserEmail}
        theme={theme}
      />
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
  nameColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold'
  },
  cellWrapper: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  cellText: { 
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  roleColumn: {
    alignItems: "flex-start",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: 'Poppins-SemiBold'
  },
  verificationColumn: {
    justifyContent: "center",
    alignItems: "center",
  },
  statusColumn: {
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: 'row',
    alignItems: 'center',
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
  // Modal Styles
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
  readOnlyField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleSelectItem: {
    borderBottomWidth: 1,
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
  modalMessage: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  successMessage: {
    backgroundColor: Palette.green + "20",
    borderWidth: 1,
    borderColor: Palette.green,
  },
  errorMessage: {
    backgroundColor: Palette.red + "20",
    borderWidth: 1,
    borderColor: Palette.red,
  },
  messageText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    fontFamily: 'Poppins-Medium'
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
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: "500",
    fontFamily: 'Poppins-Medium'
  },
  deleteWarning: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular'
  },
});