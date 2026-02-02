import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";

const SIDEBAR_WIDTH = 280;

interface AdminSidebarProps {
  isDarkMode: boolean;
  isOpen: boolean;
}

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  route?: string | null;
  hasDropdown?: boolean;
  submenu?: { label: string; route: string }[];
}

export default function AdminSidebar({ isDarkMode, isOpen }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = isDarkMode ? Palette.dark : Palette.light;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { label: "Home", icon: "home", route: "/administrator_pages/admin_home" },
    { label: "Account Management", icon: "account-multiple", route: "/administrator_pages/account_management" },
    { 
      label: "Venue Management", 
      icon: "home-city", 
      route: "/administrator_pages/venue_management/all_venues",
      hasDropdown: true,
      submenu: [
        { label: "All Venues", route: "/administrator_pages/venue_management/all_venues" },
        { label: "Venue Types", route: "/administrator_pages/venue_management/venue_types" },
      ]
    },
    { 
      label: "Theme Management", 
      icon: "folder-multiple", 
      route: "/administrator_pages/theme_management/theme_management",
      hasDropdown: true,
      submenu: [
        { label: "Theme Management", route: "/administrator_pages/theme_management/theme_management" },
        { label: "Category Management", route: "/administrator_pages/theme_management/category_management" },
        { label: "Decorations", route: "/administrator_pages/theme_management/decorations" },
        { label: "Lighting", route: "/administrator_pages/theme_management/lighting" },
        
      ]
    },
    { 
      label: "Event Package Management", 
      icon: "gift", 
      route: "/administrator_pages/event_package_management/event_package",
      hasDropdown: true,
      submenu: [
        { label: "Event Package", route: "/administrator_pages/event_package_management/event_package" },
        { label: "Package Type", route: "/administrator_pages/event_package_management/package_type" },
      ]
    },
    { 
      label: "Service Management", 
      icon: "tools", 
      route: "/administrator_pages/service_management/services",
      hasDropdown: true,
      submenu: [
        { label: "Services", route: "/administrator_pages/service_management/services" },
        { label: "Service Category", route: "/administrator_pages/service_management/service_category" },
      ]
    },
    { 
      label: "Add Ons Management", 
      icon: "plus-circle-multiple", 
      route: "/administrator_pages/addons_management/addons",
      hasDropdown: true,
      submenu: [
        { label: "Add Ons", route: "/administrator_pages/addons_management/addons" },
        { label: "Add Ons Category", route: "/administrator_pages/addons_management/addons_category" },
      ]
    },
    { 
      label: "Assets Management", 
      icon: "file-cabinet", 
      route: "/administrator_pages/asset_management/all_assets",
      hasDropdown: true,
      submenu: [
        { label: "All Assets", route: "/administrator_pages/asset_management/all_assets" },
        { label: "Asset Categories", route: "/administrator_pages/asset_management/asset_categories" },
      ]
    },
    { label: "Event Scheduling", icon: "calendar", route: null },
    { label: "My Projects", icon: "briefcase", route: null },
    { label: "Reviews & Feedback", icon: "star", route: null },
    { label: "Reports & Analytics", icon: "chart-line", route: null },
    { label: "Profile", icon: "account", route: null },
    { label: "System Maintenance", icon: "wrench", route: null },
  ];

  // Auto-expand parent menu when on a submenu route
  const getInitialExpandedItem = () => {
    for (const item of navItems) {
      if (item.submenu) {
        // For Venue Management
        if (item.label === "Venue Management") {
          const venueRoutes = [
            "/administrator_pages/venue_management/all_venues",
            "/administrator_pages/venue_management/venue_types",
            "/administrator_pages/venue_management/add_venue",
            "/administrator_pages/venue_management/edit_venue",
          ];
          if (venueRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.label === "Theme Management") {
          const categoryRoutes = [
            "/administrator_pages/theme_management/theme_management",
            "/administrator_pages/theme_management/category_management",
            "/administrator_pages/theme_management/decorations",
            "/administrator_pages/theme_management/lighting",
          ];
          if (categoryRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.label === "Event Package Management") {
          const packageRoutes = [
            "/administrator_pages/event_package_management/event_package",
            "/administrator_pages/event_package_management/package_type",
          ];
          if (packageRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.label === "Service Management") {
          const serviceRoutes = [
            "/administrator_pages/service_management/services",
            "/administrator_pages/service_management/service_category",
          ];
          if (serviceRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.label === "Add Ons Management") {
          const addonsRoutes = [
            "/administrator_pages/addons_management/addons",
            "/administrator_pages/addons_management/addons_category",
          ];
          if (addonsRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.label === "Assets Management") {
          const assetRoutes = [
            "/administrator_pages/asset_management/all_assets",
            "/administrator_pages/asset_management/asset_categories",
          ];
          if (assetRoutes.some(route => pathname === route)) {
            return item.label;
          }
        } else if (item.submenu.some(sub => pathname === sub.route)) {
          return item.label;
        }
      }
    }
    return null;
  };

  // Update expanded state when pathname changes
  useEffect(() => {
    setExpandedItem(getInitialExpandedItem());
  }, [pathname]);

  const isActive = (route: string | null | undefined) => {
    if (!route) return false;
    return pathname === route;
  };

  const isSubmenuActive = (item: NavItem) => {
    if (!item.submenu) return false;
    
    // For Venue Management, also check if we're on add_venue or edit_venue pages
    if (item.label === "Venue Management") {
      const venueRoutes = [
        "/administrator_pages/venue_management/all_venues",
        "/administrator_pages/venue_management/venue_types",
        "/administrator_pages/venue_management/add_venue",
        "/administrator_pages/venue_management/edit_venue",
      ];
      return venueRoutes.some(route => pathname === route);
    }
    
    // For Theme Management
    if (item.label === "Theme Management") {
      const categoryRoutes = [
        "/administrator_pages/theme_management/theme_management",
        "/administrator_pages/theme_management/category_management",
        "/administrator_pages/theme_management/decorations",
        "/administrator_pages/theme_management/lighting",
      ];
      return categoryRoutes.some(route => pathname === route);
    }
    
    // For Event Package Management
    if (item.label === "Event Package Management") {
      const packageRoutes = [
        "/administrator_pages/event_package_management/event_package",
        "/administrator_pages/event_package_management/package_type",
      ];
      return packageRoutes.some(route => pathname === route);
    }
    
    // For Service Management
    if (item.label === "Service Management") {
      const serviceRoutes = [
        "/administrator_pages/service_management/services",
        "/administrator_pages/service_management/service_category",
      ];
      return serviceRoutes.some(route => pathname === route);
    }
    
    // For Add Ons Management
    if (item.label === "Add Ons Management") {
      const addonsRoutes = [
        "/administrator_pages/addons_management/addons",
        "/administrator_pages/addons_management/addons_category",
      ];
      return addonsRoutes.some(route => pathname === route);
    }
    
    // For Assets Management
    if (item.label === "Assets Management") {
      const assetRoutes = [
        "/administrator_pages/asset_management/all_assets",
        "/administrator_pages/asset_management/asset_categories",
      ];
      return assetRoutes.some(route => pathname === route);
    }
    
    return item.submenu.some(sub => pathname === sub.route);
  };

  if (!isOpen) return null;

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.sidebar, borderRightColor: Palette.primary }]}>
      <View style={styles.sidebarHeader}>
        <Text style={[styles.logo, { color: isDarkMode ? Palette.primary : Palette.black }]}>
          EventScape
        </Text>
      </View>

      <ScrollView style={styles.navList}>
        {navItems.map((item, index) => {
          const isItemActive = isActive(item.route);
          const isItemSubmenuActive = isSubmenuActive(item);
          const isExpanded = expandedItem === item.label;
          
          return (
            <View key={index}>
              <TouchableOpacity
                style={[
                  styles.navItem,
                  (isItemActive || isItemSubmenuActive) && [styles.navItemActive, { backgroundColor: Palette.primary }],
                ]}
                onPress={() => {
                  if (item.hasDropdown) {
                    // Toggle the dropdown
                    setExpandedItem(isExpanded ? null : item.label);
                    // Only navigate if not already on this page
                    if (item.route && pathname !== item.route) {
                      router.push(item.route as any);
                    }
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color={(isItemActive || isItemSubmenuActive) ? Palette.black : theme.textSecondary}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { color: (isItemActive || isItemSubmenuActive) ? Palette.black : theme.textSecondary },
                    (isItemActive || isItemSubmenuActive) && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.hasDropdown && (
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-down" : "chevron-right"}
                    size={16}
                    color={(isItemActive || isItemSubmenuActive) ? Palette.black : theme.textSecondary}
                    style={styles.dropdownArrow}
                  />
                )}
              </TouchableOpacity>

              {/* Submenu Items */}
              {item.hasDropdown && item.submenu && isExpanded && (
                <View style={[styles.submenu, { backgroundColor: isDarkMode ? Palette.dark.bg : "#f5f5f5" }]}>
                  {item.submenu.map((subitem, subindex) => {
                    let isSubitemActive = isActive(subitem.route);
                    
                    // For Venue Management, highlight "All Venues" when on add_venue or edit_venue
                    if (item.label === "Venue Management" && subitem.label === "All Venues") {
                      const venueRoutes = [
                        "/administrator_pages/venue_management/all_venues",
                        "/administrator_pages/venue_management/add_venue",
                        "/administrator_pages/venue_management/edit_venue",
                      ];
                      isSubitemActive = venueRoutes.some(route => pathname === route);
                    }
                    
                    return (
                      <TouchableOpacity
                        key={subindex}
                        style={[
                          styles.submenuItem,
                          isSubitemActive && [styles.submenuItemActive, { backgroundColor: Palette.primary + "30" }],
                        ]}
                        onPress={() => router.push(subitem.route as any)}
                      >
                        <View style={[styles.submenuDot, { backgroundColor: isSubitemActive ? Palette.primary : theme.textSecondary }]} />
                        <Text
                          style={[
                            styles.submenuLabel,
                            { color: isSubitemActive ? Palette.primary : theme.textSecondary },
                            isSubitemActive && styles.submenuLabelActive,
                          ]}
                        >
                          {subitem.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: isDarkMode ? Palette.primary : Palette.black }]}
        onPress={() => router.push("/auth")}
      >
        <MaterialCommunityIcons
          name="logout"
          size={20}
          color={isDarkMode ? Palette.black : Palette.white}
          style={styles.navIcon}
        />
        <Text style={[styles.logoutText, { color: isDarkMode ? Palette.black : Palette.white }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    paddingVertical: 20,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  navList: {
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  navItemActive: {},
  navIcon: {
    marginRight: 12,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
  },
  navLabelActive: {
    fontWeight: "600",
  },
  dropdownArrow: {
    marginLeft: 8,
  },
  submenu: {
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 4,
  },
  submenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 2,
    borderRadius: 6,
  },
  submenuItemActive: {},
  submenuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  submenuLabel: {
    fontSize: 13,
    flex: 1,
  },
  submenuLabelActive: {
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
});
