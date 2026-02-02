import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Palette } from "../../../../assets/colors/palette";
import AdminHeader from "../../../components/admin-header";
import AdminSidebar from "../../../components/admin-sidebar";
import ValidationError from "../../../components/validation-error";
import VenueFloorPlanVisualizer from "../../../components/venue-floor-plan-visualizer";
import { useTheme } from "../../../context/theme-context";
import { useAuth } from "../../../hooks/use-auth";
import { supabase } from "../../../services/supabase";
import { fetchVenueAdministrators, fetchVenueTypes } from "../../../services/venueService";
import { validateRequired, VALIDATION_MESSAGES, ValidationError as ValidationErrorType } from "../../../utils/validation";

export default function AddVenue() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const theme = isDarkMode ? Palette.dark : Palette.light;
  const scrollViewRef = useRef<ScrollView>(null);
  const floorPlanVisualizerRef = useRef<any>(null);

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [venueAdminDropdownOpen, setVenueAdminDropdownOpen] = useState(false);

  // Venue Admin State
  const [venueAdministrators, setVenueAdministrators] = useState<any[]>([]);
  const [selectedVenueAdmin, setSelectedVenueAdmin] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // Venue Types State
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  // Form State - Step 1: Basic Info
  const [name, setName] = useState("");
  const [type, setType] = useState(""); // Stores venue_type_id (not the name)
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
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

  // Venue Specifications as array of objects
  interface VenueSpecification {
    id: number;
    name: string;
    value: string;
    notes: string;
  }
  const [venueSpecifications, setVenueSpecifications] = useState<VenueSpecification[]>([]);
  const [customSpecificationInput, setCustomSpecificationInput] = useState("");
  const [specValueInput, setSpecValueInput] = useState("");
  const [specNotesInput, setSpecNotesInput] = useState("");
  const [nextSpecId, setNextSpecId] = useState(1);

  // Door Placement
  interface Door {
    id: number;
    type: string;
    width: string;
    height: string;
    offsetFromCorner: string;
    swingDirection: string;
    hingePosition: string;
    wall: string; // "Top", "Bottom", "Left", "Right"
  }
  const [doors, setDoors] = useState<Door[]>([]);
  const [nextDoorId, setNextDoorId] = useState(1);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

  // Rules & Regulations
  const [rulesAndRegulations, setRulesAndRegulations] = useState("");

  // Form State - Step 3: Media & Rules
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [eventCategoriesLoading, setEventCategoriesLoading] = useState(true);

  // Form State - Step 3: Pricing & Contact
  const [hourlyRate, setHourlyRate] = useState("");
  const [minimumHours, setMinimumHours] = useState("");
  const [weekendRate, setWeekendRate] = useState("");
  const [holidayRate, setHolidayRate] = useState("");
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

  // Form State - Seasonal Pricing
  interface SeasonalPrice {
    id: number;
    seasonName: string;
    startDate: string;
    endDate: string;
    rateType: string;
    modifierType: string;
    modifierValue: string;
  }
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [nextSeasonalPriceId, setNextSeasonalPriceId] = useState(1);

  // Form State - Overtime Rates
  interface OvertimeRate {
    id: number;
    rateType: string;
    pricePerHour: string;
    startHour: string;
    endHour: string;
  }
  const [overtimeRates, setOvertimeRates] = useState<OvertimeRate[]>([]);
  const [nextOvertimeRateId, setNextOvertimeRateId] = useState(1);

  // Legacy rate type (kept for backward compatibility if needed)
  const [rateType, setRateType] = useState("Hourly");
  const [baseRate, setBaseRate] = useState("");
  const [peakRate, setPeakRate] = useState("");
  const [overtimeCharges, setOvertimeCharges] = useState("");
  
  // Form State - Step 4: Facilities & Inclusions
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);

  // Validation Error States
  const [nameError, setNameError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [venueAdminError, setVenueAdminError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [typeError, setTypeError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [streetAddressError, setStreetAddressError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [barangayError, setBarangayError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [cityError, setCityError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [provinceError, setProvinceError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [zipCodeError, setZipCodeError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [capacityError, setCapacityError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [lengthError, setLengthError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [widthError, setWidthError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [floorAreaError, setFloorAreaError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [galleryImagesError, setGalleryImagesError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [eventTypesError, setEventTypesError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [venueSpecificationsError, setVenueSpecificationsError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [hourlyRateError, setHourlyRateError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [emailError, setEmailError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [phoneError, setPhoneError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [rulesAndRegulationsError, setRulesAndRegulationsError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [facilitiesError, setFacilitiesError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [minimumHoursError, setMinimumHoursError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [weekendRateError, setWeekendRateError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [holidayRateError, setHolidayRateError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [packagesError, setPackagesError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [doorsError, setDoorsError] = useState<ValidationErrorType>({ field: "", message: "", isValid: true });
  const [capacityWarning, setCapacityWarning] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const steps = ["Basic Info", "Technical Specs", "Media & Rules", "Pricing & Contact"];

  // Door enum constants
  const DOOR_TYPES = ["Single", "Double"];
  const DOOR_SWING_DIRECTIONS = ["Inward", "Outward"];
  const DOOR_HINGE_POSITIONS = ["Left", "Right"];
  const DOOR_WALLS = ["Top", "Bottom", "Left", "Right"];

  // Load venue administrators and types on component mount
  useEffect(() => {
    console.log("📱 Component mounted, loading data. Auth loading:", authLoading, "User available:", !!user);
    loadVenueAdministrators();
    loadVenueTypesData();
    loadEventCategories();
    
    // Wait for auth to load before trying to get user ID
    if (!authLoading && user) {
      console.log("✅ Auth ready, user exists, fetching user ID");
      getCurrentUserIdFromAuth();
    } else if (!authLoading && !user) {
      console.error("❌ Auth loaded but no user. User not logged in!");
    } else {
      console.log("⏳ Auth still loading...");
    }
  }, [user, authLoading]);

  // Auto-calculate floor area when length or width changes
  useEffect(() => {
    if (length && width) {
      const lengthNum = parseFloat(length);
      const widthNum = parseFloat(width);
      if (!isNaN(lengthNum) && !isNaN(widthNum)) {
        const area = (lengthNum * widthNum).toFixed(2);
        setFloorArea(area);
      }
    }
  }, [length, width]);

  const getCurrentUserIdFromAuth = async () => {
    console.log("🔐 Getting user ID from auth, user:", user);
    if (!user) {
      console.log("❌ No user in auth context");
      return;
    }
    
    console.log("🔍 Searching for user with auth_id:", user.id);
    
    try {
      // First, let's fetch all users to debug
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('user_id, auth_id, email');
      
      console.log("📋 All users in database:", allUsers);
      if (allError) console.error("Error fetching all users:", allError);
      
      // Now search for this specific user
      const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();
      
      console.log("🔎 Query result for auth_id", user.id, ":", { data, error });
      
      if (error) {
        console.error('❌ Error fetching user ID:', error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Fallback: try using user email
        console.log("🔄 Trying fallback: searching by email", user.email);
        const { data: dataByEmail, error: emailError } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .single();
        
        if (dataByEmail) {
          console.log("✅ User ID fetched (by email fallback):", dataByEmail.user_id);
          setCurrentUserId(dataByEmail.user_id);
        } else {
          console.error("❌ Fallback also failed:", emailError);
        }
        return;
      }
      
      if (data) {
        console.log("✅ User ID fetched:", data.user_id);
        setCurrentUserId(data.user_id);
      } else {
        console.error("❌ No user data returned from query");
      }
    } catch (err: any) {
      console.error('❌ Exception getting user ID:', err);
      console.error("Error details:", err.message);
    }
  };

  const loadVenueAdministrators = async () => {
    try {
      setAdminLoading(true);
      const { data, error } = await fetchVenueAdministrators();
      
      if (error) {
        Alert.alert("Error", "Failed to load venue administrators");
        console.error(error);
      } else {
        setVenueAdministrators(data || []);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const loadVenueTypesData = async () => {
    try {
      setTypesLoading(true);
      const { data, error } = await fetchVenueTypes();
      
      if (error) {
        Alert.alert("Error", "Failed to load venue types");
        console.error(error);
      } else {
        const mappedTypes = data?.map((vt: any) => ({
          id: vt.venue_type_id,
          name: vt.type_name,
        })) || [];
        setVenueTypes(mappedTypes);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.error(err);
    } finally {
      setTypesLoading(false);
    }
  };

  const loadEventCategories = async () => {
    try {
      setEventCategoriesLoading(true);
      const { data, error } = await supabase
        .from('event_categories')
        .select('category_id, category_name')
        .order('category_name', { ascending: true });
      
      if (error) {
        console.error('Error loading event categories:', error);
        setEventCategories([]);
      } else {
        const mappedCategories = data?.map((ec: any) => ({
          id: ec.category_id,
          name: ec.category_name,
        })) || [];
        setEventCategories(mappedCategories);
      }
    } catch (err: any) {
      console.error('Exception loading event categories:', err);
      setEventCategories([]);
    } finally {
      setEventCategoriesLoading(false);
    }
  };

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

  const addCustomSpecification = () => {
    if (customSpecificationInput.trim() && specValueInput.trim() && !venueSpecifications.some(s => s.name === customSpecificationInput)) {
      setVenueSpecifications([...venueSpecifications, {
        id: nextSpecId,
        name: customSpecificationInput,
        value: specValueInput,
        notes: specNotesInput,
      }]);
      setNextSpecId(nextSpecId + 1);
      setCustomSpecificationInput("");
      setSpecValueInput("");
      setSpecNotesInput("");
      setVenueSpecificationsError({ field: "", message: "", isValid: true });
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

  const addSeasonalPrice = () => {
    setSeasonalPrices([
      ...seasonalPrices,
      {
        id: nextSeasonalPriceId,
        seasonName: "",
        startDate: "",
        endDate: "",
        rateType: "Hourly",
        modifierType: "Fixed",
        modifierValue: "",
      },
    ]);
    setNextSeasonalPriceId(nextSeasonalPriceId + 1);
  };

  const updateSeasonalPrice = (id: number, field: string, value: string) => {
    setSeasonalPrices(
      seasonalPrices.map((sp) =>
        sp.id === id ? { ...sp, [field]: value } : sp
      )
    );
  };

  const deleteSeasonalPrice = (id: number) => {
    setSeasonalPrices(seasonalPrices.filter((sp) => sp.id !== id));
  };

  const addOvertimeRate = () => {
    setOvertimeRates([
      ...overtimeRates,
      {
        id: nextOvertimeRateId,
        rateType: "Hourly",
        pricePerHour: "",
        startHour: "",
        endHour: "",
      },
    ]);
    setNextOvertimeRateId(nextOvertimeRateId + 1);
  };

  const updateOvertimeRate = (id: number, field: string, value: string) => {
    setOvertimeRates(
      overtimeRates.map((or) =>
        or.id === id ? { ...or, [field]: value } : or
      )
    );
  };

  const deleteOvertimeRate = (id: number) => {
    setOvertimeRates(overtimeRates.filter((or) => or.id !== id));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedVenueAdmin && name && type && streetAddress && barangay && city && province && zipCode && capacity;
      case 2:
        return length && width && floorArea && venueSpecifications.length > 0 && selectedEventTypes.length > 0;
      case 3:
        return galleryImages.length > 0 && rulesAndRegulations.trim() !== "" && facilities.length > 0;
      case 4:
        return hourlyRate && validateEmail(email) && phone && packages.length > 0;
      default:
        return false;
    }
  };

  const validateAndProceedToNextStep = async () => {
    console.log("🔍 Validating step", currentStep);
    
    let isStepValid = false;
    
    // Validate based on current step
    if (currentStep === 1) {
      // First check if venue name already exists
      if (validateRequired(name)) {
        console.log("🔍 Checking if venue name already exists:", name);
        try {
          const { data: existingVenue, error: checkError } = await supabase
            .from('venues')
            .select('venue_id')
            .eq('venue_name', name)
            .maybeSingle();
          
          if (!checkError && existingVenue) {
            console.log("⚠️ Venue name already exists");
            setNameError({
              field: "name",
              message: "A venue with this name already exists. Please choose a different name.",
              isValid: false,
            });
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            Alert.alert("Venue Name Already Exists", "A venue with this name already exists. Please choose a different name.");
            return;
          }
        } catch (err: any) {
          // If no matching venue found, err will be "no rows" - that's fine
          if (err?.code !== 'PGRST116') {
            console.error("Error checking venue name:", err);
          }
        }
      }
      
      // Basic Info validation
      const nameValid = validateRequired(name);
      const typeValid = validateRequired(type);
      const streetValid = validateRequired(streetAddress);
      const barangayValid = validateRequired(barangay);
      const cityValid = validateRequired(city);
      const provinceValid = validateRequired(province);
      const zipValid = validateRequired(zipCode) && /^\d{4,5}$/.test(zipCode);
      const capacityValid = validateRequired(capacity) && parseInt(capacity) <= 10000;
      
      setNameError(nameValid ? { field: "name", message: "", isValid: true } : { field: "name", message: VALIDATION_MESSAGES.required("Venue name"), isValid: false });
      setTypeError(typeValid ? { field: "type", message: "", isValid: true } : { field: "type", message: VALIDATION_MESSAGES.required("Venue type"), isValid: false });
      setStreetAddressError(streetValid ? { field: "streetAddress", message: "", isValid: true } : { field: "streetAddress", message: VALIDATION_MESSAGES.required("Street address"), isValid: false });
      setBarangayError(barangayValid ? { field: "barangay", message: "", isValid: true } : { field: "barangay", message: VALIDATION_MESSAGES.required("Barangay"), isValid: false });
      setCityError(cityValid ? { field: "city", message: "", isValid: true } : { field: "city", message: VALIDATION_MESSAGES.required("City"), isValid: false });
      setProvinceError(provinceValid ? { field: "province", message: "", isValid: true } : { field: "province", message: VALIDATION_MESSAGES.required("Province"), isValid: false });
      
      let zipError = { field: "zipCode", message: "", isValid: true };
      if (!validateRequired(zipCode)) {
        zipError = { field: "zipCode", message: VALIDATION_MESSAGES.required("Zip code"), isValid: false };
      } else if (!/^\d{4,5}$/.test(zipCode)) {
        zipError = { field: "zipCode", message: "Philippine zip code must be 4-5 digits", isValid: false };
      }
      setZipCodeError(zipError);
      
      let capError = { field: "capacity", message: "", isValid: true };
      if (!validateRequired(capacity)) {
        capError = { field: "capacity", message: VALIDATION_MESSAGES.required("Capacity"), isValid: false };
      } else if (parseInt(capacity) > 10000) {
        capError = { field: "capacity", message: "Capacity exceeds reasonable limit (10,000 max)", isValid: false };
      }
      setCapacityError(capError);
      
      isStepValid = nameValid && typeValid && streetValid && barangayValid && cityValid && provinceValid && zipValid && capacityValid;
    } else if (currentStep === 2) {
      // Technical Specs validation
      const specsValid = venueSpecifications.length > 0;
      const eventTypesValid = selectedEventTypes.length > 0;
      
      // Validate doors: must have at least one, and all required fields must be filled
      let doorsValid = doors.length > 0;
      let doorErrorMessage = "";
      if (doorsValid) {
        for (let i = 0; i < doors.length; i++) {
          const door = doors[i];
          if (!door.width || !door.height || !door.offsetFromCorner || !door.wall) {
            doorsValid = false;
            doorErrorMessage = `Door ${i + 1}: All fields including Wall are required`;
            break;
          }
        }
      } else {
        doorErrorMessage = "At least one door placement is required";
      }
      
      setVenueSpecificationsError(specsValid ? { field: "venueSpecifications", message: "", isValid: true } : { field: "venueSpecifications", message: "Please add at least one venue specification", isValid: false });
      setEventTypesError(eventTypesValid ? { field: "eventTypes", message: "", isValid: true } : { field: "eventTypes", message: "Please select at least one event type", isValid: false });
      setDoorsError(doorsValid ? { field: "doors", message: "", isValid: true } : { field: "doors", message: doorErrorMessage, isValid: false });
      
      isStepValid = specsValid && eventTypesValid && doorsValid;
    } else if (currentStep === 3) {
      // Media & Rules validation
      const galleryValid = galleryImages.length > 0;
      const rulesValid = validateRequired(rulesAndRegulations);
      const facilitiesValid = facilities.length > 0;
      // Venue measurement validation: length and width are required
      const floorPlanValid = validateRequired(length) && validateRequired(width);
      
      setGalleryImagesError(galleryValid ? { field: "galleryImages", message: "", isValid: true } : { field: "galleryImages", message: "At least one gallery image is required", isValid: false });
      setRulesAndRegulationsError(rulesValid ? { field: "rulesAndRegulations", message: "", isValid: true } : { field: "rulesAndRegulations", message: "Rules and regulations are required", isValid: false });
      setFacilitiesError(facilitiesValid ? { field: "facilities", message: "", isValid: true } : { field: "facilities", message: "At least one facility is required", isValid: false });
      
      // Validate floor plan dimensions
      if (!floorPlanValid) {
        if (!validateRequired(length) || !validateRequired(width)) {
          setLengthError(!validateRequired(length) ? { field: "length", message: "Length is required", isValid: false } : { field: "length", message: "", isValid: true });
          setWidthError(!validateRequired(width) ? { field: "width", message: "Width is required", isValid: false } : { field: "width", message: "", isValid: true });
        } else {
          setLengthError({ field: "length", message: "", isValid: true });
          setWidthError({ field: "width", message: "", isValid: true });
        }
        setFloorAreaError({ field: "floorArea", message: "", isValid: true });
      } else {
        setLengthError({ field: "length", message: "", isValid: true });
        setWidthError({ field: "width", message: "", isValid: true });
        setFloorAreaError({ field: "floorArea", message: "", isValid: true });
      }
      
      isStepValid = galleryValid && rulesValid && facilitiesValid && floorPlanValid;
    }
    
    if (isStepValid) {
      console.log("✅ Step", currentStep, "is valid, proceeding to next");
      setCurrentStep(currentStep + 1);
      // Scroll to top when moving to next step
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      console.log("❌ Step", currentStep, "has validation errors");
      // Scroll to top to show errors
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert("Validation Error", "Please fix the errors above before proceeding.");
    }
  };

  const uploadFloorPlanImageToCloudinary = async (): Promise<string | null> => {
    try {
      console.log("🖼️ Getting floor plan canvas image...");
      // Get canvas blob from visualizer
      const blob = await floorPlanVisualizerRef.current?.getCanvasImage();
      if (!blob) {
        console.log("ℹ️ Floor plan image capture not available in React Native - will save as pending-upload");
        return null;
      }
      console.log("✅ Canvas blob obtained, size:", blob.size, "bytes");

      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || '');
      formData.append('folder', 'eventscape/floor-plans');

      console.log("📤 Uploading to Cloudinary with preset:", process.env.EXPO_PUBLIC_CLOUDINARY_PRESET);
      // Upload to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_NAME}/image/upload`;
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Cloudinary API error:", response.status, errorText);
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Floor plan image uploaded to Cloudinary:", data.secure_url);
      return data.secure_url || data.url;
    } catch (error) {
      console.error("❌ Error uploading floor plan image:", error);
      return null;
    }
  };

  const uploadGalleryImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      console.log("🖼️ Uploading gallery image to Cloudinary:", imageUri.substring(0, 50));
      
      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log("✅ Blob obtained, size:", blob.size, "bytes");

      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || '');
      formData.append('folder', 'eventscape/gallery');

      console.log("📤 Uploading to Cloudinary with preset:", process.env.EXPO_PUBLIC_CLOUDINARY_PRESET);
      
      // Upload to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_NAME}/image/upload`;
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("❌ Cloudinary API error:", uploadResponse.status, errorText);
        throw new Error(`Cloudinary upload failed: ${uploadResponse.statusText}`);
      }

      const data = await uploadResponse.json();
      console.log("✅ Gallery image uploaded to Cloudinary:", data.secure_url);
      return data.secure_url || data.url;
    } catch (error) {
      console.error("❌ Error uploading gallery image:", error);
      return null;
    }
  };

  const handleSaveVenue = async () => {
    console.log("🚀 handleSaveVenue() called");
    
    // ===== EARLY CHECK: VALIDATE VENUE NAME UNIQUENESS =====
    if (validateRequired(name)) {
      console.log("🔍 Checking if venue name already exists:", name);
      try {
        const { data: existingVenue, error: checkError } = await supabase
          .from('venues')
          .select('venue_id')
          .eq('venue_name', name)
          .maybeSingle();
        
        if (!checkError && existingVenue) {
          console.log("⚠️ Venue name already exists");
          setNameError({
            field: "name",
            message: "A venue with this name already exists. Please choose a different name.",
            isValid: false,
          });
          Alert.alert("Venue Name Already Exists", "A venue with this name already exists. Please choose a different name.");
          return;
        }
      } catch (err: any) {
        // If no matching venue found, err will be "no rows" - that's fine
        if (err?.code !== 'PGRST116') {
          console.error("Error checking venue name:", err);
        }
      }
    }
    
    // ===== STEP 1: VALIDATE ALL REQUIRED FIELDS =====
    const nameValidation: ValidationErrorType = validateRequired(name)
      ? { field: "name", message: "", isValid: true }
      : { field: "name", message: VALIDATION_MESSAGES.required("Venue name"), isValid: false };
    setNameError(nameValidation);

    const typeValidation: ValidationErrorType = validateRequired(type)
      ? { field: "type", message: "", isValid: true }
      : { field: "type", message: VALIDATION_MESSAGES.required("Venue type"), isValid: false };
    setTypeError(typeValidation);

    const streetAddressValidation: ValidationErrorType = validateRequired(streetAddress)
      ? { field: "streetAddress", message: "", isValid: true }
      : { field: "streetAddress", message: VALIDATION_MESSAGES.required("Street address"), isValid: false };
    setStreetAddressError(streetAddressValidation);

    const barangayValidation: ValidationErrorType = validateRequired(barangay)
      ? { field: "barangay", message: "", isValid: true }
      : { field: "barangay", message: VALIDATION_MESSAGES.required("Barangay"), isValid: false };
    setBarangayError(barangayValidation);

    const cityValidation: ValidationErrorType = validateRequired(city)
      ? { field: "city", message: "", isValid: true }
      : { field: "city", message: VALIDATION_MESSAGES.required("City"), isValid: false };
    setCityError(cityValidation);

    const provinceValidation: ValidationErrorType = validateRequired(province)
      ? { field: "province", message: "", isValid: true }
      : { field: "province", message: VALIDATION_MESSAGES.required("Province"), isValid: false };
    setProvinceError(provinceValidation);

    let zipCodeValidation: ValidationErrorType = { field: "zipCode", message: "", isValid: true };
    if (!validateRequired(zipCode)) {
      zipCodeValidation = { field: "zipCode", message: VALIDATION_MESSAGES.required("Zip code"), isValid: false };
    } else if (!/^\d{4,5}$/.test(zipCode)) {
      zipCodeValidation = { field: "zipCode", message: "Philippine zip code must be 4-5 digits", isValid: false };
    }
    setZipCodeError(zipCodeValidation);

    let capacityValidation: ValidationErrorType = { field: "capacity", message: "", isValid: true };
    if (!validateRequired(capacity)) {
      capacityValidation = { field: "capacity", message: VALIDATION_MESSAGES.required("Capacity"), isValid: false };
    } else if (parseInt(capacity) > 10000) {
      capacityValidation = { field: "capacity", message: "Capacity exceeds reasonable limit (10,000 max)", isValid: false };
    }
    setCapacityError(capacityValidation);

    const lengthValidation: ValidationErrorType = validateRequired(length)
      ? { field: "length", message: "", isValid: true }
      : { field: "length", message: VALIDATION_MESSAGES.required("Length"), isValid: false };
    setLengthError(lengthValidation);

    const widthValidation: ValidationErrorType = validateRequired(width)
      ? { field: "width", message: "", isValid: true }
      : { field: "width", message: VALIDATION_MESSAGES.required("Width"), isValid: false };
    setWidthError(widthValidation);

    const floorAreaValidation: ValidationErrorType = validateRequired(floorArea)
      ? { field: "floorArea", message: "", isValid: true }
      : { field: "floorArea", message: VALIDATION_MESSAGES.required("Floor area"), isValid: false };
    setFloorAreaError(floorAreaValidation);

    const galleryImagesValidation: ValidationErrorType = galleryImages.length > 0
      ? { field: "galleryImages", message: "", isValid: true }
      : { field: "galleryImages", message: "At least one gallery image is required", isValid: false };
    setGalleryImagesError(galleryImagesValidation);

    const eventTypesValidation: ValidationErrorType = selectedEventTypes.length > 0
      ? { field: "eventTypes", message: "", isValid: true }
      : { field: "eventTypes", message: "Please select at least one event type", isValid: false };
    setEventTypesError(eventTypesValidation);

    const venueSpecificationsValidation: ValidationErrorType = venueSpecifications.length > 0
      ? { field: "venueSpecifications", message: "", isValid: true }
      : { field: "venueSpecifications", message: "Please add at least one venue specification", isValid: false };
    setVenueSpecificationsError(venueSpecificationsValidation);

    const hourlyRateValidation: ValidationErrorType = validateRequired(hourlyRate)
      ? { field: "hourlyRate", message: "", isValid: true }
      : { field: "hourlyRate", message: VALIDATION_MESSAGES.required("Hourly rate"), isValid: false };
    setHourlyRateError(hourlyRateValidation);

    const minimumHoursValidation: ValidationErrorType = validateRequired(minimumHours) && (minimumHours && parseInt(minimumHours) > 0)
      ? { field: "minimumHours", message: "", isValid: true }
      : { field: "minimumHours", message: "Minimum hours must be greater than 0", isValid: false };
    setMinimumHoursError(minimumHoursValidation);

    const weekendRateValidation: ValidationErrorType = validateRequired(weekendRate) && (weekendRate && parseFloat(weekendRate) >= 0)
      ? { field: "weekendRate", message: "", isValid: true }
      : { field: "weekendRate", message: "Weekend rate must be a valid non-negative number", isValid: false };
    setWeekendRateError(weekendRateValidation);

    const holidayRateValidation: ValidationErrorType = validateRequired(holidayRate) && (holidayRate && parseFloat(holidayRate) >= 0)
      ? { field: "holidayRate", message: "", isValid: true }
      : { field: "holidayRate", message: "Holiday rate must be a valid non-negative number", isValid: false };
    setHolidayRateError(holidayRateValidation);

    // Email and phone: At least ONE must be provided
    const hasEmail = validateRequired(email);
    const hasPhone = validateRequired(phone);
    const hasValidEmail = hasEmail ? validateEmail(email) : true; // If no email, skip email validation
    const hasValidPhone = hasPhone ? true : false; // Phone just needs to exist if provided
    const hasAtLeastOneContact = (hasEmail && hasValidEmail) || hasPhone;
    
    const emailValidation: ValidationErrorType = !hasEmail
      ? { field: "email", message: "", isValid: true } // Email is optional if phone exists
      : hasValidEmail
      ? { field: "email", message: "", isValid: true }
      : { field: "email", message: "Valid email format required", isValid: false };
    setEmailError(emailValidation);

    const phoneValidation: ValidationErrorType = !hasPhone
      ? { field: "phone", message: "", isValid: true } // Phone is optional if email exists
      : { field: "phone", message: "", isValid: true };
    setPhoneError(phoneValidation);
    
    const contactValidation: ValidationErrorType = hasAtLeastOneContact
      ? { field: "contacts", message: "", isValid: true }
      : { field: "contacts", message: "At least one contact method (email or phone) is required", isValid: false };

    const rulesValidation: ValidationErrorType = validateRequired(rulesAndRegulations)
      ? { field: "rulesAndRegulations", message: "", isValid: true }
      : { field: "rulesAndRegulations", message: "Rules and regulations are required", isValid: false };
    setRulesAndRegulationsError(rulesValidation);

    const facilitiesValidation: ValidationErrorType = facilities.length > 0
      ? { field: "facilities", message: "", isValid: true }
      : { field: "facilities", message: "At least one facility is required", isValid: false };
    setFacilitiesError(facilitiesValidation);

    const packagesValidation: ValidationErrorType = packages.length > 0
      ? { field: "packages", message: "", isValid: true }
      : { field: "packages", message: "At least one venue package is required", isValid: false };
    setPackagesError(packagesValidation);

    // Validate doors if any exist
    let doorsValid = true;
    if (doors.length > 0) {
      for (let i = 0; i < doors.length; i++) {
        const door = doors[i];
        if (!door.width || !door.height || !door.offsetFromCorner || !door.wall) {
          doorsValid = false;
          setDoorsError({ field: "doors", message: `Door ${i + 1}: All fields including Wall are required.`, isValid: false });
          break;
        }
      }
    }
    if (doorsValid) {
      setDoorsError({ field: "", message: "", isValid: true });
    }

    // Check if all validations passed
    const allValidationsPass = nameValidation.isValid && typeValidation.isValid && streetAddressValidation.isValid &&
      barangayValidation.isValid && cityValidation.isValid && provinceValidation.isValid && zipCodeValidation.isValid &&
      capacityValidation.isValid && lengthValidation.isValid && widthValidation.isValid && floorAreaValidation.isValid &&
      galleryImagesValidation.isValid && eventTypesValidation.isValid && venueSpecificationsValidation.isValid &&
      hourlyRateValidation.isValid && minimumHoursValidation.isValid && weekendRateValidation.isValid &&
      holidayRateValidation.isValid && contactValidation.isValid &&
      rulesValidation.isValid && facilitiesValidation.isValid && packagesValidation.isValid && doorsValid;

    if (!allValidationsPass) {
      console.log("❌ Validation failed in handleSaveVenue");
      console.log("Validation details:", {
        name: nameValidation.isValid,
        type: typeValidation.isValid,
        streetAddress: streetAddressValidation.isValid,
        barangay: barangayValidation.isValid,
        city: cityValidation.isValid,
        province: provinceValidation.isValid,
        zipCode: zipCodeValidation.isValid,
        capacity: capacityValidation.isValid,
        length: lengthValidation.isValid,
        width: widthValidation.isValid,
        floorArea: floorAreaValidation.isValid,
        galleryImages: galleryImagesValidation.isValid,
        eventTypes: eventTypesValidation.isValid,
        venueSpecifications: venueSpecificationsValidation.isValid,
        hourlyRate: hourlyRateValidation.isValid,
        minimumHours: minimumHoursValidation.isValid,
        weekendRate: weekendRateValidation.isValid,
        holidayRate: holidayRateValidation.isValid,
        email: emailValidation.isValid,
        phone: phoneValidation.isValid,
        rules: rulesValidation.isValid,
        facilities: facilitiesValidation.isValid,
        packages: packagesValidation.isValid,
        doors: doorsValid
      });
      Alert.alert("Validation Error", "Please fix all validation errors before saving.");
      return;
    }

    if (!currentUserId) {
      console.log("❌ No currentUserId in state. Attempting to fetch it now...");
      console.log("Current user from auth:", user?.id, user?.email);
      
      if (!user) {
        Alert.alert("Error", "You are not logged in. Please log in again.");
        return;
      }
      
      // Try to fetch it immediately
      try {
        const { data, error } = await supabase
          .from('users')
          .select('user_id')
          .eq('auth_id', user.id)
          .single();
        
        if (error || !data) {
          console.error("❌ Failed to fetch user ID:", error);
          Alert.alert("Error", "Could not find your user ID. Please log in again.");
          return;
        }
        
        console.log("✅ User ID fetched on demand:", data.user_id);
        setCurrentUserId(data.user_id);
      } catch (err: any) {
        console.error("❌ Exception fetching user ID:", err);
        Alert.alert("Error", "User authentication failed. Please log in again.");
        return;
      }
    }

    setIsSaving(true);
    console.log("💾 Starting database save...");

    try {
      // ===== STEP 2: INSERT MAIN VENUE RECORD =====
      console.log("📍 Step 2: Inserting main venue record");
      const venueData = {
        venue_name: name,
        description: rulesAndRegulations,
        street_address: streetAddress,
        barangay: barangay,
        city: city,
        province: province,
        zip_code: zipCode,
        country: "Philippines",
        max_capacity: parseInt(capacity),
        created_by: currentUserId,
        is_active: true,
      };

      const { data: venueResult, error: venueError } = await supabase
        .from('venues')
        .insert([venueData])
        .select()
        .single();

      if (venueError || !venueResult) {
        console.error("❌ Venue creation error:", venueError);
        console.error("Venue data attempted:", venueData);
        Alert.alert("Error", "Failed to create venue: " + (venueError?.message || "Unknown error"));
        setIsSaving(false);
        return;
      }

      const venueId = venueResult.venue_id;
      console.log("✅ Venue created successfully with ID:", venueId, "Full result:", venueResult);

      // ===== STEP 3: INSERT RELATED DATA (CHILDREN) =====
      // Each insert is wrapped in its own try-catch so one failure doesn't stop the others
      try {
        // 3A. Save Doors
        try {
          if (doors.length > 0) {
            const doorsData = doors.map((door) => {
              // Map display names to enum values: "Single Door" -> "Single", "Double Door" -> "Double"
              const doorTypeMap: { [key: string]: string } = {
                'Single Door': 'Single',
                'Double Door': 'Double',
                'Single': 'Single',  // Also accept direct enum values
                'Double': 'Double',
              };
              const mappedDoorType = doorTypeMap[door.type] || door.type; // Fallback to original if not found
              
              return {
                venue_id: venueId,
                door_type: mappedDoorType,
                width: parseFloat(door.width),
                height: parseFloat(door.height),
                door_offset: parseFloat(door.offsetFromCorner),
                wall: door.wall,
                corner_position: door.hingePosition,
                swing_direction: door.swingDirection,
                hinge_position: door.hingePosition,
              };
            });
            console.log("🚪 Inserting doors:", doorsData);
            const { error: doorsError } = await supabase.from('venue_doors').insert(doorsData);
            if (doorsError) {
              console.error("❌ Error saving doors:", doorsError);
              console.log("Doors data that failed:", doorsData);
            } else {
              console.log("✅ Venue doors saved");
            }
          } else {
            console.log("⚠️ No doors to save");
          }
        } catch (doorsErr: any) {
          console.error("❌ Exception in doors save:", doorsErr);
        }

        // 3B. Save Allowed Event Types
        try {
          if (selectedEventTypes.length > 0) {
            console.log("🔍 Raw selectedEventTypes:", selectedEventTypes);
            const eventTypesData = selectedEventTypes
              .map((categoryId) => {
                const parsedId = parseInt(categoryId, 10);
                console.log(`📌 Parsing categoryId "${categoryId}" -> ${parsedId}`);
                return {
                  venue_id: venueId,
                  category_id: isNaN(parsedId) ? null : parsedId, // Log NaN values
                };
              })
              .filter(item => {
                if (item.category_id === null) {
                  console.warn("⚠️ Filtered out null category_id");
                  return false;
                }
                return true;
              });
            
            if (eventTypesData.length === 0) {
              console.log("⚠️ No valid event types after parsing");
            } else {
              console.log("🎉 Inserting event types:", eventTypesData);
              const { error: eventTypesError } = await supabase.from('venue_allowed_event_types').insert(eventTypesData);
              if (eventTypesError) {
                console.error("❌ Error saving event types:", eventTypesError);
                console.log("Event types data that failed:", eventTypesData);
              } else {
                console.log("✅ Venue allowed event types saved");
              }
            }
          } else {
            console.log("⚠️ No event types selected");
          }
        } catch (eventTypesErr: any) {
          console.error("❌ Exception in event types save:", eventTypesErr);
        }

        // 3C. Save Gallery Images
        try {
          if (galleryImages.length > 0) {
            console.log("📤 Starting gallery image uploads to Cloudinary...");
            
            // Upload all gallery images to Cloudinary first
            const uploadedImageUrls: string[] = [];
            for (let i = 0; i < galleryImages.length; i++) {
              try {
                console.log(`⏳ Uploading image ${i + 1}/${galleryImages.length}...`);
                const uploadedUrl = await uploadGalleryImageToCloudinary(galleryImages[i]);
                if (uploadedUrl) {
                  uploadedImageUrls.push(uploadedUrl);
                  console.log(`✅ Image ${i + 1} uploaded: ${uploadedUrl}`);
                } else {
                  console.error(`❌ Failed to upload image ${i + 1}`);
                  Alert.alert("Error", `Failed to upload image ${i + 1}. Please try again.`);
                  return;
                }
              } catch (uploadError) {
                console.error(`❌ Error uploading image ${i + 1}:`, uploadError);
                Alert.alert("Error", `Failed to upload image ${i + 1}: ${uploadError}`);
                return;
              }
            }
            
            // Now save the uploaded URLs to database
            const imagesData = uploadedImageUrls.map((imagePath, index) => ({
              venue_id: venueId,
              image_path: imagePath,
              is_thumbnail: index === thumbnailIndex,
            }));
            console.log("🖼️ Inserting images to database:", imagesData);
            const { error: imagesError } = await supabase.from('venue_images').insert(imagesData);
            if (imagesError) {
              console.error("❌ Error saving images:", imagesError);
              console.log("Images data that failed:", imagesData);
              Alert.alert("Error", "Failed to save images to database");
              return;
            } else {
              console.log("✅ Venue images saved successfully");
            }
          } else {
            console.log("⚠️ No gallery images to save");
          }
        } catch (imagesErr: any) {
          console.error("❌ Exception in images save:", imagesErr);
          Alert.alert("Error", "Failed to save gallery images");
          return;
        }

        // 3D. Save Floor Plan (dimensions and visualization image)
        try {
          // Upload floor plan visualization image to Cloudinary
          const floorPlanImageUrl = await uploadFloorPlanImageToCloudinary();
          
          const floorPlanData = {
            venue_id: venueId,
            floor_plan_file: floorPlanImageUrl || 'pending-upload',
            floor_plan_type: 'visualization',
            length: parseFloat(length),
            width: parseFloat(width),
            height: parseFloat(ceilingHeight) || 0,
            area_sqm: parseFloat(floorArea),
          };
          console.log("📐 Inserting floor plan dimensions:", floorPlanData);
          const { error: floorPlanError } = await supabase.from('venue_floor_plans').insert([floorPlanData]);
          if (floorPlanError) {
            console.error("❌ Error saving floor plan:", floorPlanError);
            console.log("Floor plan data that failed:", floorPlanData);
          } else {
              console.log("✅ Venue floor plan saved");
            }
        } catch (floorPlanErr: any) {
          console.error("❌ Exception in floor plan save:", floorPlanErr);
        }

        // 3E. Save Contact Information
        try {
          const contactsData = [];
          if (email) {
            console.log("📧 Adding email contact:", email);
            contactsData.push({
              venue_id: venueId,
              contact_type: 'Email',
              contact_value: email,
            });
          }
          if (phone) {
            console.log("📞 Adding phone contact:", phone);
            contactsData.push({
              venue_id: venueId,
              contact_type: 'Phone',
              contact_value: phone,
            });
          }
          if (contactsData.length > 0) {
            console.log("💾 Inserting", contactsData.length, "contacts:", contactsData);
            const { error: contactsError } = await supabase.from('venue_contacts').insert(contactsData);
            if (contactsError) {
              console.error("❌ Error saving contacts:", contactsError);
              console.log("Contact data that failed:", contactsData);
            } else {
              console.log("✅ Venue contacts saved");
            }
          } else {
            console.log("⚠️ No contacts to save");
          }
        } catch (contactErr: any) {
          console.error("❌ Exception in contact save:", contactErr);
        }

        // 3F. Save Base Rate (Pricing)
        try {
          if (hourlyRate) {
            const baseRateData = {
              venue_id: venueId,
              rate_type: 'Hourly',
              base_price: parseFloat(hourlyRate),
              weekend_price: parseFloat(weekendRate) || 0,
              holiday_price: parseFloat(holidayRate) || 0,
              included_hours: 0,
              min_hours: parseInt(minimumHours) || 2,
              notes: pricingNotes || null,
              is_active: true,
            };
            console.log("💰 Inserting base rate:", baseRateData);
            const { error: rateError } = await supabase.from('venue_base_rates').insert([baseRateData]);
            if (rateError) {
              console.error("❌ Error saving base rate:", rateError);
              console.log("Base rate data that failed:", baseRateData);
            } else {
              console.log("✅ Venue base rate saved");
            }
          } else {
            console.log("⚠️ No hourly rate provided");
          }
        } catch (rateErr: any) {
          console.error("❌ Exception in base rate save:", rateErr);
        }

        // 3G. Save Overtime Rates (if applicable)
        try {
          if (overtimeRates && overtimeRates.length > 0) {
            const overtimeData = overtimeRates.map((or) => ({
              venue_id: venueId,
              rate_type: or.rateType,
              start_hour: or.startHour ? parseInt(or.startHour) : null,
              end_hour: or.endHour ? parseInt(or.endHour) : null,
              price_per_hour: parseFloat(or.pricePerHour),
              is_active: true,
            }));
            console.log("⏰ Inserting", overtimeData.length, "overtime rates:", overtimeData);
            const { error: overtimeError } = await supabase.from('venue_overtime_rates').insert(overtimeData);
            if (overtimeError) {
              console.error("❌ Error saving overtime rates:", overtimeError);
              console.log("Overtime rates data that failed:", overtimeData);
            } else {
              console.log("✅ Venue overtime rates saved");
            }
          } else {
            console.log("⚠️ No overtime rates provided");
          }
        } catch (overtimeErr: any) {
          console.error("❌ Exception in overtime rates save:", overtimeErr);
        }

        // 3H. Save Venue Specifications
        try {
          if (venueSpecifications && venueSpecifications.length > 0) {
            const specsData = venueSpecifications.map((spec) => ({
              venue_id: venueId,
              specification_name: spec.name,
              specification_value: spec.value,
              notes: spec.notes || null,
            }));
            console.log("📋 Inserting", specsData.length, "specifications:", specsData);
            const { error: specsError } = await supabase.from('venue_specifications').insert(specsData);
            if (specsError) {
              console.error("❌ Error saving specifications:", specsError);
              console.log("Specifications data that failed:", specsData);
            } else {
              console.log("✅ Venue specifications saved");
            }
          } else {
            console.log("⚠️ No specifications added");
          }
        } catch (specsErr: any) {
          console.error("❌ Exception in specifications save:", specsErr);
        }
        // 3I. Save Facilities
        try {
          if (facilities && facilities.length > 0) {
            const facilitiesData = facilities.map((facility: string) => ({
              venue_id: venueId,
              facility_name: facility,
              description: null,
            }));
            console.log("🏢 Inserting", facilitiesData.length, "facilities:", facilitiesData);
            const { error: facilitiesError } = await supabase.from('venue_facilities').insert(facilitiesData);
            if (facilitiesError) {
              console.error("❌ Error saving facilities:", facilitiesError);
              console.log("Facilities data that failed:", facilitiesData);
            } else {
              console.log("✅ Venue facilities saved");
            }
          } else {
            console.log("⚠️ No facilities selected");
          }
        } catch (facilitiesErr: any) {
          console.error("❌ Exception in facilities save:", facilitiesErr);
        }

        // 3J. Save Packages
        try {
          let packageIds: { [key: number]: number } = {};
          if (packages.length > 0) {
            const packagesData = packages.map((pkg) => ({
              venue_id: venueId,
              package_name: pkg.name,
              description: pkg.inclusions || '',
              duration_hours: parseInt(pkg.duration) || 0,
              duration_days: null,
              base_price: parseFloat(pkg.price) || 0,
              min_hours: parseInt(pkg.duration) || 0,
              notes: null,
              is_active: true,
            }));
            console.log("📦 Inserting packages:", packagesData);
            const { error: packagesError, data: packagesResult } = await supabase.from('venue_packages').insert(packagesData).select();

            if (packagesError) {
              console.error("❌ Error saving packages:", packagesError);
              console.log("Packages data that failed:", packagesData);
            } else {
              // Map old package IDs to new database IDs
              if (packagesResult) {
                packagesResult.forEach((pkg, index) => {
                  packageIds[packages[index].id] = pkg.package_id;
                });
              }
              console.log("✅ Venue packages saved with IDs:", packageIds);
            }
          } else {
            console.log("⚠️ No packages to save");
          }

          // 3K. Save Package Inclusions (from package inclusions field)
          if (packages.length > 0 && Object.keys(packageIds).length > 0) {
            const inclusionsData: any[] = [];
            packages.forEach((pkg) => {
              if (pkg.inclusions && packageIds[pkg.id]) {
                // Split inclusions by comma and create separate records
                const inclusions = pkg.inclusions.split(',').map(inc => inc.trim()).filter(inc => inc);
                console.log(`📦 Package "${pkg.name}" has inclusions:`, inclusions);
                inclusions.forEach((inclusion) => {
                  inclusionsData.push({
                    package_id: packageIds[pkg.id],
                    inclusion_name: inclusion,
                    is_active: true,
                  });
                });
              } else {
                console.log(`ℹ️ Package "${pkg.name}" has no inclusions or no ID mapping`);
              }
            });

            if (inclusionsData.length > 0) {
              console.log("📝 Inserting package inclusions:", inclusionsData);
              const { error: inclusionsError } = await supabase.from('venue_package_inclusions').insert(inclusionsData);
              if (inclusionsError) {
                console.error("❌ Error saving package inclusions:", inclusionsError);
                console.log("Inclusions data that failed:", inclusionsData);
              } else {
                console.log("✅ Package inclusions saved");
              }
            } else {
              console.log("⚠️ No package inclusions to save");
            }
          }
        } catch (packagesErr: any) {
          console.error("❌ Exception in packages save:", packagesErr);
        }

        // 3L. Save Rules (from rules and regulations field)
        try {
          if (rulesAndRegulations) {
            const rulesData = {
              venue_id: venueId,
              rule_text: rulesAndRegulations,
              is_active: true,
            };
            console.log("📋 Inserting rules:", rulesData);
            const { error: rulesError } = await supabase.from('venue_rules').insert([rulesData]);
            if (rulesError) {
              console.error("❌ Error saving rules:", rulesError);
              console.log("Rules data that failed:", rulesData);
            } else {
              console.log("✅ Venue rules saved");
            }
          } else {
            console.log("⚠️ No rules provided");
          }
        } catch (rulesErr: any) {
          console.error("❌ Exception in rules save:", rulesErr);
        }

        // 3M. Save Venue Type Link (venue_venue_types)
        try {
          if (type) {
            // type now stores the venue_type_id directly (not the name)
            const venueTypeLink = {
              venue_id: venueId,
              venue_type_id: parseInt(type), // Convert to integer since it's stored as string in state
            };
            console.log("🏷️ Inserting venue type link:", venueTypeLink);
            const { error: venueTypeLinkError } = await supabase.from('venue_venue_types').insert([venueTypeLink]);
            if (venueTypeLinkError) {
              console.error("❌ Error linking venue type:", venueTypeLinkError);
              console.log("Venue type link data that failed:", venueTypeLink);
              // Don't throw - type link is informational
            } else {
              console.log("✅ Venue type link saved");
            }
          } else {
            console.log("⚠️ No venue type selected");
          }
        } catch (typeErr: any) {
          console.error("❌ Exception in venue type link save:", typeErr);
        }

        // ===== ASSIGN VENUE ADMIN =====
        try {
          if (selectedVenueAdmin && selectedVenueAdmin.venue_admin_id) {
            console.log("👤 Assigning venue admin:", selectedVenueAdmin.venue_admin_id);
            const { error: adminAssignError } = await supabase
              .from('venue_admin_assignments')
              .insert({
                venue_id: venueId,
                venue_admin_id: selectedVenueAdmin.venue_admin_id,
                is_owner: true,
              });
            
            if (adminAssignError) {
              console.error("❌ Error assigning venue admin:", adminAssignError);
              console.log("Admin assignment data that failed:", { venue_id: venueId, venue_admin_id: selectedVenueAdmin.venue_admin_id });
            } else {
              console.log("✅ Venue admin assigned successfully");
            }
          } else {
            console.log("⚠️ No venue admin selected, skipping admin assignment");
          }
        } catch (adminErr: any) {
          console.error("❌ Exception in venue admin assignment:", adminErr);
        }

        // ===== SUCCESS =====
        console.log("🎉 All venue data saved successfully!");
        console.log("📝 Setting isSaving to false...");
        setIsSaving(false);
        
        // Show success message
        Alert.alert("Success", "Venue created successfully!", [
          {
            text: "OK",
            onPress: () => {
              console.log("✅ User pressed OK, navigating to all_venues...");
              // Use replace() instead of push() so user can't go back to add_venue
              router.replace('/administrator_pages/venue_management/all_venues');
            },
          },
        ]);
        
        // Backup navigation in case user doesn't press OK
        setTimeout(() => {
          console.log("⏱️ Backup timeout: navigating to all_venues...");
          router.replace('/administrator_pages/venue_management/all_venues');
        }, 3000);
      } catch (relatedErr: any) {
        console.error("❌ Error saving related data:", relatedErr);
        console.error("Error details:", relatedErr.message);
        setIsSaving(false);
        Alert.alert("Partial Error", `Venue created but some data failed to save: ${relatedErr.message}`);
        // Still navigate after a delay
        setTimeout(() => {
          console.log("⏱️ Timeout reached, navigating to all_venues...");
          router.replace('/administrator_pages/venue_management/all_venues');
        }, 2000);
      }
    } catch (err: any) {
      console.error("❌ CRITICAL VENUE SAVE ERROR:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.error("Error object:", err);
      setIsSaving(false);
      Alert.alert("Error", err.message || "An unexpected error occurred while saving the venue");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AdminHeader isDarkMode={isDarkMode} onThemeToggle={toggleTheme} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      <View style={styles.mainContainer}>
        <AdminSidebar isDarkMode={isDarkMode} isOpen={sidebarOpen} />

        <ScrollView ref={scrollViewRef} style={[styles.content, { backgroundColor: theme.bg }]}>
          {/* Sticky Header */}
          <View style={[styles.stickyHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowBackConfirmModal(true)}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create New Venue</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: isSaving ? Palette.gray300 : Palette.primary },
              ]}
              disabled={isSaving}
              onPress={() => {
                if (currentStep < totalSteps) {
                  if (canProceedToNextStep()) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    // Show validation errors for current step
                    if (currentStep === 1) {
                      if (!selectedVenueAdmin) setVenueAdminError({ field: "venueAdmin", message: VALIDATION_MESSAGES.required("Venue administrator"), isValid: false });
                      if (!validateRequired(name)) setNameError({ field: "name", message: VALIDATION_MESSAGES.required("Venue name"), isValid: false });
                      if (!validateRequired(type)) setTypeError({ field: "type", message: VALIDATION_MESSAGES.required("Venue type"), isValid: false });
                      if (!validateRequired(streetAddress)) setStreetAddressError({ field: "streetAddress", message: VALIDATION_MESSAGES.required("Street address"), isValid: false });
                      if (!validateRequired(city)) setCityError({ field: "city", message: VALIDATION_MESSAGES.required("City"), isValid: false });
                      if (!validateRequired(province)) setProvinceError({ field: "province", message: VALIDATION_MESSAGES.required("Province"), isValid: false });
                      if (!validateRequired(zipCode)) setZipCodeError({ field: "zipCode", message: VALIDATION_MESSAGES.required("Zip code"), isValid: false });
                      if (!validateRequired(capacity)) setCapacityError({ field: "capacity", message: VALIDATION_MESSAGES.required("Capacity"), isValid: false });
                    } else if (currentStep === 2) {
                      if (!validateRequired(length)) setLengthError({ field: "length", message: VALIDATION_MESSAGES.required("Length"), isValid: false });
                      if (!validateRequired(width)) setWidthError({ field: "width", message: VALIDATION_MESSAGES.required("Width"), isValid: false });
                      if (!validateRequired(floorArea)) setFloorAreaError({ field: "floorArea", message: VALIDATION_MESSAGES.required("Floor area"), isValid: false });
                      if (venueSpecifications.length === 0) setVenueSpecificationsError({ field: "venueSpecifications", message: "Please add at least one venue specification", isValid: false });
                      if (selectedEventTypes.length === 0) setEventTypesError({ field: "eventTypes", message: "Please select at least one event type", isValid: false });
                    } else if (currentStep === 3) {
                      if (galleryImages.length === 0) setGalleryImagesError({ field: "galleryImages", message: "At least one gallery image is required", isValid: false });
                      if (rulesAndRegulations.trim() === "") setRulesAndRegulationsError({ field: "rulesAndRegulations", message: "Rules and regulations are required", isValid: false });
                      if (facilities.length === 0) setFacilitiesError({ field: "facilities", message: "At least one facility is required", isValid: false });
                    }
                  }
                } else {
                  // On final step (Step 4), validate before saving
                  if (!canProceedToNextStep()) {
                    console.log("❌ Validation failed. Debugging info:", {
                      hourlyRate: !!hourlyRate,
                      email: email,
                      emailValid: validateEmail(email),
                      phone: !!phone,
                      packagesCount: packages.length,
                    });
                    if (!validateRequired(hourlyRate)) setHourlyRateError({ field: "hourlyRate", message: VALIDATION_MESSAGES.required("Hourly rate"), isValid: false });
                    if (!validateRequired(minimumHours) || (minimumHours && parseInt(minimumHours) <= 0)) setMinimumHoursError({ field: "minimumHours", message: "Minimum hours must be greater than 0", isValid: false });
                    if (!validateRequired(weekendRate) || (weekendRate && parseFloat(weekendRate) < 0)) setWeekendRateError({ field: "weekendRate", message: "Weekend rate must be a valid non-negative number", isValid: false });
                    if (!validateRequired(holidayRate) || (holidayRate && parseFloat(holidayRate) < 0)) setHolidayRateError({ field: "holidayRate", message: "Holiday rate must be a valid non-negative number", isValid: false });
                    if (!validateEmail(email)) setEmailError({ field: "email", message: "Valid email is required", isValid: false });
                    if (!validateRequired(phone)) setPhoneError({ field: "phone", message: VALIDATION_MESSAGES.required("Phone number"), isValid: false });
                    if (packages.length === 0) setPackagesError({ field: "packages", message: "At least one venue package is required", isValid: false });
                  } else {
                    console.log("✅ Validation passed! Calling handleSaveVenue()");
                    handleSaveVenue();
                  }
                }
              }}
            >
              <Text style={[styles.saveButtonText, { color: Palette.black }]}>{isSaving ? "Saving..." : "Save Venue"}</Text>
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
                    onPress={() => {
                      // Allow navigation to completed steps or next step only if current step is valid
                      if (index + 1 < currentStep || (index + 1 === currentStep + 1 && canProceedToNextStep())) {
                        setCurrentStep(index + 1);
                      } else if (index + 1 < currentStep) {
                        setCurrentStep(index + 1);
                      }
                    }}
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
                <Text style={[styles.label, { color: theme.text }]}>Assign Venue Administrator *</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: !venueAdminError.isValid ? Palette.red : theme.border }]}
                  onPress={() => setVenueAdminDropdownOpen(!venueAdminDropdownOpen)}
                >
                  <Text style={[styles.dropdownText, { color: selectedVenueAdmin ? theme.text : theme.textSecondary }]}>
                    {selectedVenueAdmin
                      ? `${selectedVenueAdmin.users?.first_name || ''} ${selectedVenueAdmin.users?.last_name || ''}`
                      : "Select Venue Administrator"}
                  </Text>
                  <Ionicons name={venueAdminDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {venueAdminDropdownOpen && !adminLoading && (
                  <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {venueAdministrators.length > 0 ? (
                      venueAdministrators.map((admin) => (
                        <TouchableOpacity
                          key={admin.venue_admin_id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedVenueAdmin(admin);
                            setVenueAdminDropdownOpen(false);
                            setVenueAdminError({ field: "", message: "", isValid: true });
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                            {admin.users?.first_name} {admin.users?.last_name}
                          </Text>
                          <Text style={[styles.dropdownItemSubtext, { color: theme.textSecondary }]}>
                            {admin.users?.email}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownItem}>
                        <Text style={[styles.dropdownItemText, { color: theme.textSecondary }]}>
                          No administrators available
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <ValidationError message={venueAdminError.message} visible={!venueAdminError.isValid} />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Venue Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !nameError.isValid ? Palette.red : theme.border }]}
                  placeholder="e.g., Convention Hall A"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameError({ field: "", message: "", isValid: true });
                  }}
                />
                <ValidationError message={nameError.message} visible={!nameError.isValid} />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Venue Type *</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: !typeError.isValid ? Palette.red : theme.border }]}
                  onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
                >
                  <Text style={[styles.dropdownText, { color: type ? theme.text : theme.textSecondary }]}>
                    {type ? venueTypes.find(vt => vt.id.toString() === type)?.name || "Select Venue Type" : "Select Venue Type"}
                  </Text>
                  <Ionicons name={typeDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {typeDropdownOpen && (
                  <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {venueTypes.length > 0 ? (
                      venueTypes.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setType(option.id.toString()); // Store the ID, not the name
                            setTypeDropdownOpen(false);
                            setTypeError({ field: "", message: "", isValid: true });
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity style={styles.dropdownItem} disabled>
                        <Text style={[styles.dropdownItemText, { color: theme.textSecondary }]}>No venue types available</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <ValidationError message={typeError.message} visible={!typeError.isValid} />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Street Address *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !streetAddressError.isValid ? Palette.red : theme.border }]}
                  placeholder="e.g., 123 Main Street"
                  placeholderTextColor={theme.textSecondary}
                  value={streetAddress}
                  onChangeText={(text) => {
                    setStreetAddress(text);
                    setStreetAddressError({ field: "", message: "", isValid: true });
                  }}
                />
                <ValidationError message={streetAddressError.message} visible={!streetAddressError.isValid} />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Barangay *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !barangayError.isValid ? Palette.red : theme.border }]}
                  placeholder="e.g., Barangay San Juan"
                  placeholderTextColor={theme.textSecondary}
                  value={barangay}
                  onChangeText={(text) => {
                    setBarangay(text);
                    setBarangayError({ field: "", message: "", isValid: true });
                  }}
                />
                <ValidationError message={barangayError.message} visible={!barangayError.isValid} />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>City *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !cityError.isValid ? Palette.red : theme.border }]}
                    placeholder="e.g., Manila"
                    placeholderTextColor={theme.textSecondary}
                    value={city}
                    onChangeText={(text) => {
                      setCity(text);
                      setCityError({ field: "", message: "", isValid: true });
                    }}
                  />
                  <ValidationError message={cityError.message} visible={!cityError.isValid} />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Province *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !provinceError.isValid ? Palette.red : theme.border }]}
                    placeholder="e.g., Metro Manila"
                    placeholderTextColor={theme.textSecondary}
                    value={province}
                    onChangeText={(text) => {
                      setProvince(text);
                      setProvinceError({ field: "", message: "", isValid: true });
                    }}
                  />
                  <ValidationError message={provinceError.message} visible={!provinceError.isValid} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 0.5, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Zip Code *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !zipCodeError.isValid ? Palette.red : theme.border }]}
                    placeholder="e.g., 1000"
                    placeholderTextColor={theme.textSecondary}
                    value={zipCode}
                    onChangeText={(text) => {
                      const numericOnly = text.replace(/[^0-9]/g, '');
                      setZipCode(numericOnly);
                      setZipCodeError({ field: "", message: "", isValid: true });
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <ValidationError message={zipCodeError.message} visible={!zipCodeError.isValid} />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Country</Text>
                  <View style={[styles.input, { backgroundColor: theme.lightBg, borderColor: theme.border, justifyContent: "center" }]}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>Philippines</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Capacity *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !capacityError.isValid ? Palette.red : theme.border }]}
                  placeholder="e.g., 1200"
                  placeholderTextColor={theme.textSecondary}
                  value={capacity}
                  onChangeText={(text) => {
                    setCapacity(text);
                    setCapacityError({ field: "", message: "", isValid: true });
                    if (parseInt(text) > 10000) {
                      setCapacityWarning("Capacity exceeds reasonable limit (10,000 max)");
                    } else {
                      setCapacityWarning("");
                    }
                  }}
                  keyboardType="numeric"
                />
                <ValidationError message={capacityError.message} visible={!capacityError.isValid} />
                {capacityWarning && <Text style={{ color: Palette.red, fontSize: 12, marginTop: 4 }}>{capacityWarning}</Text>}
              </View>
            </View>
          )}

          {/* Step 2: Technical Specs */}
          {currentStep === 2 && (
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Venue Specifications Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Specifications *</Text>

                {/* Specification Name Input */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Specification Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Capacity, Parking, Air Conditioning"
                    placeholderTextColor={theme.textSecondary}
                    value={customSpecificationInput}
                    onChangeText={setCustomSpecificationInput}
                  />
                </View>

                {/* Specification Value Input */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Specification Value *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., 300 pax, 50 slots, Yes"
                    placeholderTextColor={theme.textSecondary}
                    value={specValueInput}
                    onChangeText={setSpecValueInput}
                  />
                </View>

                {/* Specification Notes Input */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.notesInput, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Maximum seated capacity, On-site parking available"
                    placeholderTextColor={theme.textSecondary}
                    value={specNotesInput}
                    onChangeText={setSpecNotesInput}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Add Button */}
                <TouchableOpacity
                  style={[styles.addFacilityButton, { backgroundColor: Palette.primary, alignSelf: 'flex-start', marginBottom: 16 }]}
                  onPress={addCustomSpecification}
                >
                  <Ionicons name="add" size={20} color={Palette.black} />
                  <Text style={[styles.addFacilityButtonText, { color: Palette.black }]}>Add Specification</Text>
                </TouchableOpacity>

                {/* Specifications Display */}
                {venueSpecifications.length > 0 && (
                  <View style={styles.customFacilitiesContainer}>
                    <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Added Specifications ({venueSpecifications.length})</Text>
                    {venueSpecifications.map((spec, index) => (
                      <View
                        key={spec.id}
                        style={[
                          styles.specificationCard,
                          { backgroundColor: theme.lightBg, borderColor: theme.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.specificationName, { color: theme.text }]}>{spec.name}</Text>
                          <Text style={[styles.specificationValue, { color: theme.textSecondary }]}>{spec.value}</Text>
                          {spec.notes && (
                            <Text style={[styles.specificationNotes, { color: theme.textSecondary }]}>{spec.notes}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setVenueSpecifications(venueSpecifications.filter((s) => s.id !== spec.id));
                          }}
                          style={{ marginLeft: 12 }}
                        >
                          <Ionicons name="trash" size={18} color={Palette.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <ValidationError message={venueSpecificationsError.message} visible={!venueSpecificationsError.isValid} />
              </View>

              {/* Allowed Event Types Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Allowed Event Types *</Text>
                {eventCategoriesLoading ? (
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 16 }}>Loading event types...</Text>
                ) : eventCategories.length > 0 ? (
                  <View style={styles.eventTypesGrid}>
                    {eventCategories.map((eventType) => (
                      <TouchableOpacity
                        key={eventType.id}
                        style={[
                          styles.eventTypeChip,
                          {
                            backgroundColor: selectedEventTypes.includes(eventType.id.toString()) ? Palette.blue : theme.lightBg,
                            borderColor: selectedEventTypes.includes(eventType.id.toString()) ? Palette.blue : theme.border,
                          },
                        ]}
                        onPress={() => {
                          toggleEventType(eventType.id.toString());
                          setEventTypesError({ field: "", message: "", isValid: true });
                        }}
                      >
                        <Text
                          style={[
                            styles.eventTypeChipText,
                            { color: selectedEventTypes.includes(eventType.id.toString()) ? "white" : theme.text },
                          ]}
                        >
                          {eventType.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 16 }}>No event types available</Text>
                )}
                <ValidationError message={eventTypesError.message} visible={!eventTypesError.isValid} />
              </View>

              {/* Floor Plan & Venue Measurement Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Measurement & Floor Plan *</Text>

                <View style={styles.measurementGrid}>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Width (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !widthError.isValid ? Palette.red : theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={width}
                      onChangeText={(text) => {
                        setWidth(text);
                        if (text.trim()) {
                          setWidthError({ field: "", message: "", isValid: true });
                        }
                        if (length && text) {
                          const area = (parseFloat(length) * parseFloat(text)).toFixed(2);
                          setFloorArea(area);
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                    {!widthError.isValid && (
                      <ValidationError
                        message={widthError.message}
                        visible={!widthError.isValid}
                      />
                    )}
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Length (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !lengthError.isValid ? Palette.red : theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={length}
                      onChangeText={(text) => {
                        setLength(text);
                        if (text.trim()) {
                          setLengthError({ field: "", message: "", isValid: true });
                        }
                        if (width && text) {
                          const area = (parseFloat(text) * parseFloat(width)).toFixed(2);
                          setFloorArea(area);
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                    {!lengthError.isValid && (
                      <ValidationError
                        message={lengthError.message}
                        visible={!lengthError.isValid}
                      />
                    )}
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Height (meters) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={ceilingHeight}
                      onChangeText={setCeilingHeight}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.measurementField}>
                    <Text style={[styles.label, { color: theme.text }]}>Area (sqm)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={floorArea}
                      editable={false}
                    />
                  </View>
                </View>

                {/* Floor Plan Visualizer */}
                <VenueFloorPlanVisualizer
                  ref={floorPlanVisualizerRef}
                  length={length}
                  width={width}
                  doors={doors}
                  theme={theme}
                />
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
                          type: "Single",
                          width: "",
                          height: "",
                          offsetFromCorner: "",
                          swingDirection: "Inward",
                          hingePosition: "Left",
                          wall: "Left",
                        },
                      ]);
                      setNextDoorId(nextDoorId + 1);
                      setDoorsError({ field: "", message: "", isValid: true });
                    }}
                  >
                    <Ionicons name="add" size={20} color={Palette.black} />
                    <Text style={[styles.addDoorButtonText, { color: Palette.black }]}>Add Door</Text>
                  </TouchableOpacity>
                </View>
                {!doorsError.isValid && (
                  <ValidationError
                    message={doorsError.message}
                    visible={!doorsError.isValid}
                  />
                )}

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
                        <TouchableOpacity 
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => {
                            const dropdownKey = `door-type-${door.id}`;
                            setOpenDropdowns({
                              ...openDropdowns,
                              [dropdownKey]: !openDropdowns[dropdownKey]
                            });
                          }}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.type}</Text>
                          <Ionicons name={openDropdowns[`door-type-${door.id}`] ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {openDropdowns[`door-type-${door.id}`] && (
                          <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {DOOR_TYPES.map((doorType) => (
                              <TouchableOpacity
                                key={doorType}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, type: doorType } : d));
                                  setDoors(updatedDoors);
                                  setOpenDropdowns({ ...openDropdowns, [`door-type-${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{doorType}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Wall</Text>
                        <TouchableOpacity 
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => {
                            const dropdownKey = `door-wall-${door.id}`;
                            setOpenDropdowns({
                              ...openDropdowns,
                              [dropdownKey]: !openDropdowns[dropdownKey]
                            });
                          }}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.wall || "Select Wall"}</Text>
                          <Ionicons name={openDropdowns[`door-wall-${door.id}`] ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {openDropdowns[`door-wall-${door.id}`] && (
                          <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {DOOR_WALLS.map((wallOption) => (
                              <TouchableOpacity
                                key={wallOption}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, wall: wallOption } : d));
                                  setDoors(updatedDoors);
                                  setOpenDropdowns({ ...openDropdowns, [`door-wall-${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{wallOption}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Width (meters)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: !door.width ? Palette.red : theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.width}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, width: text } : d));
                            setDoors(updatedDoors);
                            setDoorsError({ field: "", message: "", isValid: true });
                          }}
                        />
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Height (meters)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: !door.height ? Palette.red : theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.height}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, height: text } : d));
                            setDoors(updatedDoors);
                            setDoorsError({ field: "", message: "", isValid: true });
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.doorFieldsGrid}>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Offset From Corner (m)</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: !door.offsetFromCorner ? Palette.red : theme.border }]}
                          placeholder=""
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="decimal-pad"
                          value={door.offsetFromCorner}
                          onChangeText={(text) => {
                            const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, offsetFromCorner: text } : d));
                            setDoors(updatedDoors);
                            setDoorsError({ field: "", message: "", isValid: true });
                          }}
                        />
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Swing Direction</Text>
                        <TouchableOpacity 
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => {
                            const dropdownKey = `door-swing-${door.id}`;
                            setOpenDropdowns({
                              ...openDropdowns,
                              [dropdownKey]: !openDropdowns[dropdownKey]
                            });
                          }}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.swingDirection}</Text>
                          <Ionicons name={openDropdowns[`door-swing-${door.id}`] ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {openDropdowns[`door-swing-${door.id}`] && (
                          <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {DOOR_SWING_DIRECTIONS.map((swingDir) => (
                              <TouchableOpacity
                                key={swingDir}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, swingDirection: swingDir } : d));
                                  setDoors(updatedDoors);
                                  setOpenDropdowns({ ...openDropdowns, [`door-swing-${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{swingDir}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Hinge Position</Text>
                        <TouchableOpacity 
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => {
                            const dropdownKey = `door-hinge-${door.id}`;
                            setOpenDropdowns({
                              ...openDropdowns,
                              [dropdownKey]: !openDropdowns[dropdownKey]
                            });
                          }}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.hingePosition}</Text>
                          <Ionicons name={openDropdowns[`door-hinge-${door.id}`] ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {openDropdowns[`door-hinge-${door.id}`] && (
                          <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {DOOR_HINGE_POSITIONS.map((hingePos) => (
                              <TouchableOpacity
                                key={hingePos}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  const updatedDoors = doors.map((d) => (d.id === door.id ? { ...d, hingePosition: hingePos } : d));
                                  setDoors(updatedDoors);
                                  setOpenDropdowns({ ...openDropdowns, [`door-hinge-${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{hingePos}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
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
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Gallery / Assets *</Text>

                {/* Thumbnail Preview Banner */}
                {galleryImages.length > 0 && galleryImages[thumbnailIndex] ? (
                  <View style={styles.thumbnailPreviewContainer}>
                    <Image 
                      source={{ uri: galleryImages[thumbnailIndex] }} 
                      style={styles.thumbnailPreview}
                      onError={() => console.error('Failed to load thumbnail preview')}
                    />
                    <View style={styles.thumbnailPreviewBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="white" />
                      <Text style={{ color: "white", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Featured Thumbnail</Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Upload Images (Max 10) *</Text>
                  <TouchableOpacity
                    style={[styles.addImageButton, { borderColor: !galleryImagesError.isValid ? Palette.red : theme.border }]}
                    onPress={async () => {
                      if (galleryImages.length >= 10) {
                        Alert.alert("Limit Reached", "Maximum 10 images allowed");
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: false,
                        quality: 1,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setGalleryImages([...galleryImages, result.assets[0].uri]);
                        setGalleryImagesError({ field: "", message: "", isValid: true });
                      }
                    }}
                  >
                    <Ionicons name="cloud-upload" size={24} color={Palette.primary} />
                    <Text style={[styles.addImageButtonText, { color: theme.text }]}>Upload Image</Text>
                  </TouchableOpacity>
                </View>

                {galleryImages.length === 0 && (
                  <View style={{ alignItems: "center", paddingVertical: 32, marginVertical: 16, borderRadius: 12, backgroundColor: theme.lightBg, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border }}>
                    <Ionicons name="image-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12, textAlign: "center" }]}>No images uploaded yet</Text>
                    <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 4, textAlign: "center" }]}>Upload venue photos to get started</Text>
                  </View>
                )}

                {galleryImages.length > 0 && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>
                      Images ({galleryImages.length}/10)
                    </Text>
                    <View style={styles.imagesGrid}>
                      {galleryImages.map((imageUri, index) => (
                        <View key={index} style={[styles.imageCard, { backgroundColor: theme.card, borderColor: thumbnailIndex === index ? Palette.primary : theme.border }]}>
                          {imageUri ? (
                            <Image 
                              source={{ uri: imageUri }} 
                              style={styles.imagePreview}
                              onError={() => console.error('Failed to load image at index', index)}
                            />
                          ) : (
                            <View style={[styles.imagePreview, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                              <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                            </View>
                          )}
                          <View style={styles.imageActions}>
                            <TouchableOpacity
                              style={[styles.thumbnailBadge, { backgroundColor: thumbnailIndex === index ? Palette.primary : theme.lightBg }]}
                              onPress={() => setThumbnailIndex(index)}
                            >
                              <Text style={[styles.badgeText, { color: thumbnailIndex === index ? "white" : theme.text }]}>
                                {thumbnailIndex === index ? "Thumbnail" : "Set"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.removeImageButton}
                              onPress={() => {
                                const newImages = galleryImages.filter((_, i) => i !== index);
                                setGalleryImages(newImages);
                                if (thumbnailIndex === index) {
                                  setThumbnailIndex(Math.max(0, newImages.length - 1));
                                }
                              }}
                            >
                              <Ionicons name="trash" size={18} color={Palette.red} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <ValidationError message={galleryImagesError.message} visible={!galleryImagesError.isValid} />
              </View>

              {/* Facilities / Inclusions Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Facilities / Inclusions *</Text>

                {/* Custom Facility Input */}
                <View style={styles.customFacilityContainer}>
                  <TextInput
                    style={[styles.customFacilityInput, { backgroundColor: theme.lightBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Add facility (e.g., Tables & Chairs, Sound System, etc.)"
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

                {/* Facilities Display */}
                {facilities.length > 0 && (
                  <View style={styles.customFacilitiesContainer}>
                    <View style={styles.customFacilitiesGrid}>
                      {facilities.map((facility, index) => (
                        <View
                          key={index}
                          style={[
                            styles.customFacilityChip,
                            { backgroundColor: Palette.blue, borderColor: Palette.blue },
                          ]}
                        >
                          <Text style={[styles.facilityChipText, { color: "white" }]}>{facility}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setFacilities(facilities.filter((f) => f !== facility));
                            }}
                            style={{ marginLeft: 8 }}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <ValidationError message={facilitiesError.message} visible={!facilitiesError.isValid} />
              </View>

              {/* Rules & Regulations Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Regulations *</Text>
                <TextInput
                  style={[
                    styles.rulesInput,
                    { backgroundColor: theme.lightBg, color: theme.text, borderColor: !rulesAndRegulationsError.isValid ? Palette.red : theme.border },
                  ]}
                  placeholder="Enter venue rules and regulations (e.g., No loud music after 10 PM, No nails or tape on walls)"
                  placeholderTextColor={theme.textSecondary}
                  value={rulesAndRegulations}
                  onChangeText={(text) => {
                    setRulesAndRegulations(text);
                    setRulesAndRegulationsError({ field: "", message: "", isValid: true });
                  }}
                  multiline
                  numberOfLines={4}
                />
                <ValidationError message={rulesAndRegulationsError.message} visible={!rulesAndRegulationsError.isValid} />
              </View>
            </View>
          )}

          
          {/* Step 4: Pricing & Contact */}
          {currentStep === 4 && (
            <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Pricing & Packages Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Base Pricing *</Text>

                {/* Hourly & Minimum Hours */}
                <View style={styles.pricingGrid}>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Hourly Rate (₱) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !hourlyRateError.isValid ? Palette.red : theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={hourlyRate}
                      onChangeText={(text) => {
                        setHourlyRate(text);
                        setHourlyRateError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="decimal-pad"
                    />
                    <ValidationError message={hourlyRateError.message} visible={!hourlyRateError.isValid} />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Minimum Hours *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !minimumHoursError.isValid ? Palette.red : theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={minimumHours}
                      onChangeText={(text) => {
                        setMinimumHours(text);
                        setMinimumHoursError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="numeric"
                    />
                    <ValidationError message={minimumHoursError.message} visible={!minimumHoursError.isValid} />
                  </View>
                </View>

                {/* Weekend & Holiday Rates */}
                <View style={styles.pricingGrid}>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Weekend Rate (₱) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !weekendRateError.isValid ? Palette.red : theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={weekendRate}
                      onChangeText={(text) => {
                        setWeekendRate(text);
                        setWeekendRateError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="decimal-pad"
                    />
                    <ValidationError message={weekendRateError.message} visible={!weekendRateError.isValid} />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={[styles.label, { color: theme.text }]}>Holiday Rate (₱) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !holidayRateError.isValid ? Palette.red : theme.border }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      value={holidayRate}
                      onChangeText={(text) => {
                        setHolidayRate(text);
                        setHolidayRateError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="decimal-pad"
                    />
                    <ValidationError message={holidayRateError.message} visible={!holidayRateError.isValid} />
                  </View>
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

              {/* Overtime Rates Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                <View style={styles.packageHeaderContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Overtime Rates (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.addPackageButton, { backgroundColor: Palette.primary }]}
                    onPress={addOvertimeRate}
                  >
                    <Ionicons name="add" size={18} color={Palette.black} />
                    <Text style={[styles.addPackageButtonText, { color: Palette.black }]}>Add Rate</Text>
                  </TouchableOpacity>
                </View>

                {overtimeRates.map((rate, index) => (
                  <View key={rate.id} style={[styles.packageCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                    <View style={styles.packageCardHeader}>
                      <Text style={[styles.packageCardTitle, { color: theme.text }]}>Rate {index + 1}</Text>
                      <TouchableOpacity onPress={() => deleteOvertimeRate(rate.id)}>
                        <Ionicons name="trash" size={20} color={Palette.red} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.pricingGrid, { overflow: 'visible', zIndex: 5 }]}>
                      <View style={[styles.priceField, { overflow: 'visible', zIndex: 6 }]}>
                        <Text style={[styles.label, { color: theme.text }]}>Rate Type</Text>
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`overtimeRateType_${rate.id}`]: !openDropdowns[`overtimeRateType_${rate.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{rate.rateType}</Text>
                          <Ionicons name={openDropdowns[`overtimeRateType_${rate.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`overtimeRateType_${rate.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4, zIndex: 100 }]}>
                            {["Hourly", "Daily"].map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateOvertimeRate(rate.id, "rateType", type);
                                  setOpenDropdowns({ ...openDropdowns, [`overtimeRateType_${rate.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{type}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.priceField}>
                        <Text style={[styles.label, { color: theme.text }]}>Price Per Hour (₱)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="0.00"
                          placeholderTextColor={theme.textSecondary}
                          value={rate.pricePerHour}
                          onChangeText={(val) => updateOvertimeRate(rate.id, 'pricePerHour', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.pricingGrid}>
                      <View style={styles.priceField}>
                        <Text style={[styles.label, { color: theme.text }]}>Start Hour</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary}
                          value={rate.startHour}
                          onChangeText={(val) => updateOvertimeRate(rate.id, 'startHour', val)}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.priceField}>
                        <Text style={[styles.label, { color: theme.text }]}>End Hour (Optional)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary}
                          value={rate.endHour}
                          onChangeText={(val) => updateOvertimeRate(rate.id, 'endHour', val)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}

                {overtimeRates.length === 0 && (
                  <Text style={[styles.label, { color: theme.textSecondary, textAlign: 'center', marginTop: 16 }]}>
                    No overtime rates added yet
                  </Text>
                )}
              </View>

              {/* Pricing Packages Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                <View style={styles.packageHeaderContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Packages</Text>
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
                <ValidationError message={packagesError.message} visible={!packagesError.isValid} />
              </View>

              {/* Seasonal Pricing Card */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                <View style={styles.packageHeaderContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Seasonal Pricing (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.addPackageButton, { backgroundColor: Palette.primary }]}
                    onPress={addSeasonalPrice}
                  >
                    <Ionicons name="add" size={18} color={Palette.black} />
                    <Text style={[styles.addPackageButtonText, { color: Palette.black }]}>Add Season</Text>
                  </TouchableOpacity>
                </View>

                {seasonalPrices.length > 0 ? (
                  seasonalPrices.map((season, index) => (
                    <View key={season.id} style={[styles.packageCard, { backgroundColor: theme.lightBg, borderColor: theme.border }]}>
                      <View style={styles.packageCardHeader}>
                        <Text style={[styles.packageCardTitle, { color: theme.text }]}>Season {index + 1}</Text>
                        <TouchableOpacity onPress={() => deleteSeasonalPrice(season.id)}>
                          <Ionicons name="trash" size={20} color={Palette.red} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.packageFieldsGrid}>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Season Name</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g., Summer Peak"
                            placeholderTextColor={theme.textSecondary}
                            value={season.seasonName}
                            onChangeText={(value) => updateSeasonalPrice(season.id, "seasonName", value)}
                          />
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.textSecondary}
                            value={season.startDate}
                            onChangeText={(value) => updateSeasonalPrice(season.id, "startDate", value)}
                          />
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.textSecondary}
                            value={season.endDate}
                            onChangeText={(value) => updateSeasonalPrice(season.id, "endDate", value)}
                          />
                        </View>
                      </View>

                      <View style={styles.packageFieldsGrid}>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Rate Type</Text>
                          <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <TouchableOpacity
                              style={styles.dropdownButton}
                              onPress={() => setOpenDropdowns({ ...openDropdowns, [`seasonalRateType_${season.id}`]: !openDropdowns[`seasonalRateType_${season.id}`] })}
                            >
                              <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{season.rateType}</Text>
                              <Ionicons name={openDropdowns[`seasonalRateType_${season.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                            </TouchableOpacity>
                            {openDropdowns[`seasonalRateType_${season.id}`] && (
                              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {["Hourly", "Daily", "Package", "All"].map((type) => (
                                  <TouchableOpacity
                                    key={type}
                                    style={styles.dropdownMenuItem}
                                    onPress={() => {
                                      updateSeasonalPrice(season.id, "rateType", type);
                                      setOpenDropdowns({ ...openDropdowns, [`seasonalRateType_${season.id}`]: false });
                                    }}
                                  >
                                    <Text style={[styles.dropdownMenuItemText, { color: theme.text }]}>{type}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Modifier Type</Text>
                          <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <TouchableOpacity
                              style={styles.dropdownButton}
                              onPress={() => setOpenDropdowns({ ...openDropdowns, [`modifierType_${season.id}`]: !openDropdowns[`modifierType_${season.id}`] })}
                            >
                              <Text style={[styles.dropdownButtonText, { color: theme.text }]}>{season.modifierType}</Text>
                              <Ionicons name={openDropdowns[`modifierType_${season.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                            </TouchableOpacity>
                            {openDropdowns[`modifierType_${season.id}`] && (
                              <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {["Fixed", "Percentage"].map((type) => (
                                  <TouchableOpacity
                                    key={type}
                                    style={styles.dropdownMenuItem}
                                    onPress={() => {
                                      updateSeasonalPrice(season.id, "modifierType", type);
                                      setOpenDropdowns({ ...openDropdowns, [`modifierType_${season.id}`]: false });
                                    }}
                                  >
                                    <Text style={[styles.dropdownMenuItemText, { color: theme.text }]}>{type}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.packageField}>
                          <Text style={[styles.label, { color: theme.text }]}>Modifier Value</Text>
                          <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.textSecondary}
                            value={season.modifierValue}
                            onChangeText={(value) => updateSeasonalPrice(season.id, "modifierValue", value)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: theme.textSecondary, textAlign: "center", marginVertical: 16 }]}>
                    No seasonal pricing added yet
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
                          borderColor: !emailError.isValid ? Palette.red : theme.border,
                        },
                      ]}
                      placeholder="info@venue.com"
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setEmailError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="email-address"
                    />
                    <ValidationError message={emailError.message} visible={!emailError.isValid} />
                  </View>

                  <View style={styles.contactField}>
                    <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.lightBg, color: theme.text, borderColor: !phoneError.isValid ? Palette.red : theme.border }]}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor={theme.textSecondary}
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        setPhoneError({ field: "", message: "", isValid: true });
                      }}
                      keyboardType="phone-pad"
                    />
                    <ValidationError message={phoneError.message} visible={!phoneError.isValid} />
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
              style={[
                styles.navButton,
                { backgroundColor: Palette.primary },
              ]}
              onPress={() => {
                if (currentStep < totalSteps) {
                  // Validate current step before moving forward
                  validateAndProceedToNextStep();
                } else {
                  handleSaveVenue();
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
  formRow: {
    flexDirection: "row",
    gap: 8,
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
  customFacilitiesContainer: {
    marginTop: 16,
  },
  customFacilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  customFacilityChip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
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
  addImageButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  addImageButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  thumbnailPreviewContainer: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  thumbnailPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailPreviewBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 6,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  thumbnailBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  specInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
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
  dropdownItemSubtext: {
    fontSize: 11,
    marginTop: 2,
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
  specificationCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  specificationName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  specificationValue: {
    fontSize: 13,
    marginBottom: 4,
  },
  specificationNotes: {
    fontSize: 12,
    fontStyle: "italic",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  dropdownButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 0,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownMenuItemText: {
    fontSize: 13,
  },
});
