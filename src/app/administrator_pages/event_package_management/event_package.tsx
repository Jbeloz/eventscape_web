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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");

  // add/edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formExcessPaxPrice, setFormExcessPaxPrice] = useState<string>("0.00");
  const [formIsActive, setFormIsActive] = useState(true);

  const [formPaxPrices, setFormPaxPrices] = useState<Array<{ pax_count: number; price: string }>>([]);
  const [formServiceIds, setFormServiceIds] = useState<number[]>([]);

  const [editingPkg, setEditingPkg] = useState<any | null>(null);

  const theme = isDarkMode ? Palette.dark : Palette.light;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [typesRes, servicesRes] = await Promise.all([
        supabase.from("package_types").select("*").order("package_type_id", { ascending: true }),
        supabase.from("services").select("*").order("service_id", { ascending: true }),
      ]);
      if (typesRes.error) throw typesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      setPackageTypes((typesRes.data || []).map((t: any) => ({ id: t.package_type_id, name: t.type_name })));
      setServices((servicesRes.data || []).map((s: any) => ({ id: s.service_id, name: s.service_name, category_id: s.category_id })));

      await fetchPackages();
    } catch (err: any) {
      console.error("fetchAllData error", err);
      setError(err.message || "Failed to load data");
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: pkgError } = await supabase
        .from("event_packages")
        .select("*")
        .order("package_id", { ascending: true });
      if (pkgError) throw pkgError;

      const pkgIds = (data || []).map((p: any) => p.package_id);

      const [{ data: paxData, error: paxError }, { data: svcAssocData, error: svcAssocError }] = await Promise.all([
        supabase.from("package_pax_prices").select("*").in("package_id", pkgIds),
        supabase.from("package_services").select("*").in("package_id", pkgIds),
      ]);

      if (paxError) throw paxError;
      if (svcAssocError) throw svcAssocError;

      const svcIds = (svcAssocData || []).map((ps: any) => ps.service_id);
      const { data: svcData, error: svcError } = await supabase.from("services").select("*").in("service_id", svcIds);
      if (svcError) throw svcError;

      const servicesById: Record<number, any> = {};
      (svcData || []).forEach((s: any) => (servicesById[s.service_id] = s));

      const paxByPackage: Record<number, any[]> = {};
      (paxData || []).forEach((pp: any) => {
        paxByPackage[pp.package_id] = paxByPackage[pp.package_id] || [];
        paxByPackage[pp.package_id].push({ pax_count: pp.pax_count, price: pp.price });
      });

      const svcByPackage: Record<number, any[]> = {};
      (svcAssocData || []).forEach((ps: any) => {
        svcByPackage[ps.package_id] = svcByPackage[ps.package_id] || [];
        if (servicesById[ps.service_id]) svcByPackage[ps.package_id].push(servicesById[ps.service_id]);
      });

      const mapped = (data || []).map((p: any) => ({
        id: p.package_id,
        package_type_id: p.package_type_id,
        package_name: p.package_name,
        description: p.description,
        excess_pax_price: p.excess_pax_price,
        is_active: p.is_active,
        pax_prices: paxByPackage[p.package_id] || [],
        services: svcByPackage[p.package_id] || [],
        created_at: p.created_at ? p.created_at.split("T")[0] : null,
        updated_at: p.updated_at ? p.updated_at.split("T")[0] : null,
      }));

      setPackages(mapped);
    } catch (err: any) {
      console.error("fetchPackages error", err);
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTypeId(null);
    setFormName("");
    setFormDescription("");
    setFormExcessPaxPrice("0.00");
    setFormIsActive(true);
    setFormPaxPrices([]);
    setFormServiceIds([]);
  };

  const openAdd = () => {
    resetForm();
    setEditingPkg(null);
    setShowAddModal(true);
  };

  const openEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setFormTypeId(pkg.package_type_id);
    setFormName(pkg.package_name);
    setFormDescription(pkg.description);
    setFormExcessPaxPrice(String(pkg.excess_pax_price ?? "0.00"));
    setFormIsActive(!!pkg.is_active);
    setFormPaxPrices((pkg.pax_prices || []).map((pp: any) => ({ pax_count: pp.pax_count, price: String(pp.price) })));
    setFormServiceIds((pkg.services || []).map((s: any) => s.service_id));
    setShowEditModal(true);
  };

  const validateForm = () => {
    if (!formTypeId) return "Package type is required.";
    if (!formName.trim()) return "Package name is required.";
    const excess = parseFloat(formExcessPaxPrice) || 0;
    if (excess < 0) return "Excess pax price must be >= 0.";
    for (const pp of formPaxPrices) {
      if (!Number.isInteger(pp.pax_count) || pp.pax_count <= 0) return "Pax count must be a positive integer.";
      if (parseFloat(pp.price) < 0) return "Pax price must be >= 0.";
    }
    return null;
  };

  const handleAdd = async () => {
    const err = validateForm();
    if (err) return setError(err);
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from("event_packages")
        .insert([
          {
            package_type_id: formTypeId,
            package_name: formName.trim(),
            description: formDescription || "",
            excess_pax_price: parseFloat(formExcessPaxPrice) || 0,
            is_active: formIsActive,
          },
        ])
        .select();
      if (insertError) throw insertError;
      const pkgId = data && data[0] && data[0].package_id;

      if (pkgId) {
        // insert pax prices
        if (formPaxPrices.length) {
          const toInsert = formPaxPrices.map((pp) => ({ package_id: pkgId, pax_count: pp.pax_count, price: parseFloat(pp.price) || 0 }));
          const { error: paxError } = await supabase.from("package_pax_prices").insert(toInsert);
          if (paxError) throw paxError;
        }
        // insert package services
        if (formServiceIds.length) {
          const toInsert = formServiceIds.map((sid) => ({ package_id: pkgId, service_id: sid }));
          const { error: psError } = await supabase.from("package_services").insert(toInsert);
          if (psError) throw psError;
        }
      }

      await fetchPackages();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error("add package error", err);
      setError(err.message || "Failed to add package");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPkg) return;
    const err = validateForm();
    if (err) return setError(err);

    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from("event_packages")
        .update({
          package_type_id: formTypeId,
          package_name: formName.trim(),
          description: formDescription || "",
          excess_pax_price: parseFloat(formExcessPaxPrice) || 0,
          is_active: formIsActive,
        })
        .eq("package_id", editingPkg.id)
        .select();
      if (updateError) throw updateError;

      // replace pax prices (simple approach)
      const { error: delPaxError } = await supabase.from("package_pax_prices").delete().eq("package_id", editingPkg.id);
      if (delPaxError) throw delPaxError;
      if (formPaxPrices.length) {
        const toInsert = formPaxPrices.map((pp) => ({ package_id: editingPkg.id, pax_count: pp.pax_count, price: parseFloat(pp.price) || 0 }));
        const { error: paxError } = await supabase.from("package_pax_prices").insert(toInsert);
        if (paxError) throw paxError;
      }

      // replace package services
      const { error: delPsError } = await supabase.from("package_services").delete().eq("package_id", editingPkg.id);
      if (delPsError) throw delPsError;
      if (formServiceIds.length) {
        const toInsert = formServiceIds.map((sid) => ({ package_id: editingPkg.id, service_id: sid }));
        const { error: psError } = await supabase.from("package_services").insert(toInsert);
        if (psError) throw psError;
      }

      await fetchPackages();
      setShowEditModal(false);
      setEditingPkg(null);
      resetForm();
    } catch (err: any) {
      console.error("update package error", err);
      setError(err.message || "Failed to update package");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Package", "Are you sure you want to delete this package?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      // delete dependent rows then package
      const [{ error: delPaxErr }, { error: delPsErr }, { error: delPkgErr }] = await Promise.all([
        supabase.from("package_pax_prices").delete().eq("package_id", id),
        supabase.from("package_services").delete().eq("package_id", id),
        supabase.from("event_packages").delete().eq("package_id", id),
      ]);
      if (delPaxErr) throw delPaxErr;
      if (delPsErr) throw delPsErr;
      if (delPkgErr) throw delPkgErr;

      setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("delete package error", err);
      setError(err.message || "Failed to delete package");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const target = packages.find((p) => p.id === id);
      if (!target) return;
      const newStatus = !target.is_active;
      const { data, error: toggleError } = await supabase
        .from("event_packages")
        .update({ is_active: newStatus })
        .eq("package_id", id)
        .select();
      if (toggleError) throw toggleError;
      if (data && data[0]) {
        setPackages((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_active: data[0].is_active,
                  updated_at: data[0].updated_at ? data[0].updated_at.split("T")[0] : p.updated_at,
                }
              : p
          )
        );
      } else {
        await fetchPackages();
      }
    } catch (err: any) {
      console.error("toggle package error", err);
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const addPaxPriceRow = () => setFormPaxPrices((prev) => [...prev, { pax_count: 1, price: "0.00" }]);
  const removePaxPriceRow = (index: number) => setFormPaxPrices((prev) => prev.filter((_, i) => i !== index));
  const updatePaxRow = (index: number, field: "pax_count" | "price", value: any) =>
    setFormPaxPrices((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: field === "pax_count" ? parseInt(value || 0, 10) : value } : r)));

  const toggleServiceSelection = (id: number) =>
    setFormServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filtered = packages.filter((p) => p.package_name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
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
      <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          <View style={styles.titleSection}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.text }]}>Event Packages</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage packages, pax prices and services</Text>
            </View>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: Palette.primary }]} onPress={openAdd}>
              <Ionicons name="add" size={20} color={Palette.black} />
              <Text style={styles.createButtonText}>Add Package</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: Palette.red, backgroundColor: isDarkMode ? "#3f1f1f" : "#ffefef" }]}> 
              <Text style={{ color: Palette.red, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.filterSection, { zIndex: 100 }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search packages..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.6 }]}>Package Name</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1.2 }]}>Type</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 1 }]}>Services</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Excess Pax Price</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.8 }]}>Status</Text>
              <Text style={[styles.columnHeader, { color: theme.text, flex: 0.9 }]}>Actions</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="search" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No packages found</Text>
              </View>
            ) : (
              filtered.map((p) => (
                <View key={p.id} style={[styles.tableRow, { borderColor: theme.border }]}>
                  <Text style={[styles.cellText, { color: theme.text, flex: 1.6, fontWeight: "500" }]}>{p.package_name}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1.2 }]}>{packageTypes.find(t => t.id === p.package_type_id)?.name || "-"}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{(p.services || []).map((s:any)=>s.name).join(", ")}</Text>
                  <Text style={[styles.cellText, { color: theme.textSecondary, flex: 0.9 }]}>{p.excess_pax_price}</Text>
                  <View style={{ flex: 0.8, justifyContent: "center" }}>
                    <View style={[styles.statusBadge, { backgroundColor: p.is_active ? "#28a74520" : theme.lightBg }]}>
                      <Switch value={!!p.is_active} onValueChange={() => handleToggle(p.id)} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                      <Text style={[styles.statusText, { color: p.is_active ? Palette.green : theme.textSecondary }]}>{p.is_active ? "Active" : "Inactive"}</Text>
                    </View>
                  </View>
                  <View style={[styles.actionsColumn, { flex: 0.9 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => openEdit(p)}>
                      <Ionicons name="pencil" size={18} color={Palette.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => confirmDelete(p.id)}>
                      <Ionicons name="trash" size={18} color={Palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Event Package</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Create new package and define pax prices & services</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Package Type *</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                      {packageTypes.map((pt) => (
                        <TouchableOpacity key={pt.id} onPress={() => setFormTypeId(pt.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: formTypeId === pt.id ? Palette.primary : 'transparent', borderRadius: 8, marginRight: 8 }}>
                          <Text style={{ color: formTypeId === pt.id ? Palette.black : theme.text }}>{pt.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Package Name *</Text>
                  <TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.border }]} placeholder="Enter package name" placeholderTextColor={theme.textSecondary} value={formName} onChangeText={setFormName} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]} placeholder="Enter description" placeholderTextColor={theme.textSecondary} value={formDescription} onChangeText={setFormDescription} multiline numberOfLines={4} textAlignVertical="top" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Excess Pax Price</Text>
                  <TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.border }]} placeholder="0.00" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={formExcessPaxPrice} onChangeText={setFormExcessPaxPrice} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Pax Prices</Text>
                  {formPaxPrices.map((pp, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput style={[styles.formInput, { flex: 1, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={String(pp.pax_count)} onChangeText={(v) => updatePaxRow(idx, 'pax_count', v)} />
                      <TextInput style={[styles.formInput, { flex: 1, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={pp.price} onChangeText={(v) => updatePaxRow(idx, 'price', v)} />
                      <TouchableOpacity onPress={() => removePaxPriceRow(idx)} style={{ padding: 8 }}>
                        <Ionicons name="trash" size={18} color={Palette.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity onPress={addPaxPriceRow} style={{ marginTop: 8 }}>
                    <Text style={{ color: Palette.primary }}>+ Add Pax Price</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Services (select multiple)</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {services.map((s) => (
                        <TouchableOpacity key={s.id} onPress={() => toggleServiceSelection(s.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: formServiceIds.includes(s.id) ? Palette.primary : 'transparent', borderRadius: 8 }}>
                          <Text style={{ color: formServiceIds.includes(s.id) ? Palette.black : theme.text }}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={formIsActive} onValueChange={setFormIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{formIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleAdd}>
                  <Ionicons name="checkmark" size={18} color={Palette.black} />
                  <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Event Package</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Update package and its details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Package Type *</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                      {packageTypes.map((pt) => (
                        <TouchableOpacity key={pt.id} onPress={() => setFormTypeId(pt.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: formTypeId === pt.id ? Palette.primary : 'transparent', borderRadius: 8, marginRight: 8 }}>
                          <Text style={{ color: formTypeId === pt.id ? Palette.black : theme.text }}>{pt.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Package Name *</Text>
                  <TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.border }]} placeholder="Enter package name" placeholderTextColor={theme.textSecondary} value={formName} onChangeText={setFormName} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                  <TextInput style={[styles.formInput, styles.formTextarea, { color: theme.text, borderColor: theme.border }]} placeholder="Enter description" placeholderTextColor={theme.textSecondary} value={formDescription} onChangeText={setFormDescription} multiline numberOfLines={4} textAlignVertical="top" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Excess Pax Price</Text>
                  <TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.border }]} placeholder="0.00" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={formExcessPaxPrice} onChangeText={setFormExcessPaxPrice} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Pax Prices</Text>
                  {formPaxPrices.map((pp, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput style={[styles.formInput, { flex: 1, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={String(pp.pax_count)} onChangeText={(v) => updatePaxRow(idx, 'pax_count', v)} />
                      <TextInput style={[styles.formInput, { flex: 1, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={pp.price} onChangeText={(v) => updatePaxRow(idx, 'price', v)} />
                      <TouchableOpacity onPress={() => removePaxPriceRow(idx)} style={{ padding: 8 }}>
                        <Ionicons name="trash" size={18} color={Palette.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity onPress={addPaxPriceRow} style={{ marginTop: 8 }}>
                    <Text style={{ color: Palette.primary }}>+ Add Pax Price</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Services (select multiple)</Text>
                  <View style={[styles.formDropdown, { borderColor: theme.border }]}> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {services.map((s) => (
                        <TouchableOpacity key={s.id} onPress={() => toggleServiceSelection(s.id)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: formServiceIds.includes(s.id) ? Palette.primary : 'transparent', borderRadius: 8 }}>
                          <Text style={{ color: formServiceIds.includes(s.id) ? Palette.black : theme.text }}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Active</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Switch value={formIsActive} onValueChange={setFormIsActive} trackColor={{ false: theme.textSecondary, true: Palette.primary }} />
                    <Text style={[styles.formLabel, { color: theme.text }]}>{formIsActive ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: Palette.primary }]} onPress={handleSaveEdit}>
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
  container: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, padding: 16 },
  titleSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  createButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  createButtonText: { color: Palette.black, fontSize: 14, fontWeight: "600" },
  filterSection: { flexDirection: "row", gap: 12, marginBottom: 24, alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 8, flex: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  tableContainer: { borderRadius: 8, overflow: "hidden", borderWidth: 1, marginBottom: 24 },
  tableHeader: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center" },
  columnHeader: { fontWeight: "600", fontSize: 12 },
  tableRow: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center", gap: 8 },
  cellText: { fontSize: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "500", marginLeft: 6 },
  actionsColumn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 },
  actionIcon: { padding: 6 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyContainer: { padding: 48, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 14, marginTop: 12 },
  errorBox: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { borderRadius: 12, width: "90%", maxHeight: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalScroll: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0, 0, 0, 0.1)" },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  modalSubtitle: { fontSize: 14 },
  modalBody: { paddingHorizontal: 24, paddingVertical: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  formInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  formTextarea: { minHeight: 100, textAlignVertical: "top" },
  formDropdown: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 40, gap: 8, overflow: 'hidden' },
  modalFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(0, 0, 0, 0.1)", justifyContent: "flex-end" },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 100, alignItems: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "500" },
  saveButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 100, justifyContent: "center" },
  saveButtonText: { fontSize: 14, fontWeight: "600" },
});
