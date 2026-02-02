import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Palette } from '../../../../assets/colors/palette';
import AdminHeader from '../../../components/admin-header';
import AdminSidebar from '../../../components/admin-sidebar';
import VenueFloorPlanVisualizer from '../../../components/venue-floor-plan-visualizer';
import { useTheme } from '../../../context/theme-context';
import { supabase } from '../../../services/supabase';
import {
  createVenueFacility,
  createVenueImage,
  deleteVenueFacility,
  deleteVenueImage,
  fetchCompleteVenueDetails,
  fetchVenueAdministrators,
  updateVenue,
  updateVenueBaseRate,
  updateVenueContact,
  updateVenueDoor,
  updateVenueFloorPlan,
  updateVenueRule
} from '../../../services/venueService';

interface Door {
  id: string;
  type: string;
  width: string;
  height: string;
  offsetFromCorner: string;
  wall: string;
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
  const { venueId } = useLocalSearchParams();
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = isDarkMode ? Palette.dark : Palette.light;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [venueData, setVenueData] = useState<any>(null);

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

  // Venue Admin State
  const [venueAdministrators, setVenueAdministrators] = useState<any[]>([]);
  const [selectedVenueAdmin, setSelectedVenueAdmin] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [showVenueAdminDropdown, setShowVenueAdminDropdown] = useState(false);
  const [venueAdminError, setVenueAdminError] = useState(false);

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

