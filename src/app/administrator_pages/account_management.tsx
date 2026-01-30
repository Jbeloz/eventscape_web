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
    companyName: "",
    companyAddress: "",
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

  const theme = isDarkMode ? Palette.dark : Palette.light;
  // Generate random password with requirements:
  // - Minimum of 8 characters
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character (!@#$%^&*)
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";

    // Ensure at least one of each requirement
    let password =
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly from all characters
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
    // Returns 64-character hex string
  };

  // Validate phone number format (accepts various formats)
  const isValidPhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it has at least 10 digits and at most 15 digits
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
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
          companyName: data.company_name || "",
          companyAddress: data.company_address || "",
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
      firstName: user.name.split(" ")[0],
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

  // Create user
  const handleCreateUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setModalMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    // Validate phone number if provided
    if (formData.contactNumber && !isValidPhoneNumber(formData.contactNumber)) {
      setModalMessage({ type: "error", text: "Please enter a valid phone number (10-15 digits)" });
      return;
    }

    try {
      setSubmitLoading(true);
      const password = generatePassword();
      const roleKey = formData.role as UserRole;

      // Check if user already exists in database
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("email", formData.email.toLowerCase())
        .single();

      if (existingUser) {
        setModalMessage({ type: "error", text: "User with this email already exists" });
        setSubmitLoading(false);
        return;
      }

      // Also check if user exists in Supabase Auth
      const { data: authUsers, error: authCheckError } = await supabase.auth.admin.listUsers();
      if (authCheckError) {
        console.error("Auth check error:", authCheckError);
      } else if (authUsers?.users?.some(u => u.email?.toLowerCase() === formData.email.toLowerCase())) {
        setModalMessage({ type: "error", text: "Email already registered in authentication system" });
        setSubmitLoading(false);
        return;
      }

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
      // Step 1: Generate unique email verification token hash
      const emailTokenHash = hashToken(`${formData.email}-${Date.now()}-${Math.random()}`);
      // Uses: email + timestamp + random number to ensure uniqueness

      // Step 2: Use same expiry time as OTP (10 minutes)
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
      const now = new Date().toISOString();

      // Step 3: Insert into database
      const { error: emailVerifError } = await supabase.from("email_verification").insert({
        user_id: userId, // ← Foreign key to users table
        email_token_hash: emailTokenHash, // ← Hashed unique token
        expires_at: expiryTime.toISOString(), // ← ISO string format (same as OTP)
        is_verified: true, // ← Not verified yet
        last_token_sent: now,
      });

      if (emailVerifError) {
        setModalMessage({ type: "error", text: "Failed to create email verification record" });
        setSubmitLoading(false);
        return;
      }

      // Create OTP record
      // Step 1: Generate 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Step 2: Hash the OTP code using custom hash function
      const otpHash = hashToken(otpCode);

      // Step 3: Calculate expiry time (10 minutes from now)
      const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Step 4: Insert into database
      const { error: otpInsertError } = await supabase.from("otp").insert({
        user_id: userId, // ← Foreign key to users table
        otp_code_hash: otpHash, // ← Hashed 6-digit code
        otp_expiry: otpExpiryTime.toISOString(), // ← ISO string format
        otp_attempts: 0, // ← Starts at 0
        last_otp_sent: now,
      });

      if (otpInsertError) {
        setModalMessage({ type: "error", text: "Failed to create OTP record" });
        setSubmitLoading(false);
        return;
      }

      // Show success modal with password
      setCreatedPassword(password);
      setCreatedUserEmail(formData.email);
      setModalType(null); // Close the create modal first
      
      // Show success modal after a brief delay
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);
      
      // Refresh users list
      setTimeout(() => {
        fetchUsers();
      }, 500);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to create user" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update user
  const handleEditUser = async () => {
    if (!formData.firstName || !formData.lastName) {
      setModalMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    // Validate phone number if provided
    if (formData.contactNumber && !isValidPhoneNumber(formData.contactNumber)) {
      setModalMessage({ type: "error", text: "Please enter a valid phone number (10-15 digits)" });
      return;
    }

    try {
      setSubmitLoading(true);
      const roleKey = formData.role as UserRole;

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
        } else {
          await supabase.from("event_organizers").insert({
            user_id: selectedUser.id,
            company_name: formData.companyName || null,
            company_address: formData.companyAddress || null,
            business_email: formData.businessEmail || null,
            business_number: formData.businessNumber || null,
          });
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
        } else {
          await supabase.from("administrators").insert({
            user_id: selectedUser.id,
            position: formData.position || "System Administrator",
            role_description: formData.roleDescription || "",
          });
        }
      }

      setModalMessage({ type: "success", text: "User updated successfully!" });

      // Refresh users list after 1.5 seconds
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

      // Refresh users list after 1.5 seconds
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

  // Fetch users function (extracted for reuse)
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
        // Fetch additional data for each user
        const usersWithDetails = await Promise.all(
          data.map(async (user: any) => {
            // Fetch email verification status
            const { data: emailVerif } = await supabase
              .from("email_verification")
              .select("is_verified")
              .eq("user_id", user.user_id)
              .single();

            // Fetch user photo - get the first uploaded photo for the user
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

    const matchesRole = roleFilter === null || user.role === roleFilter;

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

          <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={openCreateModal}>
            <MaterialCommunityIcons name="plus" size={20} color={Palette.black} />
            <Text style={styles.createButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, flex: 2 }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by name, email, or contact..."
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Role Filter Dropdown */}
          <View style={{ flex: 1, marginLeft: 12, zIndex: 1000, overflow: "visible" }}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setRoleDropdownOpen(!roleDropdownOpen)}
            >
              <Ionicons name="filter" size={18} color={theme.textSecondary} />
              <Text style={[styles.filterButtonText, { color: theme.text }]}>
                {roleFilter ? roleFilter : "All Roles"}
              </Text>
              <Ionicons name={roleDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            {roleDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setRoleFilter(null);
                    setRoleDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: roleFilter === null ? Palette.primary : theme.text }]}>
                    All Roles
                  </Text>
                </TouchableOpacity>
                {availableRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRoleFilter(role);
                      setRoleDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: roleFilter === role ? Palette.primary : theme.text }]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Users Table */}
        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: "#dc3545" }]}>Error: {error}</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
          </View>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={[styles.tableContainer, { backgroundColor: theme.card, minWidth: 1200 }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderBottomColor: theme.border }]}>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 1.8 }]}>Full Name</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 1.2 }]}>Role</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 1.5, width: 200 }]}>Email</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 0.8, textAlign: 'center' }]}>Contact</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 0.8, textAlign: 'center' }]}>Verified</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 0.8, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.columnHeader, { color: isDarkMode ? "#1a1a1a" : theme.text, flex: 0.8, textAlign: 'center' }]}>Actions</Text>
          </View>

          {filteredUsers.map((user) => (
            <View
              key={user.id}
              style={[
                styles.tableRow,
                { borderBottomColor: theme.lightBg, backgroundColor: theme.card },
              ]}
            >
              {/* Name Column with Photo */}
              <View style={[styles.nameColumn, { flex: 1.8 }]}>
                {user.profilePhoto ? (
                  <Image
                    source={{ uri: user.profilePhoto }}
                    style={[styles.avatar, { borderRadius: 18 }]}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.initials}</Text>
                  </View>
                )}
                <Text style={[styles.cellText, { color: theme.text }]}>{user.name}</Text>
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
              <Text style={[styles.cellText, { color: theme.text, width: 200 }]}>{user.email}</Text>

              {/* Contact Column */}
              <Text style={[styles.cellText, { color: theme.text, flex: 0.8, textAlign: 'center' }]}>{user.contact}</Text>

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
                  trackColor={{ false: Palette.gray500, true: Palette.primary }}
                  thumbColor={user.status ? Palette.primary : Palette.gray300}
                />
              </View>

              {/* Actions Column */}
              <View style={[styles.actionsColumn, { flex: 0.8 }]}>
                <TouchableOpacity style={styles.actionIcon} onPress={() => openViewModal(user)}>
                  <Ionicons name="eye" size={18} color={Palette.black} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => openEditModal(user)}>
                  <Ionicons name="pencil" size={18} color={Palette.blue} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => openDeleteModal(user)}>
                  <Ionicons name="trash" size={18} color={Palette.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        </ScrollView>
        )}
        </ScrollView>
      </View>

      {/* CREATE MODAL */}
      <Modal visible={modalType === "create"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create Account</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[styles.modalMessage, modalMessage.type === "error" ? styles.errorMessage : styles.successMessage]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? "#dc3545" : "#28a745"} />
                <Text style={[styles.messageText, { color: modalMessage.type === "error" ? "#721c24" : "#155724" }]}>{modalMessage.text}</Text>
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>First Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="First Name" placeholderTextColor={theme.textSecondary} value={formData.firstName} onChangeText={(text) => setFormData({ ...formData, firstName: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Last Name" placeholderTextColor={theme.textSecondary} value={formData.lastName} onChangeText={(text) => setFormData({ ...formData, lastName: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Email *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.textSecondary} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} editable={!submitLoading} keyboardType="email-address" />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Contact Number</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Contact Number" placeholderTextColor={theme.textSecondary} value={formData.contactNumber} onChangeText={(text) => setFormData({ ...formData, contactNumber: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Role *</Text>
              <View style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, paddingHorizontal: 0 }]}>
                {["customer", "event_organizer", "coordinator", "venue_administrator", "administrator"].map((role) => (
                  <TouchableOpacity 
                    key={role}
                    style={role === "customer" ? styles.roleSelect : styles.roleSelectItem}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text style={{ color: formData.role === role ? Palette.primary : theme.text }}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Role-Specific Fields */}
              {ROLE_SPECIFIC_FIELDS[formData.role as UserRole]?.map((field) => {
                // Make company name and address read-only for event organizers
                const isReadOnly = formData.role === "event_organizer" && (field.key === "companyName" || field.key === "companyAddress");
                
                return (
                  <View key={field.key}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>{field.label}{isReadOnly ? " (Read-only)" : ""}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.bg, color: isReadOnly ? theme.textSecondary : theme.text, borderColor: theme.border, opacity: isReadOnly ? 0.6 : 1 }]}
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={closeModal} disabled={submitLoading}>
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Palette.primary }]} onPress={handleCreateUser} disabled={submitLoading}>
                {submitLoading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: Palette.black }]}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW MODAL */}
      <Modal visible={modalType === "view"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>User Details</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Name</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedUser.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Role</Text>
                  <Text style={[styles.detailValue, { color: getRoleBadgeColor(selectedUser.role) }]}>{selectedUser.role}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Contact</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedUser.contact}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</Text>
                  <Text style={[styles.detailValue, { color: selectedUser.status ? "#28a745" : "#dc3545" }]}>{selectedUser.status ? "Active" : "Inactive"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Created At</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Updated At</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.bg, borderColor: theme.border, flex: 1 }]} onPress={closeModal}>
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Palette.blue, flex: 1, marginLeft: 8 }]} onPress={() => { setModalType(null); setTimeout(() => openEditModal(selectedUser), 100); }}>
                <Text style={[styles.modalButtonText, { color: "white" }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={modalType === "edit"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Account</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[styles.modalMessage, modalMessage.type === "error" ? styles.errorMessage : styles.successMessage]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? "#dc3545" : "#28a745"} />
                <Text style={[styles.messageText, { color: modalMessage.type === "error" ? "#721c24" : "#155724" }]}>{modalMessage.text}</Text>
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>First Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="First Name" placeholderTextColor={theme.textSecondary} value={formData.firstName} onChangeText={(text) => setFormData({ ...formData, firstName: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Last Name" placeholderTextColor={theme.textSecondary} value={formData.lastName} onChangeText={(text) => setFormData({ ...formData, lastName: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Email (Read-only)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.textSecondary, borderColor: theme.border, opacity: 0.6 }]} placeholder="Email" placeholderTextColor={theme.textSecondary} value={formData.email} editable={false} keyboardType="email-address" />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Contact Number</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} placeholder="Contact Number" placeholderTextColor={theme.textSecondary} value={formData.contactNumber} onChangeText={(text) => setFormData({ ...formData, contactNumber: text })} editable={!submitLoading} />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Role (Read-only)</Text>
              <View style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, opacity: 0.6, justifyContent: "center", paddingVertical: 12 }]}>
                <Text style={{ color: theme.textSecondary }}>
                  {formData.role.charAt(0).toUpperCase() + formData.role.slice(1).replace(/_/g, " ")}
                </Text>
              </View>

              {/* Role-Specific Fields */}
              {ROLE_SPECIFIC_FIELDS[formData.role as UserRole]?.map((field) => {
                // Make company name and address read-only for event organizers
                const isReadOnly = formData.role === "event_organizer" && (field.key === "companyName" || field.key === "companyAddress");
                
                return (
                  <View key={field.key}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>{field.label}{isReadOnly ? " (Read-only)" : ""}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.bg, color: isReadOnly ? theme.textSecondary : theme.text, borderColor: theme.border, opacity: isReadOnly ? 0.6 : 1 }]}
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={closeModal} disabled={submitLoading}>
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Palette.primary }]} onPress={handleEditUser} disabled={submitLoading}>
                {submitLoading ? (
                  <ActivityIndicator size="small" color={Palette.black} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: Palette.black }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE MODAL */}
      <Modal visible={modalType === "delete"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: 250 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Delete User</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {modalMessage && (
              <View style={[styles.modalMessage, modalMessage.type === "error" ? styles.errorMessage : styles.successMessage]}>
                <Ionicons name={modalMessage.type === "error" ? "close-circle" : "checkmark-circle"} size={18} color={modalMessage.type === "error" ? "#dc3545" : "#28a745"} />
                <Text style={[styles.messageText, { color: modalMessage.type === "error" ? "#721c24" : "#155724" }]}>{modalMessage.text}</Text>
              </View>
            )}

            {selectedUser && (
              <View style={styles.modalBody}>
                <Text style={[styles.deleteWarning, { color: theme.text }]}>
                  Are you sure you want to delete <Text style={{ fontWeight: "bold" }}>{selectedUser.name}</Text>? This action cannot be undone.
                </Text>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={closeModal} disabled={submitLoading}>
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#dc3545" }]} onPress={handleDeleteUser} disabled={submitLoading}>
                {submitLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "white" }]}>Delete</Text>
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
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    padding: 16,
    overflow: "visible",
    zIndex: 1,
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
    gap: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 100,
    overflow: "visible",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    position: "relative",
  },
  filterButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 99999,
    elevation: 100,
    overflow: "visible",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  dropdownItemText: {
    fontSize: 14,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
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
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  cellText: {
    fontSize: 14,
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
  },
  statusColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  verificationColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  actionsColumn: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionIcon: {
    padding: 6,
  },
  loadingContainer: {
    padding: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 12,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  roleSelect: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  roleSelectItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#d4edda",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  detailRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  deleteWarning: {
    fontSize: 14,
    lineHeight: 20,
  },
});