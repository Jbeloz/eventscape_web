import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Palette } from '../../../../assets/colors/palette';
import AdminHeader from '../../../components/admin-header';
import AdminSidebar from '../../../components/admin-sidebar';
import { useTheme } from '../../../context/theme-context';

interface Door {
  id: string;
  type: string;
  width: string;
  height: string;
  offsetFromCorner: string;
  swingDirection: string;
  hingePosition: string;
}

interface PricingPackage {
  id: string;
  name: string;
  duration: string;
  price: string;
  inclusions: string;
}

export default function EditVenueNew() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = isDarkMode ? Palette.dark : Palette.light;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Info
  const [venueName, setVenueName] = useState('Grand Ballroom');
  const [venueType, setVenueType] = useState('Conference Hall');
  const [streetAddress, setStreetAddress] = useState('123 Business Street');
  const [barangay, setBarangay] = useState('Barangay Business');
  const [city, setCity] = useState('Manila');
  const [province, setProvince] = useState('Metro Manila');
  const [zipCode, setZipCode] = useState('1000');
  const [capacity, setCapacity] = useState('1500');
  const [showVenueTypeDropdown, setShowVenueTypeDropdown] = useState(false);

  // Step 2: Technical Specs
  const [length, setLength] = useState('60');
  const [width, setWidth] = useState('45');
  const [floorArea, setFloorArea] = useState('2700');
  const [ceilingHeight, setCeilingHeight] = useState('14');
  const [stageAvailable, setStageAvailable] = useState(true);
  const [acAvailable, setAcAvailable] = useState(true);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [handicappedAccess, setHandicappedAccess] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState(['Conference', 'Exhibition', 'Wedding']);
  const [floorPlanUrl, setFloorPlanUrl] = useState('https://via.placeholder.com/400x300?text=Floor+Plan');
  const [floorPlanInput, setFloorPlanInput] = useState('');
  const [doors, setDoors] = useState<Door[]>([
    {
      id: '1',
      type: 'Single Door',
      width: '1.0',
      height: '2.2',
      offsetFromCorner: '0.5',
      swingDirection: 'Inward',
      hingePosition: 'Left',
    },
    {
      id: '2',
      type: 'Double Door',
      width: '2.0',
      height: '2.2',
      offsetFromCorner: '5.0',
      swingDirection: 'Outward',
      hingePosition: 'Right',
    },
  ]);

  // Step 3: Media & Rules
  const [galleryImages, setGalleryImages] = useState([
    'https://via.placeholder.com/80x80?text=Img1',
    'https://via.placeholder.com/80x80?text=Img2',
    'https://via.placeholder.com/80x80?text=Img3',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const defaultFacilities = [
    'Wi-Fi',
    'Projector',
    'Sound System',
    'Parking',
    'Catering',
    'Kitchen',
    'Restrooms',
    'Wheelchair Access',
  ];
  const [selectedFacilities, setSelectedFacilities] = useState(['Wi-Fi', 'Projector', 'Sound System', 'Catering', 'Kitchen']);
  const [customFacilities, setCustomFacilities] = useState(['Private Bar', 'Valet Parking']);
  const [customFacilityInput, setCustomFacilityInput] = useState('');
  const [rules, setRules] = useState(
    'No outside catering. Maximum 2000 guests. Event must end by 11 PM. Security deposit required.'
  );

  // Step 4: Pricing & Contact
  const [hourlyRate, setHourlyRate] = useState('800');
  const [minimumHours, setMinimumHours] = useState('4');
  const [weekendRate, setWeekendRate] = useState('1200');
  const [holidayRate, setHolidayRate] = useState('1500');
  const [overtimeRate, setOvertimeRate] = useState('350');
  const [pricingNotes, setPricingNotes] = useState('Rates are per hour. Discounts available for bookings over 8 hours.');
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([
    {
      id: '1',
      name: 'Standard Package',
      duration: '4 Hours',
      price: '3200',
      inclusions: 'Basic tables, chairs, sound system, lighting',
    },
    {
      id: '2',
      name: 'Premium Package',
      duration: '8 Hours',
      price: '7200',
      inclusions: 'All standard + premium decoration, AV setup, dedicated coordinator',
    },
  ]);
  const [email, setEmail] = useState('info@grandballroom.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);

  // Helper Functions
  const calculateFloorArea = (newLength?: string, newWidth?: string) => {
    const l = parseFloat(newLength || length);
    const w = parseFloat(newWidth || width);
    if (!isNaN(l) && !isNaN(w)) {
      setFloorArea((l * w).toString());
    }
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((t) => t !== eventType) : [...prev, eventType]
    );
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const addCustomFacility = () => {
    if (customFacilityInput.trim()) {
      setCustomFacilities([...customFacilities, customFacilityInput.trim()]);
      setCustomFacilityInput('');
    }
  };

  const removeCustomFacility = (facility: string) => {
    setCustomFacilities(customFacilities.filter((f) => f !== facility));
  };

  const addGalleryImage = () => {
    if (imageUrlInput.trim() && galleryImages.length < 10) {
      setGalleryImages([...galleryImages, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const addDoor = () => {
    const newDoor: Door = {
      id: Date.now().toString(),
      type: 'Standard Door',
      width: '',
      height: '',
      offsetFromCorner: '',
      swingDirection: 'Inward',
      hingePosition: 'Left',
    };
    setDoors([...doors, newDoor]);
  };

  const updateDoor = (id: string, field: keyof Door, value: string) => {
    setDoors(doors.map((door) => (door.id === id ? { ...door, [field]: value } : door)));
  };

  const deleteDoor = (id: string) => {
    setDoors(doors.filter((door) => door.id !== id));
  };

  const addPricingPackage = () => {
    const newPackage: PricingPackage = {
      id: Date.now().toString(),
      name: '',
      duration: '',
      price: '',
      inclusions: '',
    };
    setPricingPackages([...pricingPackages, newPackage]);
  };

  const updatePackage = (id: string, field: keyof PricingPackage, value: string) => {
    setPricingPackages(
      pricingPackages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
  };

  const deletePackage = (id: string) => {
    setPricingPackages(pricingPackages.filter((pkg) => pkg.id !== id));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return venueName.trim() && venueType && streetAddress.trim() && city.trim() && province.trim() && zipCode.trim() && capacity.trim();
    }
    if (currentStep === 2) {
      return length.trim() && width.trim();
    }
    if (currentStep === 3) {
      return true;
    }
    return false;
  };

  const handleSaveChanges = () => {
    const allData = {
      step1: { venueName, venueType, streetAddress, barangay, city, province, zipCode, capacity },
      step2: {
        dimensions: { length, width, floorArea, ceilingHeight },
        specifications: { stageAvailable, acAvailable, parkingAvailable, handicappedAccess },
        eventTypes: selectedEventTypes,
        floorPlan: floorPlanUrl,
        doors,
      },
      step3: {
        gallery: galleryImages,
        facilities: selectedFacilities,
        customFacilities,
        rules,
      },
      step4: {
        rates: { hourlyRate, minimumHours, weekendRate, holidayRate, overtimeRate },
        notes: pricingNotes,
        packages: pricingPackages,
        contact: { email, phone },
      },
    };
    console.log('Saving venue changes:', allData);
    // API call would go here
  };

  const handleCancel = () => {
    router.back();
  };

  const eventTypeOptions = ['Conference', 'Wedding', 'Exhibition', 'Seminar', 'Workshop', 'Gala', 'Banquet', 'Private Event'];
  const venueTypesList = ['Conference Hall', 'Ballroom', 'Hotel Banquet', 'Restaurant', 'Event Center', 'Country Club', 'Museum'];

  // UI Render

  return (
    <View style={styles.container}>
      {/* Header */}
      <AdminHeader
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <View style={styles.mainContainer}>
        {/* Sidebar */}
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        {/* Main Content */}
        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Sticky Header */}
          <View style={[styles.headerSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowBackConfirmModal(true)}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Edit Venue: {venueName}</Text>
            <TouchableOpacity
              disabled={currentStep !== 4}
              style={[
                styles.button,
                { backgroundColor: currentStep === 4 ? Palette.primary : Palette.gray500 },
              ]}
              onPress={handleSaveChanges}
            >
              <Text style={[styles.buttonText, { color: Palette.black }]}>Update</Text>
            </TouchableOpacity>
          </View>

        {/* Header Section */}
        <View style={[styles.headerSection, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Edit Venue: {venueName}</Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Step {currentStep} of 4
            </Text>
          </View>
          {currentStep === 4 && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: Palette.primary }]}
              onPress={handleSaveChanges}
            >
              <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stepper Navigation */}
        <View style={[styles.stepperContainer, { backgroundColor: theme.card }]}>
          {[1, 2, 3, 4].map((step) => (
            <TouchableOpacity key={step} onPress={() => setCurrentStep(step)} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      step === currentStep
                        ? Palette.primary
                        : step < currentStep
                          ? Palette.primary
                          : theme.lightBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step <= currentStep ? Palette.black : theme.textSecondary },
                  ]}
                >
                  {step}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: step === currentStep ? Palette.primary : theme.textSecondary,
                    fontWeight: step === currentStep ? '600' : '400',
                  },
                ]}
              >
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Tech Specs'}
                {step === 3 && 'Media'}
                {step === 4 && 'Pricing'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Area */}
        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Basic Information</Text>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>Venue Name *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter venue name"
                  placeholderTextColor={theme.textSecondary}
                  value={venueName}
                  onChangeText={setVenueName}
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Venue Type *</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { borderColor: theme.border }]}
                  onPress={() => setShowVenueTypeDropdown(!showVenueTypeDropdown)}
                >
                  <Text style={[styles.dropdownText, { color: theme.text }]}>{venueType}</Text>
                  <Text style={{ color: theme.textSecondary }}>▼</Text>
                </TouchableOpacity>
                {showVenueTypeDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {venueTypesList.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.dropdownItem,
                          {
                            backgroundColor: venueType === type ? theme.lightBg : 'transparent',
                            borderBottomColor: theme.border,
                          },
                        ]}
                        onPress={() => {
                          setVenueType(type);
                          setShowVenueTypeDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: theme.text }]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Street Address *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter street address"
                  placeholderTextColor={theme.textSecondary}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Barangay</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter barangay"
                  placeholderTextColor={theme.textSecondary}
                  value={barangay}
                  onChangeText={setBarangay}
                />

                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>City *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter city"
                      placeholderTextColor={theme.textSecondary}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Province *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter province"
                      placeholderTextColor={theme.textSecondary}
                      value={province}
                      onChangeText={setProvince}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <View style={{ flex: 0.5 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Zip Code *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter zip code"
                      placeholderTextColor={theme.textSecondary}
                      value={zipCode}
                      onChangeText={setZipCode}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Country</Text>
                    <View style={[styles.input, { color: theme.text, borderColor: theme.border, justifyContent: "center" }]}>
                      <Text style={{ color: theme.text, fontSize: 14 }}>Philippines</Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Capacity *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter maximum capacity"
                  placeholderTextColor={theme.textSecondary}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Step 2: Technical Specs */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Technical Specifications</Text>

              {/* Dimensions Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dimensions & Area</Text>
                <View style={styles.dimensionsGrid}>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Length (m) *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={length}
                      onChangeText={(val) => {
                        setLength(val);
                        calculateFloorArea(val, width);
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Width (m) *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={width}
                      onChangeText={(val) => {
                        setWidth(val);
                        calculateFloorArea(length, val);
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Floor Area (m²)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.textSecondary, borderColor: theme.border, backgroundColor: theme.lightBg },
                      ]}
                      placeholder="Auto-calculated"
                      placeholderTextColor={theme.textSecondary}
                      value={floorArea}
                      editable={false}
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Ceiling Height (m)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={ceilingHeight}
                      onChangeText={setCeilingHeight}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Specifications Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Specifications</Text>
                <View style={styles.specificationGrid}>
                  <View style={styles.specRow}>
                    <Text style={[styles.label, { color: theme.text }]}>Stage Available</Text>
                    <Switch value={stageAvailable} onValueChange={setStageAvailable} />
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.label, { color: theme.text }]}>AC Available</Text>
                    <Switch value={acAvailable} onValueChange={setAcAvailable} />
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.label, { color: theme.text }]}>Parking Available</Text>
                    <Switch value={parkingAvailable} onValueChange={setParkingAvailable} />
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.label, { color: theme.text }]}>Handicapped Access</Text>
                    <Switch value={handicappedAccess} onValueChange={setHandicappedAccess} />
                  </View>
                </View>
              </View>

              {/* Event Types Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Allowed Event Types</Text>
                <View style={styles.chipGrid}>
                  {eventTypeOptions.map((eventType) => (
                    <TouchableOpacity
                      key={eventType}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedEventTypes.includes(eventType)
                            ? Palette.primary
                            : theme.lightBg,
                          borderColor: selectedEventTypes.includes(eventType)
                            ? Palette.primary
                            : theme.border,
                        },
                      ]}
                      onPress={() => toggleEventType(eventType)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: selectedEventTypes.includes(eventType) ? Palette.black : theme.text,
                            fontWeight: selectedEventTypes.includes(eventType) ? '600' : '400',
                          },
                        ]}
                      >
                        {eventType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Floor Plan Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Floor Plan</Text>
                {floorPlanUrl && (
                  <View>
                    <Image
                      source={{ uri: floorPlanUrl }}
                      style={styles.floorPlanThumbnail}
                    />
                    <View style={styles.floorPlanActions}>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: Palette.primary }]}
                        onPress={() => setFloorPlanUrl('')}
                      >
                        <Text style={[styles.buttonText, { color: Palette.black }]}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: Palette.red }]}
                        onPress={() => setFloorPlanUrl('')}
                      >
                        <Text style={[styles.buttonText, { color: Palette.white }]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View style={styles.uploadSection}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter floor plan image URL"
                    placeholderTextColor={theme.textSecondary}
                    value={floorPlanInput}
                    onChangeText={setFloorPlanInput}
                  />
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: Palette.primary, marginTop: 8 }]}
                    onPress={() => {
                      if (floorPlanInput.trim()) {
                        setFloorPlanUrl(floorPlanInput);
                        setFloorPlanInput('');
                      }
                    }}
                  >
                    <Text style={[styles.buttonText, { color: Palette.black }]}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Door Placement Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Door Placement</Text>
                {doors.map((door, index) => (
                  <View
                    key={door.id}
                    style={[
                      styles.doorCard,
                      { backgroundColor: theme.lightBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.doorHeader}>
                      <Text style={[styles.doorTitle, { color: theme.text }]}>Door {index + 1}</Text>
                      <TouchableOpacity onPress={() => deleteDoor(door.id)}>
                        <Text style={{ fontSize: 18, color: Palette.red }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.doorGrid}>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.type}
                          onChangeText={(val) => updateDoor(door.id, 'type', val)}
                        />
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Width (m)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.width}
                          onChangeText={(val) => updateDoor(door.id, 'width', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Height (m)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.height}
                          onChangeText={(val) => updateDoor(door.id, 'height', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Offset (m)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.offsetFromCorner}
                          onChangeText={(val) => updateDoor(door.id, 'offsetFromCorner', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Swing</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.swingDirection}
                          onChangeText={(val) => updateDoor(door.id, 'swingDirection', val)}
                        />
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Hinge</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          value={door.hingePosition}
                          onChangeText={(val) => updateDoor(door.id, 'hingePosition', val)}
                        />
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: Palette.primary }]}
                  onPress={addDoor}
                >
                  <Text style={{ color: Palette.primary, fontWeight: '600' }}>+ Add Door</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Media & Rules */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Media & Rules</Text>

              {/* Gallery Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Gallery / Assets Upload * ({galleryImages.length}/10)
                </Text>
                <View style={styles.thumbnailGrid}>
                  {galleryImages.map((image, index) => (
                    <View key={index} style={styles.thumbnailWrapper}>
                      <Image source={{ uri: image }} style={styles.thumbnail} />
                      <TouchableOpacity
                        style={styles.deleteOverlay}
                        onPress={() => removeGalleryImage(index)}
                      >
                        <Text style={styles.deleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                  disabled={galleryImages.length >= 10}
                >
                  <Ionicons name="cloud-upload" size={32} color={Palette.primary} />
                  <Text style={[styles.uploadButtonText, { color: theme.text }]}>Click to upload images</Text>
                  <Text style={[styles.uploadButtonSubtext, { color: theme.textSecondary }]}>or drag and drop (Max 10 images)</Text>
                </TouchableOpacity>
              </View>

              {/* Facilities Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Facilities / Inclusions</Text>

                <Text style={[styles.subsectionTitle, { color: theme.textSecondary, marginTop: 12 }]}>
                  Default Facilities
                </Text>
                <View style={styles.chipGrid}>
                  {defaultFacilities.map((facility) => (
                    <TouchableOpacity
                      key={facility}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedFacilities.includes(facility)
                            ? Palette.primary
                            : theme.lightBg,
                          borderColor: selectedFacilities.includes(facility)
                            ? Palette.primary
                            : theme.border,
                        },
                      ]}
                      onPress={() => toggleFacility(facility)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: selectedFacilities.includes(facility) ? Palette.black : theme.text,
                            fontWeight: selectedFacilities.includes(facility) ? '600' : '400',
                          },
                        ]}
                      >
                        {facility}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.subsectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>
                  Custom Facilities
                </Text>
                <View style={styles.chipGrid}>
                  {customFacilities.map((facility) => (
                    <View
                      key={facility}
                      style={[
                        styles.customChip,
                        { backgroundColor: Palette.primary, borderColor: Palette.primary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: Palette.black, marginRight: 4 }]}>
                        {facility}
                      </Text>
                      <TouchableOpacity onPress={() => removeCustomFacility(facility)}>
                        <Text style={{ color: Palette.black, fontWeight: 'bold' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.uploadSection}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Add custom facility"
                    placeholderTextColor={theme.textSecondary}
                    value={customFacilityInput}
                    onChangeText={setCustomFacilityInput}
                  />
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: Palette.primary, marginTop: 8 }]}
                    onPress={addCustomFacility}
                  >
                    <Text style={[styles.buttonText, { color: Palette.black }]}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rules Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Regulations</Text>
                <TextInput
                  style={[
                    styles.textarea,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Enter venue rules"
                  placeholderTextColor={theme.textSecondary}
                  value={rules}
                  onChangeText={setRules}
                  multiline
                  numberOfLines={6}
                />
              </View>
            </View>
          )}

          {/* Step 4: Pricing & Contact */}
          {currentStep === 4 && (
            <View style={styles.stepContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Pricing & Contact</Text>

              {/* Pricing Rates Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing Rates</Text>
                <View style={styles.pricingGrid}>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Hourly Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Min Hours</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={minimumHours}
                      onChangeText={setMinimumHours}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Weekend Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={weekendRate}
                      onChangeText={setWeekendRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Holiday Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={holidayRate}
                      onChangeText={setHolidayRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Overtime Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={overtimeRate}
                      onChangeText={setOvertimeRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Pricing Notes / Terms</Text>
                <TextInput
                  style={[
                    styles.textarea,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Enter pricing notes"
                  placeholderTextColor={theme.textSecondary}
                  value={pricingNotes}
                  onChangeText={setPricingNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Pricing Packages Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.packageHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing Packages</Text>
                  <TouchableOpacity
                    style={[styles.addPackageButton, { borderColor: Palette.primary }]}
                    onPress={addPricingPackage}
                  >
                    <Text style={{ color: Palette.primary, fontSize: 16, fontWeight: 'bold' }}>+</Text>
                  </TouchableOpacity>
                </View>

                {pricingPackages.map((pkg) => (
                  <View
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      { backgroundColor: theme.lightBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.packageCardHeader}>
                      <TextInput
                        style={[
                          styles.packageNameInput,
                          { color: theme.text, borderColor: theme.border },
                        ]}
                        placeholder="Package Name"
                        placeholderTextColor={theme.textSecondary}
                        value={pkg.name}
                        onChangeText={(val) => updatePackage(pkg.id, 'name', val)}
                      />
                      <TouchableOpacity onPress={() => deletePackage(pkg.id)}>
                        <Text style={{ fontSize: 18, color: Palette.red }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.packageGrid}>
                      <View style={styles.packageField}>
                        <Text style={[styles.label, { color: theme.text }]}>Duration</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          placeholder="e.g., 4 Hours"
                          placeholderTextColor={theme.textSecondary}
                          value={pkg.duration}
                          onChangeText={(val) => updatePackage(pkg.id, 'duration', val)}
                        />
                      </View>
                      <View style={styles.packageField}>
                        <Text style={[styles.label, { color: theme.text }]}>Price (₱)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary}
                          value={pkg.price}
                          onChangeText={(val) => updatePackage(pkg.id, 'price', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <Text style={[styles.label, { color: theme.text, marginTop: 8 }]}>Inclusions</Text>
                    <TextInput
                      style={[
                        styles.textarea,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="What's included in this package?"
                      placeholderTextColor={theme.textSecondary}
                      value={pkg.inclusions}
                      onChangeText={(val) => updatePackage(pkg.id, 'inclusions', val)}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                ))}
              </View>

              {/* Contact Information Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
                <View style={styles.contactGrid}>
                  <View style={styles.contactField}>
                    <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter email"
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                    />
                    {email && !validateEmail(email) && (
                      <Text style={{ color: Palette.red, fontSize: 12, marginTop: 4 }}>
                        Invalid email format
                      </Text>
                    )}
                  </View>
                  <View style={styles.contactField}>
                    <Text style={[styles.label, { color: theme.text }]}>Phone *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter phone number"
                      placeholderTextColor={theme.textSecondary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNavigation, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.navButtonGroup}>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  borderColor: theme.border,
                  opacity: currentStep === 1 ? 0.5 : 1,
                },
              ]}
              onPress={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <Text
                style={[
                  styles.navButtonText,
                  {
                    color: currentStep === 1 ? theme.textSecondary : theme.text,
                  },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            {currentStep < 4 ? (
              <TouchableOpacity
                style={[
                  styles.navButton,
                  {
                    backgroundColor: canProceedToNextStep() ? Palette.primary : theme.lightBg,
                    opacity: canProceedToNextStep() ? 1 : 0.5,
                  },
                ]}
                onPress={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    {
                      color: canProceedToNextStep() ? Palette.black : theme.textSecondary,
                    },
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: Palette.primary }]}
                onPress={handleSaveChanges}
              >
                <Text style={[styles.navButtonText, { color: Palette.black }]}>Update Venue</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </ScrollView>
      </View>

      {/* Back Confirmation Modal */}
      <Modal visible={showBackConfirmModal} transparent animationType="fade" onRequestClose={() => setShowBackConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Leave Page?</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to go back? Any unsaved changes will be lost.
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={() => setShowBackConfirmModal(false)}
              >
                <Text style={[styles.modalCancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: Palette.primary }]}
                onPress={() => {
                  setShowBackConfirmModal(false);
                  setTimeout(() => router.push('/administrator_pages/venue_management/all_venues'), 300);
                }}
              >
                <Text style={[styles.modalConfirmButtonText, { color: Palette.black }]}>Go Back</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dimensionField: {
    flex: 1,
    minWidth: '48%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  specificationGrid: {
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  floorPlanThumbnail: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  floorPlanActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  uploadSection: {
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  doorCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  doorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doorTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  doorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  doorField: {
    flex: 1,
    minWidth: '32%',
  },
  addButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: Palette.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  subsectionTitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceField: {
    flex: 1,
    minWidth: '48%',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPackageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  packageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  packageField: {
    flex: 1,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactField: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  navButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
  },
  navButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
