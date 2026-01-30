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

export default function AllAssets() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [priceFilter, setPriceFilter] = useState("All Prices");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Add Asset Modal State
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetPrice, setAssetPrice] = useState("");
  const [description, setDescription] = useState("");
  const [assetStatus, setAssetStatus] = useState("Active");
  const [assetFile, setAssetFile] = useState("");

  // Edit Asset Modal State
  const [editAssetName, setEditAssetName] = useState("");
  const [editAssetCategory, setEditAssetCategory] = useState("");
  const [editAssetPrice, setEditAssetPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssetStatus, setEditAssetStatus] = useState("Active");

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  const categoryOptions = ["Chairs", "Tables", "Lighting", "Decorations", "Stage Equipment", "Audio/Visual"];
  const priceRanges = ["₱0 - ₱200", "₱201 - ₱500", "₱501 - ₱1000", "₱1000+"];

  // Mock data with emoji icons
  const mockAssets = [
    {
      id: 1,
      name: "Chiavari Chair - Gold",
      category: "Chairs",
      price: 150,
      description: "Elegant gold chiavari chair perfect for weddings and formal events",
      status: "Active",
      icon: "🪑",
    },
    {
      id: 2,
      name: "Round Table - 6 Seater",
      category: "Tables",
      price: 500,
      description: "60-inch round table accommodating 6 guests comfortably",
      status: "Active",
      icon: "🪑",
    },
    {
      id: 3,
      name: "Crystal Chandelier",
      category: "Lighting",
      price: 2500,
      description: "Luxurious crystal chandelier with LED lights",
      status: "Active",
      icon: "💡",
    },
    {
      id: 4,
      name: "Banquet Chair - White",
      category: "Chairs",
      price: 120,
      description: "Classic white banquet chair with padded seat",
      status: "Active",
      icon: "🪑",
    },
    {
      id: 5,
      name: "Rectangular Table - 8 Seater",
      category: "Tables",
      price: 650,
      description: "8ft rectangular table for 8 guests",
      status: "Active",
      icon: "🪑",
    },
    {
      id: 6,
      name: "Floral Centerpiece",
      category: "Decorations",
      price: 250,
      description: "Fresh flower centerpiece arrangement",
      status: "Active",
      icon: "🌸",
    },
    {
      id: 7,
      name: "Stage Spotlight",
      category: "Lighting",
      price: 800,
      description: "Professional stage spotlight with adjustable beam",
      status: "Inactive",
      icon: "💡",
    },
    {
      id: 8,
      name: "Garden Chair - Rattan",
      category: "Chairs",
      price: 180,
      description: "Natural rattan garden chair for outdoor events",
      status: "Active",
      icon: "🪑",
    },
  ];

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setAssets(mockAssets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    if (assetName.trim() && assetCategory && assetPrice) {
      const newAsset = {
        id: Math.max(...assets.map(a => a.id), 0) + 1,
        name: assetName,
        category: assetCategory,
        price: parseInt(assetPrice),
        description: description,
        status: assetStatus,
        icon: "🪑",
      };
      setAssets([...assets, newAsset]);
      resetAddModal();
      setShowAddModal(false);
    }
  };

  const resetAddModal = () => {
    setAssetName("");
    setAssetCategory("");
    setAssetPrice("");
    setDescription("");
    setAssetStatus("Active");
    setAssetFile("");
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setEditAssetName(asset.name);
    setEditAssetCategory(asset.category);
    setEditAssetPrice(asset.price.toString());
    setEditDescription(asset.description);
    setEditAssetStatus(asset.status);
    setShowEditModal(true);
  };

  const handleSaveEditAsset = () => {
    if (editAssetName.trim() && editingAsset) {
      setAssets(
        assets.map((a) =>
          a.id === editingAsset.id
            ? {
                ...a,
                name: editAssetName,
                category: editAssetCategory,
                price: parseInt(editAssetPrice),
                description: editDescription,
                status: editAssetStatus,
              }
            : a
        )
      );
      setShowEditModal(false);
      setEditingAsset(null);
    }
  };

  const handleToggleStatus = (assetId: number) => {
    setAssets(
      assets.map((a) =>
        a.id === assetId ? { ...a, status: a.status === "Active" ? "Inactive" : "Active" } : a
      )
    );
  };

  const handleDeleteAsset = (assetId: number) => {
    setAssets(assets.filter((a) => a.id !== assetId));
  };

  const getPriceRange = (price: number): string => {
    if (price <= 200) return "₱0 - ₱200";
    if (price <= 500) return "₱201 - ₱500";
    if (price <= 1000) return "₱501 - ₱1000";
    return "₱1000+";
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchText.toLowerCase()) ||
      a.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || a.category === categoryFilter;
    const matchesPrice = priceFilter === "All Prices" || getPriceRange(a.price) === priceFilter;
    const matchesStatus = statusFilter === "All Status" || a.status === statusFilter;
    return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading assets...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Assets Management</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage individual assets with pricing and details</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Asset</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by asset name..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            >
              <Text style={[styles.filterButtonText, { color: theme.text }]}>{categoryFilter}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {categoryDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 999 }]}>
                {["All Categories", ...categoryOptions].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategoryFilter(cat);
                      setCategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setPriceDropdownOpen(!priceDropdownOpen)}
            >
              <Text style={[styles.filterButtonText, { color: theme.text }]}>{priceFilter}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {priceDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 998 }]}>
                {["All Prices", ...priceRanges].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPriceFilter(price);
                      setPriceDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <Text style={[styles.filterButtonText, { color: theme.text }]}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {statusDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 997 }]}>
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

          {/* Assets Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.4 }]}>Icon</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Asset Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Category</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.6 }]}>Price</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Description</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.0 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredAssets.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No assets found</Text>
              </View>
            ) : (
              filteredAssets.map((asset) => (
                <View key={asset.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Icon */}
                  <View style={{ flex: 0.4, justifyContent: "center", alignItems: "center" }}>
                    <Text style={styles.assetIcon}>{asset.icon}</Text>
                  </View>

                  {/* Asset Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2, fontWeight: "500" }]}>
                    {asset.name}
                  </Text>

                  {/* Category */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.8 }]}>
                    {asset.category}
                  </Text>

                  {/* Price */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.6, fontWeight: "500" }]}>
                    ₱{asset.price}
                  </Text>

                  {/* Description */}
                  <Text
                    style={[styles.cellText, { color: theme.textSecondary, flex: 1.2 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {asset.description}
                  </Text>

                  {/* Status - Now with Toggle Button */}
                  <View style={{ flex: 1.0, justifyContent: "center", alignItems: "flex-start" }}>
                    <View style={[styles.statusBadge, { flexDirection: 'row', gap: 6, backgroundColor: asset.status === "Active" ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={asset.status === "Active"}
                        onValueChange={() => handleToggleStatus(asset.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                      />
                      <Text style={[styles.statusText, { color: asset.status === "Active" ? Palette.green : theme.textSecondary }]}>
                        {asset.status}
                      </Text>
                    </View>
                  </View>

                  {/* Actions - Toggle Button Removed */}
                  <View style={[styles.actionsColumn, { flex: 0.8 }]}>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Ionicons name="eye" size={16} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditAsset(asset)}>
                      <Ionicons name="pencil" size={16} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteAsset(asset.id)}>
                      <Ionicons name="trash" size={16} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Asset Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Asset</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Add a new asset to your inventory</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Asset Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Metal Chair"
                    placeholderTextColor={theme.textSecondary}
                    value={assetName}
                    onChangeText={setAssetName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: assetCategory ? theme.text : theme.textSecondary }]}>
                      {assetCategory || "Select category"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Price (₱) *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    value={assetPrice}
                    onChangeText={setAssetPrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Brief details about the asset"
                    placeholderTextColor={theme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Upload Asset File</Text>
                  <TouchableOpacity style={[styles.fileButton, { borderColor: theme.border }]}>
                    <Ionicons name="download" size={18} color={theme.textSecondary} />
                    <Text style={[styles.fileButtonText, { color: theme.textSecondary }]}>Choose File</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: theme.text }]}>
                      {assetStatus}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
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
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                  onPress={handleAddAsset}
                >
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Asset</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Asset</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update asset details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Asset Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Metal Chair"
                    placeholderTextColor={theme.textSecondary}
                    value={editAssetName}
                    onChangeText={setEditAssetName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: editAssetCategory ? theme.text : theme.textSecondary }]}>
                      {editAssetCategory || "Select category"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Price (₱) *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    value={editAssetPrice}
                    onChangeText={setEditAssetPrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Brief details about the asset"
                    placeholderTextColor={theme.textSecondary}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
                  <TouchableOpacity style={[styles.formDropdown, { borderColor: theme.border }]}>
                    <Text style={[styles.dropdownPlaceholder, { color: theme.text }]}>
                      {editAssetStatus}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: Palette.primary }]}
                  onPress={handleSaveEditAsset}
                >
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
    flexWrap: "wrap",
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
    minWidth: 250,
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
    minWidth: 130,
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
  assetIcon: {
    fontSize: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionsColumn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    padding: 4,
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
  fileButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderStyle: "dashed",
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "500",
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
    minWidth: 120,
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});