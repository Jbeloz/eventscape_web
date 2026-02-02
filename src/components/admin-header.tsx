import { useState, useEffect } from 'react';
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, Image, Modal } from "react-native";
import { Palette } from "../../assets/colors/palette";
import { Fonts } from "../../assets/fonts/fonts";

interface AdminHeaderProps {
  onSidebarToggle: () => void;
}

// Mock data - replace with actual API calls
const MOCK_USER_DATA = {
  user_id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "admin@weekenderevents.com",
  user_role: "administrator",
  position: "System Administrator",
  profile_photo: null // This would come from user_photos table
};

export default function AdminHeader({ onSidebarToggle }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(MOCK_USER_DATA);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // In a real app, you would fetch this from your backend/API
      // Example API call to get user data with their photo
      // const response = await fetch('/api/admin/profile');
      // const data = await response.json();
      
      // This would be the actual data structure from your database
      // The API should JOIN users, administrators, and user_photos tables
      // Example SQL query:
      // SELECT u.first_name, u.last_name, u.user_role, u.email,
      //        a.position, up.file_url as profile_photo
      // FROM users u
      // LEFT JOIN administrators a ON u.user_id = a.user_id
      // LEFT JOIN user_photos up ON u.user_id = up.user_id AND up.is_primary = 1
      // WHERE u.user_id = ? AND u.user_role = 'administrator'
      
      // For now, using mock data
      setUserData(MOCK_USER_DATA);
      
      // If profile photo exists in user_photos table
      if (MOCK_USER_DATA.profile_photo) {
        setProfilePhoto(MOCK_USER_DATA.profile_photo);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logout clicked");
    setIsDropdownOpen(false);
    // Add logout API call and navigation
  };

  const handleProfile = () => {
    // Navigate to profile page
    console.log("My Profile clicked");
    setIsDropdownOpen(false);
    // navigation.navigate('AdminProfile');
  };

  const handleSettings = () => {
    // Navigate to settings page
    console.log("Settings clicked");
    setIsDropdownOpen(false);
    // navigation.navigate('Settings');
  };

  // Function to get initials for avatar
  const getInitials = () => {
    const { first_name, last_name } = userData;
    return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  };

  const fullName = `${userData.first_name} ${userData.last_name}`;
  const userPosition = userData.position;

  return (
    <View
      style={[
        styles.header,
        { 
          backgroundColor: Palette.white, 
          borderBottomColor: Palette.primary,
        },
      ]}
    >
      {/* Left side: Logo and App Name */}
      <TouchableOpacity
        style={styles.logoContainer}
        onPress={onSidebarToggle}
        activeOpacity={0.7}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require("../../assets/images/WeekenderEventLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>Weekender Events</Text>
          <Text style={styles.logoSubtitle}>Admin Portal</Text>
        </View>
      </TouchableOpacity>

      {/* Right side: User Profile with Dropdown */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.7}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {userPosition}
            </Text>
          </View>
          
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {profilePhoto ? (
                <Image 
                  source={{ uri: profilePhoto }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials()}
                </Text>
              )}
            </View>
            <Ionicons
              name={isDropdownOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={Palette.primary}
              style={styles.dropdownIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Dropdown Menu */}
        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.dropdownMenuContainer}>
              <View style={styles.dropdownMenu}>
                {/* Dropdown Header with User Info */}
                <View style={styles.dropdownHeader}>
                  <View style={styles.dropdownAvatar}>
                    {profilePhoto ? (
                      <Image 
                        source={{ uri: profilePhoto }} 
                        style={styles.dropdownAvatarImage}
                      />
                    ) : (
                      <Text style={styles.dropdownAvatarText}>
                        {getInitials()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.dropdownUserInfo}>
                    <Text style={styles.dropdownUserName}>{fullName}</Text>
                    <Text style={styles.dropdownUserRole}>{userPosition}</Text>
                    <Text style={styles.dropdownUserEmail}>{userData.email}</Text>
                  </View>
                </View>
                
                {/* Dropdown Items */}
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleProfile}
                >
                  <Ionicons name="person-outline" size={20} color={Palette.primary} />
                  <Text style={styles.dropdownItemText}>My Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleSettings}
                >
                  <Ionicons name="settings-outline" size={20} color={Palette.primary} />
                  <Text style={styles.dropdownItemText}>Settings</Text>
                </TouchableOpacity>
                
                <View style={styles.dropdownDivider} />
                
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.logoutItem]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#dc3545" />
                  <Text style={[styles.dropdownItemText, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  
  // Left side styles
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoTextContainer: {
    flexDirection: "column",
  },
  logoText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#000000',
    lineHeight: 22,
  },
  logoSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#FFD700',
    marginTop: -2,
  },
  
  // Right side styles
  rightSection: {
    position: 'relative',
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profileInfo: {
    justifyContent: "center",
    alignItems: 'flex-end',
    maxWidth: 140,
  },
  profileName: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Palette.primary,
  },
  profileRole: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Palette.gray700,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Palette.white,
  },
  dropdownIcon: {
    marginLeft: 2,
  },
  
  // Dropdown styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 65,
    paddingRight: 15,
  },
  dropdownMenuContainer: {
    backgroundColor: Palette.white,
    borderRadius: 10,
    minWidth: 260,
    elevation: 6,
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownMenu: {
    paddingVertical: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 6,
    gap: 10,
  },
  dropdownAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e3f2fd',
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  dropdownAvatarImage: {
    width: '100%',
    height: '100%',
  },
  dropdownAvatarText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Palette.primary,
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownUserName: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Palette.primary,
    marginBottom: 2,
  },
  dropdownUserRole: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Palette.primary,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  dropdownUserEmail: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Palette.gray700,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dropdownItemText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Palette.black,
    flex: 1,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 6,
    marginHorizontal: 14,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 2,
    paddingTop: 14,
  },
  logoutText: {
    color: '#dc3545',
    fontFamily: Fonts.medium,
  },
});