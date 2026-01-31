import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import StyledDropdown from "../../../components/styled-dropdown";
import ThumbnailUpload from "../../../components/thumbnail-upload";
import { useTheme } from "../../../context/theme-context";
import { supabase } from "../../../services/supabase";

export default function ThemeManagement() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomedImageUri, setZoomedImageUri] = useState("");
  const [imageZoomSource, setImageZoomSource] = useState<"details" | "edit" | "add">("details");
  const [editingTheme, setEditingTheme] = useState<any>(null);
  const [viewingTheme, setViewingTheme] = useState<any>(null);

  // Add Theme Modal State
  const [themeName, setThemeName] = useState("");
  const [description, setDescription] = useState("");
  const [addColors, setAddColors] = useState<string[]>(["#6C9BCF"]); // [mainColor, secondaryColor?, ...accentColors]
  const [newAddColor, setNewAddColor] = useState("");
  const [thumbnailUri, setThumbnailUri] = useState("");
  const [selectedDecoration, setSelectedDecoration] = useState<string | number>("");
  const [selectedLighting, setSelectedLighting] = useState<string | number>("");
  const [selectedCategory, setSelectedCategory] = useState<string | number>("");
  const [decorationDropdownOpen, setDecorationDropdownOpen] = useState(false);
  const [lightingDropdownOpen, setLightingDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Edit Theme Modal State
  const [editThemeName, setEditThemeName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editThumbnailUri, setEditThumbnailUri] = useState("");
  const [editSelectedDecoration, setEditSelectedDecoration] = useState<string | number>("");
  const [editSelectedLighting, setEditSelectedLighting] = useState<string | number>("");
  const [editSelectedCategory, setEditSelectedCategory] = useState<string | number>("");
  const [editDecorationDropdownOpen, setEditDecorationDropdownOpen] = useState(false);
  const [editLightingDropdownOpen, setEditLightingDropdownOpen] = useState(false);
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] = useState(false);

  const [themes, setThemes] = useState<any[]>([]);
  const [decorationStyles, setDecorationStyles] = useState<any[]>([]);
  const [lightingStyles, setLightingStyles] = useState<any[]>([]);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  const fetchDecorationStyles = async () => {
    try {
      const { data, error: err } = await supabase
        .from("decoration_styles")
        .select("decoration_style_id, style_name")
        .order("style_name", { ascending: true });

      if (err) throw err;
      setDecorationStyles(data || []);
    } catch (err: any) {
      console.error("Error fetching decoration styles:", err.message);
    }
  };

  const fetchLightingStyles = async () => {
    try {
      const { data, error: err } = await supabase
        .from("lighting_styles")
        .select("lighting_style_id, style_name")
        .order("style_name", { ascending: true });

      if (err) throw err;
      setLightingStyles(data || []);
    } catch (err: any) {
      console.error("Error fetching lighting styles:", err.message);
    }
  };

  const fetchEventCategories = async () => {
    try {
      const { data, error: err } = await supabase
        .from("event_categories")
        .select("category_id, category_name")
        .order("category_name", { ascending: true });

      if (err) throw err;
      setEventCategories(data || []);
    } catch (err: any) {
      console.error("Error fetching event categories:", err.message);
    }
  };

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("event_themes")
        .select(
          `*,
          event_theme_images(image_path, is_thumbnail),
          event_theme_accent_colors(color_value)`
        )
        .order("created_at", { ascending: false });

      if (err) throw err;

      const formattedThemes = data?.map((t: any) => {
        const thumbnail = t.event_theme_images?.find((img: any) => img.is_thumbnail)?.image_path ||
                         t.event_theme_images?.[0]?.image_path ||
                         "https://via.placeholder.com/100x100?text=Theme";
        const accentColorsList = t.event_theme_accent_colors?.map((ac: any) => ac.color_value) || [];
        
        // Construct colors array: [mainColor, secondaryColor?, ...accentColors]
        const colors = [t.primary_color || "#000000"];
        if (t.secondary_color) {
          colors.push(t.secondary_color);
        }
        colors.push(...accentColorsList);

        return {
          id: t.event_theme_id,
          name: t.theme_name,
          category: "General",
          type: "Custom",
          status: t.is_active ? "Active" : "Inactive",
          createdDate: t.created_at ? t.created_at.split("T")[0] : "",
          thumbnail: thumbnail,
          images: t.event_theme_images || [],
          colors: colors,
          mainColor: t.primary_color || "#000000",
          secondaryColor: t.secondary_color || "#000000",
          accentColors: accentColorsList,
          description: t.theme_description,
        };
      }) || [];

      setThemes(formattedThemes);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", "Failed to load themes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get decoration style name from ID
  const getDecorationName = (decorationId: string | number) => {
    if (!decorationId) return "";
    const style = decorationStyles.find((s) => s.decoration_style_id == decorationId);
    return style?.style_name || "";
  };

  // Helper function to get lighting style name from ID
  const getLightingName = (lightingId: string | number) => {
    if (!lightingId) return "";
    const style = lightingStyles.find((s) => s.lighting_style_id == lightingId);
    return style?.style_name || "";
  };

  // Helper function to get category name from ID
  const getCategoryName = (categoryId: string | number) => {
    if (!categoryId) return "";
    const category = eventCategories.find((c) => c.category_id == categoryId);
    return category?.category_name || "";
  };

  useEffect(() => {
    fetchDecorationStyles();
    fetchLightingStyles();
    fetchEventCategories();
    fetchThemes();
  }, []);

  const handleAddTheme = async () => {
    if (themeName.trim()) {
      try {
        const mainColor = addColors[0];
        const secondaryColor = addColors.length > 1 ? addColors[1] : null;
        const accentColors = addColors.slice(2);

        const { data, error: err } = await supabase
          .from("event_themes")
          .insert([
            {
              theme_name: themeName,
              theme_description: description,
              primary_color: mainColor,
              secondary_color: secondaryColor,
              is_active: true,
            },
          ])
          .select();

        if (err) throw err;

        const newTheme = data[0];

        // Insert thumbnail if provided
        if (thumbnailUri && newTheme?.event_theme_id) {
          const { error: imageErr } = await supabase
            .from("event_theme_images")
            .insert([
              {
                event_theme_id: newTheme.event_theme_id,
                image_path: thumbnailUri,
                is_thumbnail: true,
              },
            ]);

          if (imageErr) throw imageErr;
        }

        // Insert accent colors if provided
        if (accentColors.length > 0 && newTheme?.event_theme_id) {
          const accentColorsData = accentColors.map((color) => ({
            event_theme_id: newTheme.event_theme_id,
            color_value: color,
          }));

          const { error: accentErr } = await supabase
            .from("event_theme_accent_colors")
            .insert(accentColorsData);

          if (accentErr) throw accentErr;
        }

        // Insert decoration style if selected
        if (selectedDecoration && newTheme?.event_theme_id) {
          const { error: decorErr } = await supabase
            .from("event_theme_decorations")
            .insert([
              {
                event_theme_id: newTheme.event_theme_id,
                decoration_style_id: selectedDecoration,
              },
            ]);

          if (decorErr) throw decorErr;
        }

        // Insert lighting style if selected
        if (selectedLighting && newTheme?.event_theme_id) {
          const { error: lightErr } = await supabase
            .from("event_theme_lighting")
            .insert([
              {
                event_theme_id: newTheme.event_theme_id,
                lighting_style_id: selectedLighting,
              },
            ]);

          if (lightErr) throw lightErr;
        }

        // Insert category if selected
        if (selectedCategory && newTheme?.event_theme_id) {
          const { error: catErr } = await supabase
            .from("event_theme_categories")
            .insert([
              {
                event_theme_id: newTheme.event_theme_id,
                category_id: selectedCategory,
              },
            ]);

          if (catErr) throw catErr;
        }

        Alert.alert("Success", "Theme added successfully");
        resetAddModal();
        setShowAddModal(false);
        await fetchThemes();
      } catch (err: any) {
        Alert.alert("Error", "Failed to add theme: " + err.message);
      }
    } else {
      Alert.alert("Error", "Please fill in theme name");
    }
  };

  const resetAddModal = () => {
    setThemeName("");
    setDescription("");
    setAddColors(["#6C9BCF"]);
    setNewAddColor("");
    setThumbnailUri("");
    setSelectedDecoration("");
    setSelectedLighting("");
    setSelectedCategory("");
    setDecorationDropdownOpen(false);
    setLightingDropdownOpen(false);
    setCategoryDropdownOpen(false);
  };

  const handleAddAccentColor = () => {
    if (newAddColor.trim()) {
      setAddColors([...addColors, newAddColor]);
      setNewAddColor("");
    }
  };

  const handleRemoveAddColor = (index: number) => {
    const newColors = addColors.filter((_, i) => i !== index);
    // If we removed the secondary color (index 1) and there are accent colors, promote first accent to secondary
    if (index === 1 && newColors.length > 1) {
      const mainColor = newColors[0];
      const newSecondary = newColors[2]; // What was the first accent
      const restAccents = newColors.slice(3);
      setAddColors([mainColor, newSecondary, ...restAccents]);
    } else {
      setAddColors(newColors);
    }
  };

  const handleRemoveEditColor = (index: number) => {
    const newColors = editColors.filter((_, i) => i !== index);
    // If we removed the secondary color (index 1) and there are accent colors, promote first accent to secondary
    if (index === 1 && newColors.length > 1) {
      const mainColor = newColors[0];
      const newSecondary = newColors[2]; // What was the first accent
      const restAccents = newColors.slice(3);
      setEditColors([mainColor, newSecondary, ...restAccents]);
    } else {
      setEditColors(newColors);
    }
  };

  const handleEditTheme = (themeItem: any) => {
    setEditingTheme(themeItem);
    setEditThemeName(themeItem.name);
    setEditDescription(themeItem.description);
    setEditColors(themeItem.colors || ["#000000"]);
    setEditThumbnailUri(themeItem.thumbnail || "");
    setEditSelectedDecoration("");
    setEditSelectedLighting("");
    setEditSelectedCategory("");
    setEditDecorationDropdownOpen(false);
    setEditLightingDropdownOpen(false);
    setEditCategoryDropdownOpen(false);
    setShowEditModal(true);
  };

  const handleViewTheme = (themeItem: any) => {
    setViewingTheme(themeItem);
    setShowDetailsModal(true);
  };

  const handleOpenImageZoom = (imageUri: string, source: "details" | "edit" | "add") => {
    setZoomedImageUri(imageUri);
    setImageZoomSource(source);
    setShowImageZoom(true);
  };

  const handleCloseImageZoom = () => {
    setShowImageZoom(false);
    setZoomedImageUri("");
  };

  const handleSaveEditTheme = async () => {
    if (editThemeName.trim() && editingTheme) {
      try {
        const mainColor = editColors[0];
        const secondaryColor = editColors.length > 1 ? editColors[1] : null;
        const accentColors = editColors.slice(2);

        const { error: err } = await supabase
          .from("event_themes")
          .update({
            theme_name: editThemeName,
            theme_description: editDescription,
            primary_color: mainColor,
            secondary_color: secondaryColor,
            is_active: editingTheme.status === "Active",
          })
          .eq("event_theme_id", editingTheme.id);

        if (err) throw err;

        // Update thumbnail if changed
        if (editThumbnailUri && editThumbnailUri !== editingTheme.thumbnail) {
          // Delete old images first
          const { error: deleteImgErr } = await supabase
            .from("event_theme_images")
            .delete()
            .eq("event_theme_id", editingTheme.id);

          if (deleteImgErr) throw deleteImgErr;

          // Insert new thumbnail
          const { error: imageErr } = await supabase
            .from("event_theme_images")
            .insert([
              {
                event_theme_id: editingTheme.id,
                image_path: editThumbnailUri,
                is_thumbnail: true,
              },
            ]);

          if (imageErr) throw imageErr;
        }

        // Delete existing accent colors
        const { error: deleteErr } = await supabase
          .from("event_theme_accent_colors")
          .delete()
          .eq("event_theme_id", editingTheme.id);

        if (deleteErr) throw deleteErr;

        // Insert updated accent colors
        if (accentColors.length > 0) {
          const accentColorsData = accentColors.map((color) => ({
            event_theme_id: editingTheme.id,
            color_value: color,
          }));

          const { error: accentErr } = await supabase
            .from("event_theme_accent_colors")
            .insert(accentColorsData);

          if (accentErr) throw accentErr;
        }

        // Delete existing decorations and update
        const { error: deleteDecoErr } = await supabase
          .from("event_theme_decorations")
          .delete()
          .eq("event_theme_id", editingTheme.id);

        if (deleteDecoErr) throw deleteDecoErr;

        // Insert updated decoration style if selected
        if (editSelectedDecoration) {
          const { error: decorErr } = await supabase
            .from("event_theme_decorations")
            .insert([
              {
                event_theme_id: editingTheme.id,
                decoration_style_id: editSelectedDecoration,
              },
            ]);

          if (decorErr) throw decorErr;
        }

        // Delete existing lighting and update
        const { error: deleteLightErr } = await supabase
          .from("event_theme_lighting")
          .delete()
          .eq("event_theme_id", editingTheme.id);

        if (deleteLightErr) throw deleteLightErr;

        // Insert updated lighting style if selected
        if (editSelectedLighting) {
          const { error: lightErr } = await supabase
            .from("event_theme_lighting")
            .insert([
              {
                event_theme_id: editingTheme.id,
                lighting_style_id: editSelectedLighting,
              },
            ]);

          if (lightErr) throw lightErr;
        }

        // Delete existing categories and update
        const { error: deleteCatErr } = await supabase
          .from("event_theme_categories")
          .delete()
          .eq("event_theme_id", editingTheme.id);

        if (deleteCatErr) throw deleteCatErr;

        // Insert updated category if selected
        if (editSelectedCategory) {
          const { error: catErr } = await supabase
            .from("event_theme_categories")
            .insert([
              {
                event_theme_id: editingTheme.id,
                category_id: editSelectedCategory,
              },
            ]);

          if (catErr) throw catErr;
        }

        Alert.alert("Success", "Theme updated successfully");
        setShowEditModal(false);
        setEditingTheme(null);
        await fetchThemes();
      } catch (err: any) {
        Alert.alert("Error", "Failed to update theme: " + err.message);
      }
    }
  };

  const handleToggleStatus = async (themeId: number) => {
    try {
      const theme = themes.find(t => t.id === themeId);
      if (!theme) return;

      const { error: err } = await supabase
        .from("event_themes")
        .update({ is_active: theme.status === "Inactive" })
        .eq("event_theme_id", themeId);

      if (err) throw err;

      await fetchThemes();
    } catch (err: any) {
      Alert.alert("Error", "Failed to update theme status: " + err.message);
    }
  };

  const handleDeleteTheme = (themeId: number) => {
    Alert.alert(
      "Delete Theme",
      "Are you sure you want to delete this theme?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const { error: err } = await supabase
                .from("event_themes")
                .delete()
                .eq("event_theme_id", themeId);

              if (err) throw err;

              Alert.alert("Success", "Theme deleted successfully");
              await fetchThemes();
            } catch (err: any) {
              Alert.alert("Error", "Failed to delete theme: " + err.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const filteredThemes = themes.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchText.toLowerCase()) ||
      t.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={styles.mainContainer}>
          <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />
          <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading themes...</Text>
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
              <Text style={[styles.pageTitle, { color: theme.text }]}>Theme Management</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage event themes and visual styles</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Theme</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by theme name..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* Themes Table */}
          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.6 }]}>Thumbnail</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Theme Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Event Category</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Theme Type</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.7 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Created Date</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredThemes.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No themes found</Text>
              </View>
            ) : (
              filteredThemes.map((themeItem) => (
                <View key={themeItem.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  {/* Thumbnail */}
                  <View style={{ flex: 0.6, justifyContent: "center" }}>
                    <Image source={{ uri: themeItem.thumbnail }} style={styles.thumbnail} />
                  </View>

                  {/* Theme Name */}
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.2, fontWeight: "500" }]}>
                    {themeItem.name}
                  </Text>

                  {/* Category */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1 }]}>
                    {themeItem.category}
                  </Text>

                  {/* Theme Type */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>
                    {themeItem.type}
                  </Text>

                  {/* Status */}
                  <View style={{ flex: 0.7, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: themeItem.status === "Active" ? "#28a74520" : theme.lightBg }]}>
                      <Switch
                        value={themeItem.status === "Active"}
                        onValueChange={() => handleToggleStatus(themeItem.id)}
                        trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                      />
                      <Text style={[styles.statusText, { color: themeItem.status === "Active" ? Palette.green : theme.textSecondary }]}>
                        {themeItem.status}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>
                    {themeItem.createdDate}
                  </Text>

                  {/* Actions */}
                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleViewTheme(themeItem)}>
                      <Ionicons name="eye" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditTheme(themeItem)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteTheme(themeItem.id)}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Theme Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Theme</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create a new event theme</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Basic Theme Information */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Theme Information</Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Theme Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter theme name"
                    placeholderTextColor={theme.textSecondary}
                    value={themeName}
                    onChangeText={setThemeName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter theme description"
                    placeholderTextColor={theme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Color Palette */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Color Palette</Text>

                {addColors.map((color, index) => (
                  <View key={index} style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      {index === 0 ? "Main Color *" : index === 1 ? "Secondary Color" : `Accent Color ${index - 1}`}
                    </Text>
                    <View style={styles.colorPickerRow}>
                      <View style={[styles.colorPreview, { backgroundColor: color }]} />
                      <TextInput
                        style={[styles.formInput, { color: theme.text, borderColor: theme.border, flex: 1, marginHorizontal: 12 }]}
                        placeholder="#6C9BCF"
                        placeholderTextColor={theme.textSecondary}
                        value={color}
                        onChangeText={(newColor) => {
                          const updatedColors = [...addColors];
                          updatedColors[index] = newColor;
                          setAddColors(updatedColors);
                        }}
                      />
                      {index > 0 && (
                        <TouchableOpacity onPress={() => handleRemoveAddColor(index)}>
                          <Ionicons name="close" size={20} color={Palette.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.formGroup}>
                  <View style={styles.colorPickerRow}>
                    <View style={[styles.colorPreview, { backgroundColor: newAddColor || theme.lightBg }]} />
                    <TextInput
                      style={[styles.formInput, { color: theme.text, borderColor: theme.border, flex: 1, marginHorizontal: 12 }]}
                      placeholder="#E8F0F9"
                      placeholderTextColor={theme.textSecondary}
                      value={newAddColor}
                      onChangeText={setNewAddColor}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.addAccentButton, { borderColor: Palette.primary }]}
                    onPress={handleAddAccentColor}
                  >
                    <Ionicons name="add" size={18} color={Palette.primary} />
                    <Text style={{ color: Palette.primary, marginLeft: 4, fontWeight: "600" }}>
                      Add {addColors.length === 1 ? "Secondary Color" : "Accent Color"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Decoration Style Dropdown */}
                <StyledDropdown
                  label="Decoration Style"
                  placeholder="Select decoration style"
                  options={decorationStyles.map((s) => ({ id: s.decoration_style_id, name: s.style_name }))}
                  selectedValue={selectedDecoration}
                  onSelect={setSelectedDecoration}
                  theme={theme}
                  isOpen={decorationDropdownOpen}
                  onToggle={setDecorationDropdownOpen}
                />

                {/* Lighting Style Dropdown */}
                <StyledDropdown
                  label="Lighting Style"
                  placeholder="Select lighting style"
                  options={lightingStyles.map((s) => ({ id: s.lighting_style_id, name: s.style_name }))}
                  selectedValue={selectedLighting}
                  onSelect={setSelectedLighting}
                  theme={theme}
                  isOpen={lightingDropdownOpen}
                  onToggle={setLightingDropdownOpen}
                />

                {/* Category Dropdown */}
                <StyledDropdown
                  label="Category"
                  placeholder="Select category"
                  options={eventCategories.map((c) => ({ id: c.category_id, name: c.category_name }))}
                  selectedValue={selectedCategory}
                  onSelect={setSelectedCategory}
                  theme={theme}
                  isOpen={categoryDropdownOpen}
                  onToggle={setCategoryDropdownOpen}
                />

                {/* Thumbnail Upload */}
                <ThumbnailUpload
                  label="Theme Thumbnail"
                  thumbnailUri={thumbnailUri}
                  onThumbnailChange={setThumbnailUri}
                  onImageZoom={(uri) => handleOpenImageZoom(uri, "add")}
                  theme={theme}
                />
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
                  onPress={handleAddTheme}
                >
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Theme Modal (Similar structure to Add) */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Theme</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update theme details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Theme Information</Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Theme Name *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter theme name"
                    placeholderTextColor={theme.textSecondary}
                    value={editThemeName}
                    onChangeText={setEditThemeName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter theme description"
                    placeholderTextColor={theme.textSecondary}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Color Palette</Text>

                {editColors.map((color, index) => (
                  <View key={index} style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      {index === 0 ? "Main Color *" : index === 1 ? "Secondary Color" : `Accent Color ${index - 1}`}
                    </Text>
                    <View style={styles.colorPickerRow}>
                      <View style={[styles.colorPreview, { backgroundColor: color }]} />
                      <TextInput
                        style={[styles.formInput, { color: theme.text, borderColor: theme.border, flex: 1, marginHorizontal: 12 }]}
                        placeholder="#6C9BCF"
                        placeholderTextColor={theme.textSecondary}
                        value={color}
                        onChangeText={(newColor) => {
                          const updatedColors = [...editColors];
                          updatedColors[index] = newColor;
                          setEditColors(updatedColors);
                        }}
                      />
                      {index > 0 && (
                        <TouchableOpacity onPress={() => handleRemoveEditColor(index)}>
                          <Ionicons name="close" size={20} color={Palette.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                {/* Decoration Style Dropdown */}
                <StyledDropdown
                  label="Decoration Style"
                  placeholder="Select decoration style"
                  options={decorationStyles.map((s) => ({ id: s.decoration_style_id, name: s.style_name }))}
                  selectedValue={editSelectedDecoration}
                  onSelect={setEditSelectedDecoration}
                  theme={theme}
                  isOpen={editDecorationDropdownOpen}
                  onToggle={setEditDecorationDropdownOpen}
                />

                {/* Lighting Style Dropdown */}
                <StyledDropdown
                  label="Lighting Style"
                  placeholder="Select lighting style"
                  options={lightingStyles.map((s) => ({ id: s.lighting_style_id, name: s.style_name }))}
                  selectedValue={editSelectedLighting}
                  onSelect={setEditSelectedLighting}
                  theme={theme}
                  isOpen={editLightingDropdownOpen}
                  onToggle={setEditLightingDropdownOpen}
                />

                {/* Category Dropdown */}
                <StyledDropdown
                  label="Category"
                  placeholder="Select category"
                  options={eventCategories.map((c) => ({ id: c.category_id, name: c.category_name }))}
                  selectedValue={editSelectedCategory}
                  onSelect={setEditSelectedCategory}
                  theme={theme}
                  isOpen={editCategoryDropdownOpen}
                  onToggle={setEditCategoryDropdownOpen}
                />

                {/* Thumbnail Upload */}
                <ThumbnailUpload
                  label="Theme Thumbnail"
                  thumbnailUri={editThumbnailUri}
                  onThumbnailChange={setEditThumbnailUri}
                  onImageZoom={(uri) => handleOpenImageZoom(uri, "edit")}
                  theme={theme}
                />
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
                  onPress={handleSaveEditTheme}
                >
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Theme Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="fade" onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Theme Details</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>View theme information</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Thumbnail */}
                {viewingTheme?.thumbnail && (
                  <View style={styles.thumbnailSection}>
                    <TouchableOpacity onPress={() => handleOpenImageZoom(viewingTheme?.thumbnail, "details")} style={{ width: "100%" }}>
                      <Image source={{ uri: viewingTheme?.thumbnail }} style={styles.detailsThumbnail} resizeMode="contain" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Theme Name */}
                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Theme Name</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{viewingTheme?.name}</Text>
                </View>

                {/* Description */}
                {viewingTheme?.description && (
                  <View style={styles.detailGroup}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{viewingTheme?.description}</Text>
                  </View>
                )}

                {/* Status */}
                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: viewingTheme?.status === "Active" ? "#28a74520" : theme.lightBg, width: "auto" }]}>
                    <Text style={[styles.statusText, { color: viewingTheme?.status === "Active" ? Palette.green : theme.textSecondary }]}>
                      {viewingTheme?.status}
                    </Text>
                  </View>
                </View>

                {/* Created Date */}
                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Created Date</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{viewingTheme?.createdDate}</Text>
                </View>

                {/* Color Palette */}
                <View style={styles.detailGroup}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Color Palette</Text>
                  <View style={styles.colorPaletteContainer}>
                    {viewingTheme?.colors?.map((color: string, index: number) => (
                      <View key={index} style={styles.colorItem}>
                        <View style={[styles.colorPreview, { backgroundColor: color }]} />
                        <Text style={[styles.colorLabel, { color: theme.text }]}>
                          {index === 0 ? "Main" : index === 1 ? "Secondary" : `Accent ${index - 1}`}
                        </Text>
                        <Text style={[styles.colorValue, { color: theme.textSecondary }]}>{color}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Category and Type */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={[styles.detailGroup, { flex: 1 }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{viewingTheme?.category}</Text>
                  </View>
                  <View style={[styles.detailGroup, { flex: 1 }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{viewingTheme?.type}</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: Palette.primary, flex: 1 }]}
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleEditTheme(viewingTheme);
                  }}
                >
                  <Ionicons name="pencil" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Edit Theme</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal visible={showImageZoom} transparent animationType="fade" onRequestClose={handleCloseImageZoom}>
        <View style={[styles.imageZoomContainer, { backgroundColor: "rgba(0, 0, 0, 0.95)" }]}>
          <TouchableOpacity style={styles.imageZoomOverlay} activeOpacity={1} onPress={handleCloseImageZoom}>
            <View style={styles.imageZoomContent}>
              <Image source={{ uri: zoomedImageUri }} style={styles.zoomedImage} resizeMode="contain" />
            </View>
          </TouchableOpacity>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeImageButton} onPress={handleCloseImageZoom}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
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
    minWidth: 140,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  actionsColumn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
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
    width: "70%",
    maxHeight: "85%",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
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
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorPreview: {
    width: 50,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  addAccentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
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
  detailsThumbnail: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailGroup: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  colorPaletteContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorItem: {
    alignItems: "center",
    flex: 0.3,
    minWidth: 80,
  },
  colorLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  colorValue: {
    fontSize: 11,
    marginTop: 4,
  },
  imageZoomContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageZoomOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageZoomContent: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: "100%",
    height: "100%",
  },
  closeImageButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailSection: {
    marginBottom: 16,
  },
});

