import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import { useTheme } from "../../../context/theme-context";

export default function AddVenue() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const theme = isDarkMode ? Palette.dark : Palette.light;

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Form State - Step 1: Basic Info
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");

  // Form State - Step 2: Technical Specs
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [ceilingHeight, setCeilingHeight] = useState("");
  
  // Venue Specifications Toggles
  const [stageAvailable, setStageAvailable] = useState(false);
  const [acAvailable, setAcAvailable] = useState(false);
  const [parkingAvailable, setParkingAvailable] = useState(false);
  const [handicappedAccess, setHandicappedAccess] = useState(false);

  // Door Placement
  interface Door {
    id: number;
    type: string;
    width: string;
    height: string;
    offsetFromCorner: string;
    swingDirection: string;
    hingePosition: string;
  }
  const [doors, setDoors] = useState<Door[]>([]);
  const [nextDoorId, setNextDoorId] = useState(1);

  // Rules & Regulations
  const [rulesAndRegulations, setRulesAndRegulations] = useState("");

  // Form State - Step 3: Media & Rules
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const eventTypeOptions = ["Wedding", "Corporate Event", "Conference", "Birthday Party", "Concert", "Exhibition", "Seminar", "Social Gathering"];

  // Form State - Step 3: Pricing & Contact
  const [hourlyRate, setHourlyRate] = useState("");
  const [minimumHours, setMinimumHours] = useState("");
  const [weekendRate, setWeekendRate] = useState("");
  const [holidayRate, setHolidayRate] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Form State - Pricing Packages
  interface PricingPackage {
    id: number;
    name: string;
    duration: string;
    price: string;
    inclusions: string;
  }
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [nextPackageId, setNextPackageId] = useState(1);

  // Legacy rate type (kept for backward compatibility if needed)
  const [rateType, setRateType] = useState("Hourly");
  const [baseRate, setBaseRate] = useState("");
  const [peakRate, setPeakRate] = useState("");
  const [overtimeCharges, setOvertimeCharges] = useState("");
  
  // Form State - Step 4: Facilities & Inclusions
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);
  const defaultFacilities = ["Tables & Chairs", "Sound System", "Projector", "Wi-Fi", "Stage", "Lighting System", "Kitchen", "Catering Service"];

  const steps = ["Basic Info", "Technical Specs", "Media & Rules", "Pricing & Contact"];

  const venueTypeOptions = ["Convention Center", "Meeting Room", "Outdoor Garden", "Banquet Hall", "Hotel Ballroom", "Theater"];

  // Calculate floor area automatically
  const calculateFloorArea = (newLength?: string, newWidth?: string) => {
    const l = newLength !== undefined ? newLength : length;
    const w = newWidth !== undefined ? newWidth : width;
    if (l && w) {
      const area = (parseFloat(l) * parseFloat(w)).toFixed(2);
      setFloorArea(area);
    }
  };

  const toggleAmenity = (amenity: string) => {
    // This function is removed - amenities are now toggles
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((et) => et !== eventType) : [...prev, eventType]
    );
  };

  const toggleFacility = (facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const addCustomFacility = () => {
    if (customFacilityInput.trim() && !facilities.includes(customFacilityInput)) {
      setFacilities([...facilities, customFacilityInput]);
      setCustomFacilityInput("");
    }
  };

  const addPricingPackage = () => {
    setPackages([
      ...packages,
      {
        id: nextPackageId,
        name: "",
        duration: "",
        price: "",
        inclusions: "",
      },
    ]);
    setNextPackageId(nextPackageId + 1);
  };

  const updatePackage = (id: number, field: string, value: string) => {
    setPackages(
      packages.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const deletePackage = (id: number) => {
    setPackages(packages.filter((pkg) => pkg.id !== id));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return name && type && location && capacity;
      case 2:
        return length && width && floorArea;
      case 3:
        return galleryImages.length > 0 && selectedEventTypes.length > 0;
      case 4:
        return baseRate && validateEmail(email) && phone;
      default:
        return false;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Sticky Header */}
          <View style={[styles.stickyHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowBackConfirmModal(true)}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create New Venue</Text>
            <TouchableOpacity
              disabled={!canProceedToNextStep() && currentStep === totalSteps}
              style={[
                styles.saveButton,
                { backgroundColor: currentStep === totalSteps ? Palette.primary : Palette.gray500 },
              ]}
            >
              <Text style={[styles.saveButtonText, { color: Palette.black }]}>Save Venue</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Stepper */}
          <View style={[styles.stepperContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.stepperRow}>
              {steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <TouchableOpacity
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor:
                          index + 1 <= currentStep ? Palette.primary : index + 1 === currentStep ? Palette.primary : theme.lightBg,
                        borderColor: index + 1 <= currentStep ? Palette.primary : theme.border,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setCurrentStep(index + 1)}
                  >
                    {index + 1 < currentStep ? (
                      <Ionicons name="checkmark" size={18} color={Palette.black} />
                    ) : (
                      <Text style={[styles.stepNumber, { color: index + 1 === currentStep ? Palette.black : theme.textSecondary }]}>
                        {index + 1}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.stepLabel, { color: index + 1 <= currentStep ? Palette.primary : theme.textSecondary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Venue Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g., Convention Hall A"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Venue Type *</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                  onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
                >
                  <Text style={[styles.dropdownText, { color: type ? theme.text : theme.textSecondary }]}>
                    {type || "Select Venue Type"}
                  </Text>
                  <Ionicons name={typeDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {typeDropdownOpen && (
                  <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {venueTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setType(option);
                          setTypeDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Location *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g., Business District, Chicago"
                  placeholderTextColor={theme.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Capacity *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g., 1200"
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
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Dimensions Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dimensions *</Text>
                <View style={styles.dimensionsGrid}>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Length (m) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={length}
                      onChangeText={(text) => {
                        setLength(text);
                        calculateFloorArea(text, width);
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Width (m) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={width}
                      onChangeText={(text) => {
                        setWidth(text);
                        calculateFloorArea(length, text);
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Floor Area (sqm) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="16.00"
                      placeholderTextColor={theme.textSecondary}
                      value={floorArea}
                      editable={false}
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Ceiling Height (m)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="12"
                      placeholderTextColor={theme.textSecondary}
                      value={ceilingHeight}
                      onChangeText={setCeilingHeight}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Venue Specifications Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Specifications *</Text>

                <View style={[styles.specificationRow, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.label, { color: theme.text }]}>Stage Availability *</Text>
                  </View>
                  <Switch
                    value={stageAvailable}
                    onValueChange={setStageAvailable}
                    trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                    thumbColor={stageAvailable ? Palette.primary : theme.textSecondary}
                  />
                </View>

                <View style={[styles.specificationRow, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.label, { color: theme.text }]}>Air Conditioning *</Text>
                  </View>
                  <Switch
                    value={acAvailable}
                    onValueChange={setAcAvailable}
                    trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                    thumbColor={acAvailable ? Palette.primary : theme.textSecondary}
                  />
                </View>

                <View style={[styles.specificationRow, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.label, { color: theme.text }]}>Parking Availability *</Text>
                  </View>
                  <Switch
                    value={parkingAvailable}
                    onValueChange={setParkingAvailable}
                    trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                    thumbColor={parkingAvailable ? Palette.primary : theme.textSecondary}
                  />
                </View>

                <View style={[styles.specificationRow, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.label, { color: theme.text }]}>Handicapped Access *</Text>
                  </View>
                  <Switch
                    value={handicappedAccess}
                    onValueChange={setHandicappedAccess}
                    trackColor={{ false: theme.textSecondary, true: Palette.primary }}
                    thumbColor={handicappedAccess ? Palette.primary : theme.textSecondary}
                  />
                </View>
              </View>

              {/* Allowed Event Types Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Allowed Event Types *</Text>
                <View style={styles.eventTypesGrid}>
                  {eventTypeOptions.map((eventType) => (
                    <TouchableOpacity
                      key={eventType}
                      style={[
                        styles.eventTypeChip,
                        {
                          backgroundColor: selectedEventTypes.includes(eventType) ? Palette.blue : theme.lightBg,
                          borderColor: selectedEventTypes.includes(eventType) ? Palette.blue : theme.border,
                        },
                      ]}
                      onPress={() => toggleEventType(eventType)}
                    >
                      <Text
                        style={[
                          styles.eventTypeChipText,
                          { color: selectedEventTypes.includes(eventType) ? "white" : theme.text },
                        ]}
                      >
                        {eventType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Floor Plan Upload & Venue Measurement Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Floor Plan Upload & Venue Measurement *</Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Floor Plan Image (PNG / JPG / PDF) *</Text>
                  <View style={styles.floorPlanInputContainer}>
                    <TextInput
                      style={[styles.floorPlanInput, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="Enter floor plan image URL"
                      placeholderTextColor={theme.textSecondary}
                      value={floorPlanUrl}
                      onChangeText={setFloorPlanUrl}
                    />
                    <TouchableOpacity style={[styles.uploadButton, { backgroundColor: Palette.gray500 }]}>
                      <Ionicons name="cloud-upload" size={18} color="white" />
                      <Text style={styles.uploadButtonText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.measurementGrid}>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Width (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Length (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Height (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Area (sqm)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      editable={false}
                    />
                  </View>
                </View>
              </View>

              {/* Door Placement Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <View style={styles.doorPlacementHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Door Placement *</Text>
                  <TouchableOpacity
                    style={[styles.addDoorButton, { backgroundColor: Palette.primary }]}
                    onPress={() => {
                      setDoors([
                        ...doors,
                        {
                          id: nextDoorId,
                          type: "Single Door",
                          width: "",
                          height: "",
                          offsetFromCorner: "",
                          swingDirection: "Inward",
                          hingePosition: "Left",
                        },
                      ]);
                      setNextDoorId(nextDoorId + 1);
                    }}
                  >
                    <Ionicons name="add" size={20} color={Palette.black} />
                    <Text style={[styles.addDoorButtonText, { color: Palette.black }]}>Add Door</Text>
                  </TouchableOpacity>
                </View>

                {doors.map((door, index) => (
                  <View key={door.id} style={[styles.doorCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                    <View style={styles.doorCardHeader}>
                      <Text style={[styles.doorCardTitle, { color: theme.text }]}>Door {index + 1}</Text>
                      <TouchableOpacity onPress={() => setDoors(doors.filter((d) => d.id !== door.id))}>
                        <Ionicons name="trash" size={20} color={Palette.red} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.doorFieldsGrid}>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Door Type</Text>
                        <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          <Text style={[styles.dropdownText, { color: theme.text }]}>Single Door</Text>
                          <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Width (meters)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.width}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, width: text } : d));
                            setDoors(updatedDoors);
                          }}
                        />
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Height (meters)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.height}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, height: text } : d));
                            setDoors(updatedDoors);
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.doorFieldsGrid}>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Offset From Corner (m)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.offsetFromCorner}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, offsetFromCorner: text } : d));
                            setDoors(updatedDoors);
                          }}
                        />
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Swing Direction</Text>
                        <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          <Text style={[styles.dropdownText, { color: theme.text }]}>Inward</Text>
                          <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Hinge Position</Text>
                        <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          <Text style={[styles.dropdownText, { color: theme.text }]}>Left</Text>
                          <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Step 3: Media & Rules */}
          {currentStep === 3 && (
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Gallery Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Gallery / Assets Upload *</Text>

                <Text style={[styles.subsectionTitle, { color: theme.text }]}>Upload up to 10 images *</Text>
                
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                >
                  <Ionicons name="cloud-upload" size={32} color={Palette.primary} />
                  <Text style={[styles.uploadButtonText, { color: theme.text }]}>Click to upload images</Text>
                  <Text style={[styles.uploadButtonSubtext, { color: theme.textSecondary }]}>or drag and drop (Max 10 images)</Text>
                </TouchableOpacity>

                {galleryImages.length > 0 && (
                  <View style={styles.thumbnailsContainer}>
                    {galleryImages.map((image, index) => (
                      <View key={index} style={styles.thumbnailWrapper}>
                        <Image source={{ uri: image }} style={styles.galleryThumbnail} />
                        <TouchableOpacity
                          style={styles.removeThumbnail}
                          onPress={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Facilities / Inclusions Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Facilities / Inclusions *</Text>

                {/* Default Facilities */}
                <View style={styles.facilitiesGrid}>
                  {defaultFacilities.map((facility) => (
                    <TouchableOpacity
                      key={facility}
                      style={[styles.facilityChip, { backgroundColor: facilities.includes(facility) ? Palette.blue : theme.lightBg, borderColor: facilities.includes(facility) ? Palette.blue : theme.border }]}
                      onPress={() => toggleFacility(facility)}
                    >
                      <Text style={[styles.facilityChipText, { color: facilities.includes(facility) ? "white" : theme.text }]}>{facility}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Facility Input */}
                <View style={styles.customFacilityContainer}>
                  <TextInput
                    style={[styles.customFacilityInput, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Add custom facility"
                    placeholderTextColor={theme.textSecondary}
                    value={customFacilityInput}
                    onChangeText={setCustomFacilityInput}
                  />
                  <TouchableOpacity
                    style={[styles.addFacilityButton, { backgroundColor: Palette.primary }]}
                    onPress={addCustomFacility}
                  >
                    <Ionicons name="add" size={20} color={Palette.black} />
                    <Text style={[styles.addFacilityButtonText, { color: Palette.black }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rules & Regulations Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Regulations *</Text>
                <TextInput
                  style={[
                    styles.rulesInput,
                    { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Enter venue rules and regulations (e.g., No loud music after 10 PM, No nails or tape on walls)"
                  placeholderTextColor={theme.textSecondary}
                  value={rulesAndRegulations}
                  onChangeText={setRulesAndRegulations}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}

          
          {/* Step 4: Pricing & Contact */}
          {currentStep === 4 && (
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Pricing & Packages Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing & Packages *</Text>

                {/* Hourly & Minimum Hours */}
                <View style={styles.pricingGrid}>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Hourly Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Minimum Hours</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={minimumHours}
                      onChangeText={setMinimumHours}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Weekend & Holiday Rates */}
                <View style={styles.pricingGrid}>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Weekend Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={weekendRate}
                      onChangeText={setWeekendRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Holiday Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={holidayRate}
                      onChangeText={setHolidayRate}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Overtime Rate */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Overtime Rate (₱)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    value={overtimeRate}
                    onChangeText={setOvertimeRate}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Notes / Terms */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Notes / Terms</Text>
                  <TextInput
                    style={[styles.notesInput, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter pricing notes or terms"
                    placeholderTextColor={theme.textSecondary}
                    value={pricingNotes}
                    onChangeText={setPricingNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Pricing Packages Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                <View style={styles.packageHeaderContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing Packages</Text>
                  <TouchableOpacity
                    style={[styles.addPackageButton, { backgroundColor: Palette.primary }]}
                    onPress={addPricingPackage}
                  >
                    <Ionicons name="add" size={18} color={Palette.black} />
                    <Text style={[styles.addPackageButtonText, { color: Palette.black }]}>Add Package</Text>
                  </TouchableOpacity>
                </View>

                {packages.length > 0 ? (
                  packages.map((pkg, index) => (
                    <View key={pkg.id} style={[styles.packageCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                      <View style={styles.packageCardHeader}>
                        <Text style={[styles.packageCardTitle, { color: theme.text }]}>Package {index + 1}</Text>
                        <TouchableOpacity onPress={() => deletePackage(pkg.id)}>
                          <Ionicons name="trash" size={20} color={Palette.red} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.packageFieldsGrid}>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Package Name</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g., Standard Package"
                            placeholderTextColor={theme.textSecondary}
                            value={pkg.name}
                            onChangeText={(value) => updatePackage(pkg.id, "name", value)}
                          />
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Duration</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g., 4 Hours"
                            placeholderTextColor={theme.textSecondary}
                            value={pkg.duration}
                            onChangeText={(value) => updatePackage(pkg.id, "duration", value)}
                          />
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Price (₱)</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.textSecondary}
                            value={pkg.price}
                            onChangeText={(value) => updatePackage(pkg.id, "price", value)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Inclusions</Text>
                        <TextInput
                          style={[styles.notesInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                          placeholder="List what's included in this package"
                          placeholderTextColor={theme.textSecondary}
                          value={pkg.inclusions}
                          onChangeText={(value) => updatePackage(pkg.id, "inclusions", value)}
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: theme.textSecondary, textAlign: "center", marginVertical: 16 }]}>
                    No packages added yet
                  </Text>
                )}
              </View>

              {/* Contact Information Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information *</Text>

                <View style={styles.contactGrid}>
                  <View style={styles.contactField}>
                    <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.lightBg,
                          color: theme.text,
                          borderColor: email && !validateEmail(email) ? Palette.red : theme.border,
                        },
                      ]}
                      placeholder="info@venue.com"
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                    />
                    {email && !validateEmail(email) && (
                      <Text style={[styles.errorText, { color: Palette.red }]}>Invalid email format</Text>
                    )}
                  </View>

                  <View style={styles.contactField}>
                    <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="+1 (555) 123-4567"
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

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              disabled={currentStep === 1}
              style={[styles.navButton, { backgroundColor: currentStep === 1 ? Palette.gray500 : theme.card }]}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={[styles.navButtonText, { color: currentStep === 1 ? Palette.gray700 : theme.text }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canProceedToNextStep()}
              style={[
                styles.navButton,
                { backgroundColor: canProceedToNextStep() ? Palette.primary : Palette.gray500 },
              ]}
              onPress={() => {
                if (currentStep < totalSteps) {
                  setCurrentStep(currentStep + 1);
                } else {
                  // Save venue
                  console.log("Saving venue...");
                }
              }}
            >
              <Text style={[styles.navButtonText, { color: Palette.black }]}>
                {currentStep === totalSteps ? "Save Venue" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
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
    flexDirection: "row",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stickyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepperContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  stepLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  stepContent: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  dimensionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  dimensionField: {
    flex: 1,
    minWidth: "48%",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  amenityChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  facilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  facilityChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  customFacilityContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  customFacilityInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addFacilityButton: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  addFacilityButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dragDropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dragDropText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  demoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  demoButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  thumbnailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  thumbnailWrapper: {
    position: "relative",
    width: 80,
    height: 80,
  },
  galleryThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeThumbnail: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.red,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
  imageUrlInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  imageUrlInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  addImageButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  floorPlanInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  floorPlanInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  measurementField: {
    flex: 1,
    minWidth: "48%",
  },
  doorPlacementSection: {
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 24,
  },
  doorPlacementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addDoorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addDoorButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  doorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  doorCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  doorCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  doorFieldsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  doorField: {
    flex: 1,
  },
  rulesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  eventTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  eventTypeChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 0,
    marginTop: -10,
    marginHorizontal: 0,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownItemText: {
    fontSize: 13,
  },
  specificationRow: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rateTypeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rateTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rateTypeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  priceField: {
    flex: 1,
    minWidth: "48%",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  cardContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  packageHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addPackageButton: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  addPackageButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  packageCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  packageCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  packageCardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  packageFieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  packageField: {
    flex: 1,
    minWidth: "31%",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  contactGrid: {
    flexDirection: "row",
    gap: 16,
  },
  contactField: {
    flex: 1,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModal: {
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