  // Step 2: Technical Specs
  const [length, setLength] = useState('60');
  const [width, setWidth] = useState('45');
  const [floorArea, setFloorArea] = useState('2700');
  const [ceilingHeight, setCeilingHeight] = useState('14');
  const [stageAvailable, setStageAvailable] = useState(true);
  const [acAvailable, setAcAvailable] = useState(true);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [handicappedAccess, setHandicappedAccess] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [eventCategoriesLoading, setEventCategoriesLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [floorPlanInput, setFloorPlanInput] = useState('');
  const [floorPlanLoadError, setFloorPlanLoadError] = useState(false);
  const floorPlanVisualizerRef = useRef<any>(null);

  // Track original data for change detection
  const [originalData, setOriginalData] = useState<any>(null);

  // Load venue administrators on component mount
  useEffect(() => {
    loadVenueData();
    loadVenueAdministrators();
    loadEventCategories();
  }, [venueId]);

  const loadVenueData = async () => {
    try {
      setLoading(true);
      if (!venueId) {
        Alert.alert("Error", "Venue ID not found");
        router.back();
        return;
      }

      const { data, error } = await fetchCompleteVenueDetails(parseInt(venueId as string));
      
      if (error || !data) {
        Alert.alert("Error", "Failed to load venue details");
        router.back();
        return;
      }

      setVenueData(data);
      
      // Populate form fields from loaded data
      setVenueName(data.venue?.venue_name || '');
      setStreetAddress(data.venue?.street_address || '');
      setBarangay(data.venue?.barangay || '');
      setCity(data.venue?.city || '');
      setProvince(data.venue?.province || '');
      setZipCode(data.venue?.zip_code || '');
      setCapacity(data.venue?.max_capacity?.toString() || '');
      
      // Load floor plan measurements first (primary source)
      if (data.floorPlans && data.floorPlans.length > 0) {
        const floorPlan = data.floorPlans[0];
        if (floorPlan.length) setLength(floorPlan.length?.toString() || '');
        if (floorPlan.width) setWidth(floorPlan.width?.toString() || '');
        if (floorPlan.area_sqm) setFloorArea(floorPlan.area_sqm?.toString() || '');
        if (floorPlan.height) setCeilingHeight(floorPlan.height?.toString() || '');
      }
      
      // Load specifications - match by specification_name and load as array
      if (data.specifications && data.specifications.length > 0) {
        const specMap = data.specifications.reduce((acc: any, spec: any) => {
          acc[spec.specification_name] = spec.specification_value;
          return acc;
        }, {});
        
        // Load custom specifications into array (exclude dimension specs)
        const customSpecs = data.specifications.filter((spec: any) => 
          !['Length', 'Width', 'Floor Area', 'Ceiling Height'].includes(spec.specification_name)
        );
        
        if (customSpecs.length > 0) {
          let maxId = 1;
          const specsArray = customSpecs.map((spec: any) => {
            const id = maxId++;
            return {
              id,
              name: spec.specification_name,
              value: spec.specification_value,
              notes: spec.notes || '',
            };
          });
          setVenueSpecifications(specsArray);
          setNextSpecId(maxId);
        }
      }
      
      // Load contacts
      if (data.contacts && data.contacts.length > 0) {
        const emailContact = data.contacts.find((c: any) => c.contact_type === 'Email');
        const phoneContact = data.contacts.find((c: any) => c.contact_type === 'Phone');
        if (emailContact) setEmail(emailContact.contact_value);
        if (phoneContact) setPhone(phoneContact.contact_value);
      }
      
      // Load facilities - separate default and custom
      if (data.facilities && data.facilities.length > 0) {
        const facilityNames = data.facilities.map((f: any) => f.facility_name);
        const defaultFacilityList = ["Tables & Chairs", "Sound System", "Projector", "Wi-Fi", "Stage", "Lighting System", "Kitchen", "Catering Service"];
        const defaultSelected = facilityNames.filter((f: string) => defaultFacilityList.includes(f));
        const customSelected = facilityNames.filter((f: string) => !defaultFacilityList.includes(f));
        setSelectedFacilities(defaultSelected);
        setCustomFacilities(customSelected);
      }
      
      // Load rules
      if (data.rules && data.rules.length > 0) {
        setRules(data.rules.map((r: any) => r.rule_text).join('\n'));
      }
      
      // Load images
      if (data.images && data.images.length > 0) {
        // Filter out blob URLs (they're invalid after page reload)
        const validImages = data.images.filter((img: any) => !img.image_path.startsWith('blob:'));
        console.log("🖼️ Valid images loaded:", validImages.length, "Total in DB:", data.images.length);
        setGalleryImages(validImages.map((img: any) => img.image_path));
        const thumbnailIdx = validImages.findIndex((img: any) => img.is_thumbnail);
        setThumbnailIndex(thumbnailIdx >= 0 ? thumbnailIdx : 0);
      }
      
      // Load doors
      if (data.doors && data.doors.length > 0) {
        console.log("🚪 Loading doors from database:", data.doors);
        setDoors(data.doors.map((door: any) => ({
          id: door.door_id?.toString() || door.id || '',
          type: door.door_type || '',
          width: door.width?.toString() || '',
          height: door.height?.toString() || '',
          offsetFromCorner: door.door_offset?.toString() || '',
          wall: door.wall || 'Left',
          swingDirection: door.swing_direction || '',
          hingePosition: door.hinge_position || '',
        })));
      } else {
        console.log("❌ No doors found in database, using default empty state");
      }
      
      // Load pricing
      if (data.baseRates && data.baseRates.length > 0) {
        const rate = data.baseRates[0];
        setHourlyRate(rate.base_price?.toString() || '');
        setMinimumHours(rate.min_hours?.toString() || '');
        setWeekendRate(rate.weekend_price?.toString() || '');
        setHolidayRate(rate.holiday_price?.toString() || '');
        setPricingNotes(rate.notes || '');
      }
      
      if (data.overtimeRates && data.overtimeRates.length > 0) {
        console.log("⏰ Loading overtime rates:", data.overtimeRates);
        let maxId = 1;
        const overtimeArray = data.overtimeRates.map((or: any) => {
          const id = maxId++;
          return {
            id,
            rateType: or.rate_type || 'Hourly',
            pricePerHour: or.price_per_hour?.toString() || '',
            startHour: or.start_hour?.toString() || '',
            endHour: or.end_hour?.toString() || '',
          };
        });
        setOvertimeRates(overtimeArray);
        setNextOvertimeRateId(maxId);
      }
      
      // Load packages with inclusions
      console.log('📦 Packages:', data.packages);
      console.log('📝 Package Inclusions:', data.packageInclusions);
      if (data.packages && data.packages.length > 0) {
        setPricingPackages(data.packages.map((pkg: any) => {
          // Find all inclusions for this package
          const packageInclusionsList = data.packageInclusions
            ?.filter((inc: any) => inc.package_id === pkg.package_id)
            .map((inc: any) => inc.inclusion_name)
            .join(', ') || '';
          
          console.log(`✅ Package ${pkg.package_id}:`, { inclusions: packageInclusionsList });
          
          return {
            id: pkg.package_id?.toString() || pkg.id || '',
            name: pkg.package_name || '',
            duration: pkg.duration_hours?.toString() || '',
            price: pkg.base_price?.toString() || '',
            inclusions: packageInclusionsList || pkg.inclusions || '',
          };
        }));
      }

      // Load allowed event types from venue_allowed_event_types
      console.log('🔍 venue_allowed_event_types data:', data.allowedEventTypes);
      if (data.allowedEventTypes && data.allowedEventTypes.length > 0) {
        const eventTypeNames = data.allowedEventTypes
          .map((evt: any) => {
            console.log('📌 Processing event type:', evt);
            return evt.event_categories?.category_name || evt.category_name;
          })
          .filter((name: any) => name);
        console.log('✅ Selected event types:', eventTypeNames);
        setSelectedEventTypes(eventTypeNames);
      } else {
        console.warn('⚠️ No allowed event types found for this venue');
      }

      // Load seasonal pricing
      if (data.seasonalPricing && data.seasonalPricing.length > 0) {
        console.log("📅 Loading seasonal pricing:", data.seasonalPricing);
        let maxId = 1;
        const seasonalArray = data.seasonalPricing.map((sp: any) => {
          const id = maxId++;
          return {
            id,
            seasonName: sp.season_name || '',
            startDate: sp.start_date || '',
            endDate: sp.end_date || '',
            rateType: sp.rate_type || 'Hourly',
            modifierType: sp.modifier_type || 'Fixed',
            modifierValue: sp.modifier_value?.toString() || '',
          };
        });
        setSeasonalPrices(seasonalArray);
        setNextSeasonalPriceId(maxId);
      }

      // Store original data for change detection
      setOriginalData({
        venueName: data.venue?.venue_name || '',
        streetAddress: data.venue?.street_address || '',
        barangay: data.venue?.barangay || '',
        city: data.venue?.city || '',
        province: data.venue?.province || '',
        zipCode: data.venue?.zip_code || '',
        capacity: data.venue?.max_capacity?.toString() || '',
        email: data.contacts?.find((c: any) => c.contact_type === 'Email')?.contact_value || '',
        phone: data.contacts?.find((c: any) => c.contact_type === 'Phone')?.contact_value || '',
        selectedFacilities: data.facilities?.map((f: any) => f.facility_name) || [],
        rules: data.rules?.map((r: any) => r.rule_text).join('\n') || '',
        selectedEventTypes: data.allowedEventTypes?.map((evt: any) => evt.event_categories?.category_name || evt.category_name).filter((n: any) => n) || [],
        selectedVenueAdminId: null, // Will be populated after loading admins
      });
    } catch (err: any) {
      console.error("Error loading venue:", err);
      Alert.alert("Error", "Failed to load venue data");
      router.back();
    } finally {
      setLoading(false);
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

      // Load which admin is selected for this venue
      if (venueId) {
        const numVenueId = parseInt(venueId as string);
        const { data: assignment } = await supabase
          .from('venue_admin_assignments')
          .select(`
            *,
            venue_administrators(
              *,
              users(user_id, email, first_name, last_name, phone_number)
            )
          `)
          .eq('venue_id', numVenueId)
          .single();
        
        if (assignment?.venue_administrators) {
          console.log('👤 Selected venue admin:', assignment.venue_administrators);
          setSelectedVenueAdmin(assignment.venue_administrators);
          
          // Update originalData with the selected admin ID for change detection
          setOriginalData((prev: any) => ({
            ...prev,
            selectedVenueAdminId: assignment.venue_administrators.venue_admin_id,
          }));
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const [doors, setDoors] = useState<Door[]>([
    {
      id: '1',
      type: 'Single Door',
      width: '1.0',
      height: '2.2',
      offsetFromCorner: '0.5',
      wall: 'Left',
      swingDirection: 'Inward',
      hingePosition: 'Left',
    },
    {
      id: '2',
      type: 'Double Door',
      width: '2.0',
      height: '2.2',
      offsetFromCorner: '5.0',
      wall: 'Right',
      swingDirection: 'Outward',
      hingePosition: 'Right',
    },
  ]);

  // Step 3: Media & Rules
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
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
  const [pricingNotes, setPricingNotes] = useState('Rates are per hour. Discounts available for bookings over 8 hours');
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

  // Seasonal Pricing Interface
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

  // Overtime Rates Interface
  interface OvertimeRate {
    id: number;
    rateType: string;
    pricePerHour: string;
    startHour: string;
    endHour: string;
  }
  const [overtimeRates, setOvertimeRates] = useState<OvertimeRate[]>([]);
  const [nextOvertimeRateId, setNextOvertimeRateId] = useState(1);

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

  const loadEventCategories = async () => {
    try {
      setEventCategoriesLoading(true);
      const { data, error } = await supabase
        .from('event_categories')
        .select('category_id, category_name')
        .order('category_name', { ascending: true });
      
      console.log('📋 Event categories loaded:', { data, error });
      
      if (error) {
        console.error('❌ Error loading event categories:', error);
        setEventCategories([]);
      } else {
        const mappedCategories = data?.map((ec: any) => ({
          id: ec.category_id,
          name: ec.category_name,
        })) || [];
        console.log('✅ Mapped categories:', mappedCategories);
        setEventCategories(mappedCategories);
      }
    } catch (err: any) {
      console.error('❌ Exception loading event categories:', err);
      setEventCategories([]);
    } finally {
      setEventCategoriesLoading(false);
    }
  };

  // Check if there are any changes compared to original data
  const hasChanges = () => {
    if (!originalData) return false;

    const currentAdminId = selectedVenueAdmin?.venue_admin_id || null;
    const originalAdminId = originalData.selectedVenueAdminId || null;

    return (
      venueName !== originalData.venueName ||
      streetAddress !== originalData.streetAddress ||
      barangay !== originalData.barangay ||
      city !== originalData.city ||
      province !== originalData.province ||
      zipCode !== originalData.zipCode ||
      capacity !== originalData.capacity ||
      email !== originalData.email ||
      phone !== originalData.phone ||
      rules !== originalData.rules ||
      currentAdminId !== originalAdminId ||
      JSON.stringify(selectedFacilities.sort()) !== JSON.stringify(originalData.selectedFacilities.sort()) ||
      JSON.stringify(selectedEventTypes.sort()) !== JSON.stringify(originalData.selectedEventTypes.sort())
    );
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
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    if (thumbnailIndex === index) {
      setThumbnailIndex(Math.max(0, newImages.length - 1));
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

  const addDoor = () => {
    const newDoor: Door = {
      id: Date.now().toString(),
      type: 'Standard Door',
      width: '',
      height: '',
      offsetFromCorner: '',
      wall: 'Left',
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
    if (currentStep === 1) {
      return selectedVenueAdmin && venueName.trim() && venueType && streetAddress.trim() && city.trim() && province.trim() && zipCode.trim() && capacity.trim();
    }
    if (currentStep === 2) {
      return length.trim() && width.trim();
    }
    if (currentStep === 3) {
      return true;
    }
    return false;
  };

  const handleSaveChanges = async () => {
    if (!venueId) {
      Alert.alert("Error", "Venue ID not found");
      return;
    }

    // Check if there are any changes
    if (!hasChanges()) {
      Alert.alert("No Changes", "You haven't made any changes to update.");
      return;
    }

    // Validate venue admin is selected
    if (!selectedVenueAdmin) {
      setVenueAdminError(true);
      Alert.alert("Validation Error", "Please select a venue administrator.");
      return;
    }

    try {
      setIsSaving(true);
      console.log("💾 Starting venue update...");
      const numVenueId = parseInt(venueId as string);

      // ===== UPDATE MAIN VENUE RECORD =====
      console.log("📍 Updating main venue record");
      const { error: venueError } = await updateVenue(numVenueId, {
        venue_name: venueName,
        street_address: streetAddress,
        barangay: barangay,
        city: city,
        province: province,
        zip_code: zipCode,
        max_capacity: parseInt(capacity),
      });

      if (venueError) {
        throw new Error(`Failed to update venue: ${venueError}`);
      }
      console.log("✅ Venue record updated");

      // ===== UPDATE FLOOR PLAN MEASUREMENTS =====
      console.log("📐 Updating floor plan measurements");
      if (venueData?.floorPlans && venueData.floorPlans.length > 0) {
        const floorPlan = venueData.floorPlans[0];
        const floorAreaNum = parseFloat(floorArea) || (parseFloat(length) * parseFloat(width));
        
        const { error: floorPlanError } = await updateVenueFloorPlan(floorPlan.floor_plan_id, {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(ceilingHeight),
          area_sqm: floorAreaNum,
        });
        
        if (floorPlanError) {
          console.warn("⚠️ Warning: Could not update floor plan:", floorPlanError);
        } else {
          console.log("✅ Floor plan updated");
        }
      }

      // ===== UPDATE SPECIFICATIONS =====
      console.log("📋 Updating custom specifications");
      if (venueData?.specifications && venueData.specifications.length > 0) {
        // Only update non-dimension specifications
        const customSpecs = venueData.specifications.filter((spec: any) => 
          !['Length', 'Width', 'Floor Area', 'Ceiling Height'].includes(spec.specification_name)
        );
        
        // Delete old custom specs
        for (const spec of customSpecs) {
          try {
            await supabase.from('venue_specifications').delete().eq('specification_id', spec.specification_id);
          } catch (err) {
            console.warn(`Could not delete spec ${spec.specification_id}:`, err);
          }
        }
      }
      
      // Insert new custom specifications
      if (venueSpecifications.length > 0) {
        const newSpecsData = venueSpecifications.map((spec) => ({
          venue_id: parseInt(venueId as string),
          specification_name: spec.name,
          specification_value: spec.value,
          notes: spec.notes || null,
        }));
        
        try {
          await supabase.from('venue_specifications').insert(newSpecsData);
        } catch (err) {
          console.error("Error inserting custom specifications:", err);
        }
      }
      console.log("✅ Specifications updated");

      // ===== UPDATE CONTACTS =====
      console.log("📧 Updating contacts");
      if (venueData?.contacts && venueData.contacts.length > 0) {
        for (const contact of venueData.contacts) {
          if (contact.contact_type === 'Email' && email) {
            await updateVenueContact(contact.contact_id, { contact_value: email });
          } else if (contact.contact_type === 'Phone' && phone) {
            await updateVenueContact(contact.contact_id, { contact_value: phone });
          }
        }
      }
      console.log("✅ Contacts updated");

      // ===== UPDATE FACILITIES =====
      console.log("🏢 Updating facilities");
      if (venueData?.facilities && venueData.facilities.length > 0) {
        // Delete old facilities and create new ones
        for (const facility of venueData.facilities) {
          await deleteVenueFacility(facility.facility_id);
        }
      }
      // Create new facilities
      for (const facility of selectedFacilities) {
        await createVenueFacility({
          venue_id: numVenueId,
          facility_name: facility,
        });
      }
      console.log("✅ Facilities updated");

      // ===== UPDATE RULES =====
      console.log("📋 Updating rules");
      if (venueData?.rules && venueData.rules.length > 0) {
        const ruleId = venueData.rules[0].rule_id;
        await updateVenueRule(ruleId, { rule_text: rules });
      }
      console.log("✅ Rules updated");

      // ===== UPDATE PRICING =====
      console.log("💰 Updating pricing");
      if (venueData?.baseRates?.[0]?.rate_id) {
        const rateId = venueData.baseRates[0].rate_id;
        await updateVenueBaseRate(rateId, {
          base_price: parseFloat(hourlyRate),
          min_hours: parseInt(minimumHours),
          weekend_price: parseFloat(weekendRate),
          holiday_price: parseFloat(holidayRate),
          notes: pricingNotes,
        });
      }
      console.log("✅ Base pricing updated");

      // ===== UPDATE OVERTIME RATE =====
      console.log("⏰ Updating overtime rates");
      // Delete old overtime rates that have IDs (from database)
      if (venueData?.overtimeRates && venueData.overtimeRates.length > 0) {
        for (const or of venueData.overtimeRates) {
          try {
            if (or.overtime_rate_id) {
              await supabase.from('venue_overtime_rates').delete().eq('overtime_rate_id', or.overtime_rate_id);
            }
          } catch (err) {
            console.warn(`Could not delete overtime rate ${or.overtime_rate_id}:`, err);
          }
        }
      }

      // Insert new overtime rates
      for (const or of overtimeRates) {
        try {
          const overtimeData = {
            venue_id: numVenueId,
            rate_type: or.rateType as any,
            price_per_hour: parseFloat(or.pricePerHour),
            start_hour: or.startHour ? parseInt(or.startHour) : undefined,
            end_hour: or.endHour ? parseInt(or.endHour) : undefined,
          };

          const { error: overtimeError } = await supabase.from('venue_overtime_rates').insert(overtimeData);
          if (overtimeError) {
            console.warn("⚠️ Error inserting overtime rate:", overtimeError);
          }
        } catch (err) {
          console.error("Error inserting overtime rate:", err);
        }
      }
      console.log("✅ Overtime rates updated");

      // ===== UPDATE SEASONAL PRICING =====
      console.log("📅 Updating seasonal pricing");
      // Delete old seasonal pricing that have IDs (from database)
      if (venueData?.seasonalPricing && venueData.seasonalPricing.length > 0) {
        for (const sp of venueData.seasonalPricing) {
          try {
            if (sp.seasonal_pricing_id) {
              await supabase.from('venue_seasonal_pricing').delete().eq('seasonal_pricing_id', sp.seasonal_pricing_id);
            }
          } catch (err) {
            console.warn(`Could not delete seasonal pricing ${sp.seasonal_pricing_id}:`, err);
          }
        }
      }
      
      // Insert new seasonal pricing
      if (seasonalPrices.length > 0) {
        const seasonalData = seasonalPrices.map((sp) => ({
          venue_id: parseInt(venueId as string),
          season_name: sp.seasonName,
          start_date: sp.startDate,
          end_date: sp.endDate,
          rate_type: sp.rateType,
          modifier_type: sp.modifierType,
          modifier_value: parseFloat(sp.modifierValue) || 0,
        }));
        
        try {
          const { error: seasonalError } = await supabase.from('venue_seasonal_pricing').insert(seasonalData);
          if (seasonalError) {
            console.warn("⚠️ Error inserting seasonal pricing:", seasonalError);
          }
        } catch (err) {
          console.error("Error inserting seasonal pricing:", err);
        }
      }
      console.log("✅ Seasonal pricing updated");

      // ===== UPDATE DOORS =====
      console.log("🚪 Updating doors");
      if (venueData?.doors && venueData.doors.length > 0) {
        for (const dbDoor of venueData.doors) {
          const updatedDoor = doors.find((d) => d.id === dbDoor.door_id?.toString());
          if (updatedDoor) {
            const doorTypeMap: { [key: string]: string } = {
              'Single Door': 'Single',
              'Double Door': 'Double',
              'Single': 'Single',
              'Double': 'Double',
            };
            await updateVenueDoor(dbDoor.door_id, {
              door_type: doorTypeMap[updatedDoor.type] || updatedDoor.type,
              width: parseFloat(updatedDoor.width),
              height: parseFloat(updatedDoor.height),
              door_offset: parseFloat(updatedDoor.offsetFromCorner),
              wall: updatedDoor.wall,
              swing_direction: updatedDoor.swingDirection,
              hinge_position: updatedDoor.hingePosition,
            });
          }
        }
      }
      console.log("✅ Doors updated");

      // ===== UPDATE IMAGES =====
      console.log("🖼️ Updating images");
      
      // Upload ONLY new blob URLs to Cloudinary
      const uploadedImageUrls: { [key: string]: string } = {};
      for (let i = 0; i < galleryImages.length; i++) {
        const imageUri = galleryImages[i];
        // Only upload if it's a blob URL (new image that hasn't been uploaded yet)
        if (imageUri.startsWith('blob:') || imageUri.includes('file://')) {
          console.log(`📤 Uploading new image ${i + 1}/${galleryImages.length}...`);
          const uploadedUrl = await uploadGalleryImageToCloudinary(imageUri);
          if (uploadedUrl) {
            uploadedImageUrls[imageUri] = uploadedUrl;
            galleryImages[i] = uploadedUrl; // Update the array with uploaded URL
            setGalleryImages([...galleryImages]);
          } else {
            Alert.alert("Upload Error", `Failed to upload image ${i + 1}. Continuing with other images...`);
          }
        } else {
          console.log(`✓ Image ${i + 1} already uploaded, keeping as is: ${imageUri.substring(0, 50)}...`);
        }
      }
      
      if (venueData?.images && venueData.images.length > 0) {
        // Only delete images that were explicitly removed by user (not in current galleryImages)
        for (const dbImage of venueData.images) {
          if (!galleryImages.includes(dbImage.image_path)) {
            console.log(`🗑️ Deleting removed image: ${dbImage.image_id}`);
            await deleteVenueImage(dbImage.image_id);
          }
        }
        
        // Update thumbnail status for all images
        for (let i = 0; i < galleryImages.length; i++) {
          const image = galleryImages[i];
          const existingImage = venueData.images.find((img: any) => img.image_path === image);
          
          if (!existingImage) {
            // New image - create it
            console.log(`✨ Creating new image: ${image}`);
            await createVenueImage({
              venue_id: numVenueId,
              image_path: image,
              is_thumbnail: i === thumbnailIndex,
            });
          } else {
            // Existing image - just update thumbnail status if changed
            if ((i === thumbnailIndex) !== existingImage.is_thumbnail) {
              console.log(`🔄 Updating thumbnail status for image: ${image}`);
              await supabase
                .from('venue_images')
                .update({ is_thumbnail: i === thumbnailIndex })
                .eq('image_id', existingImage.image_id);
            }
          }
        }
      }
      console.log("✅ Images updated");

      // ===== UPDATE VENUE ADMIN ASSIGNMENT =====
      console.log("👤 Updating venue admin");
      if (selectedVenueAdmin && selectedVenueAdmin.venue_admin_id) {
        // Check if admin assignment already exists
        const { data: existingAssignment } = await supabase
          .from('venue_admin_assignments')
          .select('assignment_id')
          .eq('venue_id', numVenueId)
          .single();
        
        if (existingAssignment) {
          // Update existing assignment
          const { error: updateAdminError } = await supabase
            .from('venue_admin_assignments')
            .update({ venue_admin_id: selectedVenueAdmin.venue_admin_id, is_owner: true })
            .eq('venue_id', numVenueId);
          
          if (updateAdminError) {
            console.error("❌ Error updating venue admin:", updateAdminError);
          } else {
            console.log("✅ Venue admin updated");
          }
        } else {
          // Create new assignment
          const { error: createAdminError } = await supabase
            .from('venue_admin_assignments')
            .insert({
              venue_id: numVenueId,
              venue_admin_id: selectedVenueAdmin.venue_admin_id,
              is_owner: true,
            });
          
          if (createAdminError) {
            console.error("❌ Error creating venue admin assignment:", createAdminError);
          } else {
            console.log("✅ Venue admin assigned");
          }
        }
      } else {
        console.log("⚠️ No venue admin selected");
      }

      // ===== SUCCESS =====
      console.log("🎉 All venue data updated successfully!");
      setIsSaving(false);
      
      Alert.alert("Success", "Venue updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            console.log("✅ User pressed OK, navigating back...");
            router.replace('/administrator_pages/venue_management/all_venues');
          },
        },
      ]);

      // Backup navigation
      setTimeout(() => {
        console.log("⏱️ Backup timeout: navigating back...");
        router.replace('/administrator_pages/venue_management/all_venues');
      }, 3000);
    } catch (err: any) {
      console.error("❌ Error updating venue:", err);
      setIsSaving(false);
      Alert.alert("Error", err.message || "Failed to update venue");
    }
  };

  const handleCancel = () => {
    router.replace('/administrator_pages/venue_management/all_venues');
  };

  const venueTypesList = ['Conference Hall', 'Ballroom', 'Hotel Banquet', 'Restaurant', 'Event Center', 'Country Club', 'Museum'];

  // UI Render

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AdminHeader onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={[{ color: theme.text, marginTop: 10 }]}>Loading venue data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AdminHeader onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

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
              <Text style={[styles.saveButtonText, { color: Palette.black }]}>{isSaving ? "Updating..." : "Save Changes"}</Text>
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
                <Text style={[styles.label, { color: theme.text }]}>Assign Venue Administrator</Text>
                <TouchableOpacity
                  style={[styles.dropdown, { borderColor: venueAdminError ? Palette.red : theme.border }]}
                  onPress={() => setShowVenueAdminDropdown(!showVenueAdminDropdown)}
                >
                  <Text style={[styles.dropdownText, { color: selectedVenueAdmin ? theme.text : theme.textSecondary }]}>
                    {selectedVenueAdmin
                      ? `${selectedVenueAdmin.users?.first_name || ''} ${selectedVenueAdmin.users?.last_name || ''}`
                      : "Select Venue Administrator"}
                  </Text>
                  <Text style={{ color: theme.textSecondary }}>▼</Text>
                </TouchableOpacity>
                {venueAdminError && !selectedVenueAdmin && (
                  <Text style={{ color: Palette.red, fontSize: 12, marginTop: 4 }}>Venue administrator is required</Text>
                )}
                {showVenueAdminDropdown && !adminLoading && (
                  <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {venueAdministrators.length > 0 ? (
                      venueAdministrators.map((admin) => (
                        <TouchableOpacity
                          key={admin.venue_admin_id}
                          style={[
                            styles.dropdownItem,
                            {
                              backgroundColor: selectedVenueAdmin?.venue_admin_id === admin.venue_admin_id ? theme.lightBg : 'transparent',
                              borderBottomColor: theme.border,
                            },
                          ]}
                          onPress={() => {
                            setSelectedVenueAdmin(admin);
                            setShowVenueAdminDropdown(false);
                            setVenueAdminError(false);
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

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Venue Name *</Text>
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

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Barangay *</Text>
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
                    <View style={{ borderWidth: 1, borderRadius: 8, borderColor: theme.border, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 10, minHeight: 40 }}>
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

              {/* Venue Specifications Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
                  style={[styles.addButton, { backgroundColor: Palette.primary, alignSelf: 'flex-start', marginBottom: 16 }]}
                  onPress={() => {
                    if (customSpecificationInput.trim() && specValueInput.trim()) {
                      setVenueSpecifications([
                        ...venueSpecifications,
                        {
                          id: nextSpecId,
                          name: customSpecificationInput,
                          value: specValueInput,
                          notes: specNotesInput,
                        },
                      ]);
                      setNextSpecId(nextSpecId + 1);
                      setCustomSpecificationInput("");
                      setSpecValueInput("");
                      setSpecNotesInput("");
                    }
                  }}
                >
                  <Ionicons name="add" size={20} color={Palette.black} />
                  <Text style={[styles.addButtonText, { color: Palette.black }]}>Add Specification</Text>
                </TouchableOpacity>

                {/* Specifications Display */}
                {venueSpecifications.length > 0 && (
                  <View style={styles.specificationsContainer}>
                    <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Added Specifications ({venueSpecifications.length})</Text>
                    {venueSpecifications.map((spec, index) => (
                      <View
                        key={spec.id}
                        style={[
                          styles.specCard,
                          { backgroundColor: theme.lightBg, borderColor: theme.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.specName, { color: theme.text }]}>{spec.name}</Text>
                          <Text style={[styles.specValue, { color: theme.textSecondary }]}>{spec.value}</Text>
                          {spec.notes && (
                            <Text style={[styles.specNotes, { color: theme.textSecondary }]}>{spec.notes}</Text>
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
              </View>

              {/* Dimensions & Floor Plan Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Venue Measurement & Floor Plan *</Text>

                <View style={styles.dimensionsGrid}>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Width (m) *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={width}
                      onChangeText={(val) => {
                        setWidth(val);
                        if (length && val) {
                          const area = (parseFloat(length) * parseFloat(val)).toFixed(2);
                          setFloorArea(area);
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Length (m) *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={length}
                      onChangeText={(val) => {
                        setLength(val);
                        if (width && val) {
                          const area = (parseFloat(val) * parseFloat(width)).toFixed(2);
                          setFloorArea(area);
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Height (m)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      value={ceilingHeight}
                      onChangeText={setCeilingHeight}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.dimensionField}>
                    <Text style={[styles.label, { color: theme.text }]}>Area (m²)</Text>
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
                </View>

                {/* Floor Plan Visualizer */}
                <VenueFloorPlanVisualizer
                  ref={floorPlanVisualizerRef}
                  length={length}
                  width={width}
                  doors={doors as any}
                  theme={theme}
                />
              </View>

              {/* Allowed Event Types Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Allowed Event Types</Text>
                {eventCategoriesLoading ? (
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 16 }}>Loading event types...</Text>
                ) : eventCategories.length > 0 ? (
                  <View style={styles.chipGrid}>
                    {eventCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedEventTypes.includes(category.id.toString())
                              ? Palette.primary
                              : theme.lightBg,
                            borderColor: selectedEventTypes.includes(category.id.toString())
                              ? Palette.primary
                              : theme.border,
                          },
                        ]}
                        onPress={() => toggleEventType(category.id.toString())}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: selectedEventTypes.includes(category.id.toString()) ? Palette.black : theme.text,
                              fontWeight: selectedEventTypes.includes(category.id.toString()) ? '600' : '400',
                            },
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 16 }}>No event types available</Text>
                )}
              </View>

              {/* Door Placement Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
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
                        <Text style={{ fontSize: 18, color: Palette.red }}>❌</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.doorGrid}>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`doorType_${door.id}`]: !openDropdowns[`doorType_${door.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.type}</Text>
                          <Ionicons name={openDropdowns[`doorType_${door.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`doorType_${door.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4 }]}>
                            {["Single Door", "Double Door", "Sliding Door", "Pocket Door"].map((option) => (
                              <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateDoor(door.id, 'type', option);
                                  setOpenDropdowns({ ...openDropdowns, [`doorType_${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
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
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`doorSwing_${door.id}`]: !openDropdowns[`doorSwing_${door.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.swingDirection}</Text>
                          <Ionicons name={openDropdowns[`doorSwing_${door.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`doorSwing_${door.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4 }]}>
                            {["Inward", "Outward"].map((option) => (
                              <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateDoor(door.id, 'swingDirection', option);
                                  setOpenDropdowns({ ...openDropdowns, [`doorSwing_${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.doorField}>
                        <Text style={[styles.label, { color: theme.text }]}>Hinge</Text>
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`doorHinge_${door.id}`]: !openDropdowns[`doorHinge_${door.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{door.hingePosition}</Text>
                          <Ionicons name={openDropdowns[`doorHinge_${door.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`doorHinge_${door.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4 }]}>
                            {["Left", "Right", "Center"].map((option) => (
                              <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateDoor(door.id, 'hingePosition', option);
                                  setOpenDropdowns({ ...openDropdowns, [`doorHinge_${door.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
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

                <View style={styles.thumbnailGrid}>
                  {galleryImages.length === 0 ? (
                    <View style={{ width: "100%", alignItems: "center", paddingVertical: 32, marginBottom: 16, borderRadius: 12, backgroundColor: theme.lightBg, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border }}>
                      <Ionicons name="image-outline" size={48} color={theme.textSecondary} />
                      <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12, textAlign: "center" }]}>No images added yet</Text>
                      <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 4, textAlign: "center" }]}>Upload images to get started</Text>
                    </View>
                  ) : (
                    galleryImages.map((image, index) => (
                      <View key={index} style={[styles.imageCard, { 
                        backgroundColor: theme.card, 
                        borderColor: thumbnailIndex === index ? Palette.primary : theme.border,
                        borderWidth: 2
                      }]}>
                        {image ? (
                          <Image 
                            source={{ uri: image }} 
                            style={styles.thumbnail}
                            onError={() => console.error('Failed to load image at index', index)}
                          />
                        ) : (
                          <View style={[styles.thumbnail, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                          </View>
                        )}
                        <View style={styles.imageActions}>
                          <TouchableOpacity
                            style={[styles.thumbnailBadge, { 
                              backgroundColor: thumbnailIndex === index ? Palette.primary : theme.lightBg 
                            }]}
                            onPress={() => setThumbnailIndex(index)}
                          >
                            <Text style={[styles.badgeText, { 
                              color: thumbnailIndex === index ? "white" : theme.text 
                            }]}>
                              {thumbnailIndex === index ? "Thumbnail" : "Set"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeGalleryImage(index)}
                          >
                            <Ionicons name="trash" size={18} color={Palette.red} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: theme.lightBg, borderColor: theme.border }]}
                  disabled={galleryImages.length >= 10}
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
                    }
                  }}
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

              {/* Overtime Rates Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Overtime Rates (Optional)</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: Palette.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
                    onPress={addOvertimeRate}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Add Rate</Text>
                  </TouchableOpacity>
                </View>

                {overtimeRates.map((rate) => (
                  <View
                    key={rate.id}
                    style={[
                      styles.packageCard,
                      { backgroundColor: theme.lightBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.packageCardHeader}>
                      <Text style={[styles.label, { color: theme.text, fontWeight: '600', fontSize: 14 }]}>Rate {overtimeRates.indexOf(rate) + 1}</Text>
                      <TouchableOpacity onPress={() => deleteOvertimeRate(rate.id)}>
                        <Ionicons name="trash" size={20} color={Palette.red} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.packageGrid, { overflow: 'visible', zIndex: 5 }]}>
                      <View style={[styles.packageField, { overflow: 'visible', zIndex: 6 }]}>
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
                      <View style={styles.packageField}>
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

                    <View style={styles.packageGrid}>
                      <View style={styles.packageField}>
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
                      <View style={styles.packageField}>
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
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing Packages</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: Palette.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
                    onPress={addPricingPackage}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Add Package</Text>
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
                        <Ionicons name="trash" size={20} color={Palette.red} />
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

              {/* Seasonal Pricing Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Seasonal Pricing (Optional)</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: Palette.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
                    onPress={addSeasonalPrice}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Add Season</Text>
                  </TouchableOpacity>
                </View>

                {seasonalPrices.map((season) => (
                  <View
                    key={season.id}
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
                        placeholder="Season Name"
                        placeholderTextColor={theme.textSecondary}
                        value={season.seasonName}
                        onChangeText={(val) => updateSeasonalPrice(season.id, 'seasonName', val)}
                      />
                      <TouchableOpacity onPress={() => deleteSeasonalPrice(season.id)}>
                        <Ionicons name="trash" size={20} color={Palette.red} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.packageGrid}>
                      <View style={styles.packageField}>
                        <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textSecondary}
                          value={season.startDate}
                          onChangeText={(val) => updateSeasonalPrice(season.id, 'startDate', val)}
                        />
                      </View>
                      <View style={styles.packageField}>
                        <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textSecondary}
                          value={season.endDate}
                          onChangeText={(val) => updateSeasonalPrice(season.id, 'endDate', val)}
                        />
                      </View>
                    </View>

                    <View style={[styles.packageGrid, { overflow: 'visible', zIndex: 5 }]}>
                      <View style={[styles.packageField, { overflow: 'visible', zIndex: 6 }]}>
                        <Text style={[styles.label, { color: theme.text }]}>Rate Type</Text>
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`seasonalRateType_${season.id}`]: !openDropdowns[`seasonalRateType_${season.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{season.rateType}</Text>
                          <Ionicons name={openDropdowns[`seasonalRateType_${season.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`seasonalRateType_${season.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4, zIndex: 100 }]}>
                            {["Hourly", "Daily", "Package", "All"].map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateSeasonalPrice(season.id, "rateType", type);
                                  setOpenDropdowns({ ...openDropdowns, [`seasonalRateType_${season.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{type}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={[styles.packageField, { overflow: 'visible', zIndex: 6 }]}>
                        <Text style={[styles.label, { color: theme.text }]}>Modifier Type</Text>
                        <TouchableOpacity
                          style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}
                          onPress={() => setOpenDropdowns({ ...openDropdowns, [`modifierType_${season.id}`]: !openDropdowns[`modifierType_${season.id}`] })}
                        >
                          <Text style={[styles.dropdownText, { color: theme.text }]}>{season.modifierType}</Text>
                          <Ionicons name={openDropdowns[`modifierType_${season.id}`] ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                        </TouchableOpacity>
                        {openDropdowns[`modifierType_${season.id}`] && (
                          <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4, zIndex: 100 }]}>
                            {["Fixed", "Percentage"].map((type) => (
                              <TouchableOpacity
                                key={type}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  updateSeasonalPrice(season.id, "modifierType", type);
                                  setOpenDropdowns({ ...openDropdowns, [`modifierType_${season.id}`]: false });
                                }}
                              >
                                <Text style={[styles.dropdownItemText, { color: theme.text }]}>{type}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.packageField}>
                        <Text style={[styles.label, { color: theme.text }]}>Modifier Value</Text>
                        <TextInput
                          style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                          ]}
                          placeholder="0.00"
                          placeholderTextColor={theme.textSecondary}
                          value={season.modifierValue}
                          onChangeText={(val) => updateSeasonalPrice(season.id, 'modifierValue', val)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
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
  specInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
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
  dropdownItemSubtext: {
    fontSize: 12,
    marginTop: 2,
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
  formGroup: {
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  specificationsContainer: {
    marginTop: 16,
    gap: 8,
  },
  specCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  specName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 13,
    marginBottom: 4,
  },
  specNotes: {
    fontSize: 12,
    fontStyle: 'italic',
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
    height: 200,
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
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  thumbnailPreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPreviewBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
  removeImageButton: {
    padding: 8,
  },
});
