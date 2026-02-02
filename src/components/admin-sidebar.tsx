import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Palette } from "../../assets/colors/palette";
import { Fonts } from "../../assets/fonts/fonts";

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 70;

interface AdminSidebarProps {
  isDarkMode: boolean;
  isOpen: boolean;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

interface NavItem {
  label: string;
  icon: string;
  route?: string | null;
  hasDropdown?: boolean;
  submenu?: { label: string; route: string }[];
}

export default function AdminSidebar({ 
  isDarkMode, 
  isOpen, 
  onToggleCollapse, 
  isCollapsed = false 
}: AdminSidebarProps) {
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
      route: "/administrator_pages/add_ons_management/add_ons",
      hasDropdown: true,
      submenu: [
        { label: "Add Ons", route: "/administrator_pages/add_ons_management/add_ons" },
        { label: "Add Ons Category", route: "/administrator_pages/add_ons_management/add_ons_category" },
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
    { label: "System Maintenance", icon: "wrench", route: null },
  ];

  // Auto-expand parent menu when on a submenu route
  const getInitialExpandedItem = () => {
    if (isCollapsed) return null;
    
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
            "/administrator_pages/add_ons_management/add_ons",
            "/administrator_pages/add_ons_management/add_ons_category",
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
    if (!isCollapsed) {
      setExpandedItem(getInitialExpandedItem());
    }
  }, [pathname, isCollapsed]);

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
        "/administrator_pages/add_ons_management/add_ons",
        "/administrator_pages/add_ons_management/add_ons_category",
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
    <View style={[
      styles.sidebar, 
      { 
        backgroundColor: theme.sidebar, 
        borderRightColor: Palette.primary,
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
      }
    ]}>
      {/* Sidebar Header with Logo and Toggle Button side by side */}
      <View style={styles.sidebarHeader}>
        <View style={[
          styles.headerContent, 
          isCollapsed ? styles.headerContentCollapsed : styles.headerContentExpanded
        ]}>
          {/* Logo - Shows full "EventScape" when expanded, just "ES" when collapsed */}
          {!isCollapsed ? (
            <Text style={[
              styles.logo, 
              { 
                color: isDarkMode ? Palette.primary : Palette.black,
                fontFamily: Fonts.bold
              }
            ]}>
              EventScape
            </Text>
          ) : (
            <Text style={[
              styles.logoCollapsed, 
              { 
                color: isDarkMode ? Palette.primary : Palette.black,
                fontFamily: Fonts.bold
              }
            ]}>
              ES
            </Text>
          )}
          
          {/* Toggle Button */}
          {onToggleCollapse && (
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                isCollapsed ? styles.toggleButtonCollapsed : styles.toggleButtonExpanded
              ]}
              onPress={onToggleCollapse}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? "menu-right" : "menu-left"}
                size={24}
                color={isDarkMode ? Palette.primary : Palette.black}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {navItems.map((item, index) => {
          const isItemActive = isActive(item.route);
          const isItemSubmenuActive = isSubmenuActive(item);
          const isExpanded = expandedItem === item.label;
          
          if (isCollapsed) {
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.navItemCollapsed,
                  (isItemActive || isItemSubmenuActive) && [
                    styles.navItemActiveCollapsed, 
                    { backgroundColor: Palette.primary }
                  ],
                ]}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color={(isItemActive || isItemSubmenuActive) ? Palette.black : theme.textSecondary}
                />
                {(isItemActive || isItemSubmenuActive) && (
                  <View style={[styles.activeIndicator, { backgroundColor: Palette.primary }]} />
                )}
              </TouchableOpacity>
            );
          }
          
          return (
            <View key={index}>
              <TouchableOpacity
                style={[
                  styles.navItem,
                  (isItemActive || isItemSubmenuActive) && [
                    styles.navItemActive, 
                    { backgroundColor: Palette.primary }
                  ],
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
                    { 
                      color: (isItemActive || isItemSubmenuActive) ? Palette.black : theme.textSecondary,
                      fontFamily: Fonts.regular
                    },
                    (isItemActive || isItemSubmenuActive) && { fontFamily: Fonts.semibold },
                  ]}
                  numberOfLines={1}
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
                <View style={[
                  styles.submenu, 
                  { 
                    backgroundColor: isDarkMode ? 
                      `${Palette.primary}15` : // 15 = ~8% opacity in hex
                      `${Palette.primary}10`   // 10 = ~6% opacity
                  }
                ]}>
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
                          isSubitemActive && [
                            styles.submenuItemActive, 
                            { backgroundColor: Palette.primary + "30" }
                          ],
                        ]}
                        onPress={() => router.push(subitem.route as any)}
                      >
                        <View style={[
                          styles.submenuDot, 
                          { 
                            backgroundColor: isSubitemActive ? 
                              Palette.primary : 
                              theme.textSecondary + "80" // 80 = 50% opacity
                          }
                        ]} />
                        <Text
                          style={[
                            styles.submenuLabel,
                            { 
                              color: isSubitemActive ? 
                                Palette.primary : 
                                theme.textSecondary,
                              fontFamily: Fonts.regular
                            },
                            isSubitemActive && { fontFamily: Fonts.medium },
                          ]}
                          numberOfLines={1}
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

      {/* Logout Button */}
      <TouchableOpacity
        style={[
          styles.logoutButton, 
          { 
            backgroundColor: isDarkMode ? Palette.primary : Palette.black,
            flexDirection: isCollapsed ? "column" : "row"
          }
        ]}
        onPress={() => router.push("/auth")}
      >
        <MaterialCommunityIcons
          name="logout"
          size={20}
          color={isDarkMode ? Palette.black : Palette.white}
          style={isCollapsed ? null : styles.navIcon}
        />
        {!isCollapsed && (
          <Text style={[
            styles.logoutText, 
            { 
              color: isDarkMode ? Palette.black : Palette.white,
              fontFamily: Fonts.medium
            }
          ]}>
            Logout
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    paddingVertical: 16,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContentExpanded: {
    justifyContent: "space-between",
  },
  headerContentCollapsed: {
    justifyContent: "center",
    flexDirection: "column",
    gap: 12,
  },
  logo: {
    fontSize: 20,
  },
  logoCollapsed: {
    fontSize: 16,
    marginTop: 4,
  },
  toggleButton: {
    padding: 4,
    borderRadius: 4,
  },
  toggleButtonExpanded: {
    marginLeft: 8,
  },
  toggleButtonCollapsed: {
    marginTop: 8,
  },
  navList: {
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  navItemCollapsed: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    position: "relative",
  },
  navItemActive: {},
  navItemActiveCollapsed: {},
  activeIndicator: {
    position: "absolute",
    left: 0,
    width: 4,
    height: 24,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  navIcon: {
    marginRight: 12,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
  },
  dropdownArrow: {
    marginLeft: 8,
  },
  submenu: {
    marginLeft: 32,
    marginRight: 16,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  submenuLabel: {
    fontSize: 13,
    flex: 1,
  },
  submenuLabelActive: {},
  logoutButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
  },
});