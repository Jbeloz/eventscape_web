import type {
    Venue,
    VenueAdminAssignment,
    VenueBaseRate,
    VenueBlockedDate,
    VenueContact,
    VenueFacility,
    VenueImage,
    VenueOvertimeRate,
    VenuePackage,
    VenuePackageInclusion,
    VenueRule,
    VenueSeasonalPricing,
    VenueType,
    VenueWithDetails
} from '../models/types';
import { supabase } from './supabase';

// ===== VENUE CORE OPERATIONS =====

// Fetch all venues
export const fetchVenues = async () => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Venue[], error: null };
  } catch (err: any) {
    console.error('Error fetching venues:', err);
    return { data: null, error: err.message };
  }
};

// Get single venue by ID
export const getVenueById = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (error) throw error;
    return { data: data as Venue, error: null };
  } catch (err: any) {
    console.error('Error fetching venue:', err);
    return { data: null, error: err.message };
  }
};

// Get venue with all details
export const getVenueWithDetails = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        venue_venue_types(venue_type_id),
        venue_contacts(*),
        venue_images(*),
        venue_facilities(*),
        venue_rules(*),
        venue_floor_plans(*),
        venue_doors(*),
        venue_base_rates(*),
        venue_overtime_rates(*),
        venue_packages(*),
        venue_blocked_dates(*),
        venue_specifications(*)
      `)
      .eq('venue_id', venueId)
      .single();

    if (error) throw error;
    return { data: data as VenueWithDetails, error: null };
  } catch (err: any) {
    console.error('Error fetching venue details:', err);
    return { data: null, error: err.message };
  }
};

// Create new venue
export const createVenue = async (venueData: Omit<Venue, 'venue_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .insert([venueData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      // Insert might have succeeded even without select returning data
      return { data: venueData as Venue, error: null };
    }
    
    return { data: data[0] as Venue, error: null };
  } catch (err: any) {
    console.error('Error creating venue:', err);
    return { data: null, error: err.message || JSON.stringify(err) };
  }
};

// Update venue
export const updateVenue = async (venueId: number, updates: Partial<Venue>) => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('venue_id', venueId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as Venue, error: null };
  } catch (err: any) {
    console.error('Error updating venue:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue
export const deleteVenue = async (venueId: number) => {
  try {
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('venue_id', venueId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue:', err);
    return { error: err.message };
  }
};

// ===== VENUE TYPES =====

// Fetch all venue types
export const fetchVenueTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('venue_types')
      .select('*')
      .order('type_name', { ascending: true });

    if (error) throw error;
    return { data: data as VenueType[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue types:', err);
    return { data: null, error: err.message };
  }
};

// Create venue type
export const createVenueType = async (typeName: string) => {
  try {
    console.log("Creating venue type:", typeName);
    const { data, error } = await supabase
      .from('venue_types')
      .insert([{ type_name: typeName }])
      .select();

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('No data returned from insert');
      return { data: null, error: 'No data returned from server' };
    }
    
    return { data: data[0] as VenueType, error: null };
  } catch (err: any) {
    console.error('Error creating venue type:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
};

// Update venue type
export const updateVenueType = async (venueTypeId: number, updates: Partial<VenueType>) => {
  try {
    const { data, error } = await supabase
      .from('venue_types')
      .update(updates)
      .eq('venue_type_id', venueTypeId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueType, error: null };
  } catch (err: any) {
    console.error('Error updating venue type:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue type
export const deleteVenueType = async (venueTypeId: number) => {
  try {
    const { error } = await supabase
      .from('venue_types')
      .delete()
      .eq('venue_type_id', venueTypeId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue type:', err);
    return { error: err.message };
  }
};

// Assign venue type to venue
export const assignVenueType = async (venueId: number, venueTypeId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_venue_types')
      .insert([{ venue_id: venueId, venue_type_id: venueTypeId }])
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (err: any) {
    console.error('Error assigning venue type:', err);
    return { data: null, error: err.message };
  }
};

// Remove venue type from venue
export const removeVenueType = async (venueId: number, venueTypeId: number) => {
  try {
    const { error } = await supabase
      .from('venue_venue_types')
      .delete()
      .eq('venue_id', venueId)
      .eq('venue_type_id', venueTypeId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error removing venue type:', err);
    return { error: err.message };
  }
};

// ===== VENUE CONTACTS =====

// Fetch venue contacts
export const fetchVenueContacts = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_contacts')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueContact[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue contacts:', err);
    return { data: null, error: err.message };
  }
};

// Create venue contact
export const createVenueContact = async (contactData: Omit<VenueContact, 'contact_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_contacts')
      .insert([contactData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueContact, error: null };
  } catch (err: any) {
    console.error('Error creating venue contact:', err);
    return { data: null, error: err.message };
  }
};

// Update venue contact
export const updateVenueContact = async (contactId: number, updates: Partial<VenueContact>) => {
  try {
    const { data, error } = await supabase
      .from('venue_contacts')
      .update(updates)
      .eq('contact_id', contactId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueContact, error: null };
  } catch (err: any) {
    console.error('Error updating venue contact:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue contact
export const deleteVenueContact = async (contactId: number) => {
  try {
    const { error } = await supabase
      .from('venue_contacts')
      .delete()
      .eq('contact_id', contactId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue contact:', err);
    return { error: err.message };
  }
};

// ===== VENUE IMAGES =====

// Fetch venue images
export const fetchVenueImages = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_images')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueImage[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue images:', err);
    return { data: null, error: err.message };
  }
};

// Create venue image
export const createVenueImage = async (imageData: Omit<VenueImage, 'image_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_images')
      .insert([imageData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueImage, error: null };
  } catch (err: any) {
    console.error('Error creating venue image:', err);
    return { data: null, error: err.message };
  }
};

// Update venue image
export const updateVenueImage = async (imageId: number, updates: Partial<VenueImage>) => {
  try {
    const { data, error } = await supabase
      .from('venue_images')
      .update(updates)
      .eq('image_id', imageId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueImage, error: null };
  } catch (err: any) {
    console.error('Error updating venue image:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue image
export const deleteVenueImage = async (imageId: number) => {
  try {
    const { error } = await supabase
      .from('venue_images')
      .delete()
      .eq('image_id', imageId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue image:', err);
    return { error: err.message };
  }
};

// ===== VENUE FACILITIES =====

// Fetch venue facilities
export const fetchVenueFacilities = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_facilities')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueFacility[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue facilities:', err);
    return { data: null, error: err.message };
  }
};

// Create venue facility
export const createVenueFacility = async (facilityData: Omit<VenueFacility, 'facility_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_facilities')
      .insert([facilityData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueFacility, error: null };
  } catch (err: any) {
    console.error('Error creating venue facility:', err);
    return { data: null, error: err.message };
  }
};

// Update venue facility
export const updateVenueFacility = async (facilityId: number, updates: Partial<VenueFacility>) => {
  try {
    const { data, error } = await supabase
      .from('venue_facilities')
      .update(updates)
      .eq('facility_id', facilityId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueFacility, error: null };
  } catch (err: any) {
    console.error('Error updating venue facility:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue facility
export const deleteVenueFacility = async (facilityId: number) => {
  try {
    const { error } = await supabase
      .from('venue_facilities')
      .delete()
      .eq('facility_id', facilityId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue facility:', err);
    return { error: err.message };
  }
};

// ===== VENUE RULES =====

// Fetch venue rules
export const fetchVenueRules = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_rules')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueRule[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue rules:', err);
    return { data: null, error: err.message };
  }
};

// Create venue rule
export const createVenueRule = async (ruleData: Omit<VenueRule, 'rule_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_rules')
      .insert([ruleData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueRule, error: null };
  } catch (err: any) {
    console.error('Error creating venue rule:', err);
    return { data: null, error: err.message };
  }
};

// Update venue rule
export const updateVenueRule = async (ruleId: number, updates: Partial<VenueRule>) => {
  try {
    const { data, error } = await supabase
      .from('venue_rules')
      .update(updates)
      .eq('rule_id', ruleId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueRule, error: null };
  } catch (err: any) {
    console.error('Error updating venue rule:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue rule
export const deleteVenueRule = async (ruleId: number) => {
  try {
    const { error } = await supabase
      .from('venue_rules')
      .delete()
      .eq('rule_id', ruleId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue rule:', err);
    return { error: err.message };
  }
};

// ===== VENUE BASE RATES =====

// Fetch venue base rates
export const fetchVenueBaseRates = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_base_rates')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueBaseRate[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue base rates:', err);
    return { data: null, error: err.message };
  }
};

// Create venue base rate
export const createVenueBaseRate = async (rateData: Omit<VenueBaseRate, 'rate_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_base_rates')
      .insert([rateData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueBaseRate, error: null };
  } catch (err: any) {
    console.error('Error creating venue base rate:', err);
    return { data: null, error: err.message };
  }
};

// Update venue base rate
export const updateVenueBaseRate = async (rateId: number, updates: Partial<VenueBaseRate>) => {
  try {
    const { data, error } = await supabase
      .from('venue_base_rates')
      .update(updates)
      .eq('rate_id', rateId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueBaseRate, error: null };
  } catch (err: any) {
    console.error('Error updating venue base rate:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue base rate
export const deleteVenueBaseRate = async (rateId: number) => {
  try {
    const { error } = await supabase
      .from('venue_base_rates')
      .delete()
      .eq('rate_id', rateId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue base rate:', err);
    return { error: err.message };
  }
};

// ===== VENUE OVERTIME RATES =====

// Fetch venue overtime rates
export const fetchVenueOvertimeRates = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_overtime_rates')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueOvertimeRate[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue overtime rates:', err);
    return { data: null, error: err.message };
  }
};

// Create venue overtime rate
export const createVenueOvertimeRate = async (rateData: Omit<VenueOvertimeRate, 'overtime_rate_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_overtime_rates')
      .insert([rateData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueOvertimeRate, error: null };
  } catch (err: any) {
    console.error('Error creating venue overtime rate:', err);
    return { data: null, error: err.message };
  }
};

// Update venue overtime rate
export const updateVenueOvertimeRate = async (overtimeRateId: number, updates: Partial<VenueOvertimeRate>) => {
  try {
    const { data, error } = await supabase
      .from('venue_overtime_rates')
      .update(updates)
      .eq('overtime_rate_id', overtimeRateId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueOvertimeRate, error: null };
  } catch (err: any) {
    console.error('Error updating venue overtime rate:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue overtime rate
export const deleteVenueOvertimeRate = async (overtimeRateId: number) => {
  try {
    const { error } = await supabase
      .from('venue_overtime_rates')
      .delete()
      .eq('overtime_rate_id', overtimeRateId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue overtime rate:', err);
    return { error: err.message };
  }
};

// ===== VENUE PACKAGES =====

// Fetch venue packages
export const fetchVenuePackages = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_packages')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenuePackage[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue packages:', err);
    return { data: null, error: err.message };
  }
};

// Create venue package
export const createVenuePackage = async (packageData: Omit<VenuePackage, 'package_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_packages')
      .insert([packageData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenuePackage, error: null };
  } catch (err: any) {
    console.error('Error creating venue package:', err);
    return { data: null, error: err.message };
  }
};

// Update venue package
export const updateVenuePackage = async (packageId: number, updates: Partial<VenuePackage>) => {
  try {
    const { data, error } = await supabase
      .from('venue_packages')
      .update(updates)
      .eq('package_id', packageId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenuePackage, error: null };
  } catch (err: any) {
    console.error('Error updating venue package:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue package
export const deleteVenuePackage = async (packageId: number) => {
  try {
    const { error } = await supabase
      .from('venue_packages')
      .delete()
      .eq('package_id', packageId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue package:', err);
    return { error: err.message };
  }
};

// ===== VENUE PACKAGE INCLUSIONS =====

// Fetch package inclusions
export const fetchPackageInclusions = async (packageId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_package_inclusions')
      .select('*')
      .eq('package_id', packageId);

    if (error) throw error;
    return { data: data as VenuePackageInclusion[], error: null };
  } catch (err: any) {
    console.error('Error fetching package inclusions:', err);
    return { data: null, error: err.message };
  }
};

// Create package inclusion
export const createPackageInclusion = async (inclusionData: Omit<VenuePackageInclusion, 'inclusion_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_package_inclusions')
      .insert([inclusionData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenuePackageInclusion, error: null };
  } catch (err: any) {
    console.error('Error creating package inclusion:', err);
    return { data: null, error: err.message };
  }
};

// Update package inclusion
export const updatePackageInclusion = async (inclusionId: number, updates: Partial<VenuePackageInclusion>) => {
  try {
    const { data, error } = await supabase
      .from('venue_package_inclusions')
      .update(updates)
      .eq('inclusion_id', inclusionId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenuePackageInclusion, error: null };
  } catch (err: any) {
    console.error('Error updating package inclusion:', err);
    return { data: null, error: err.message };
  }
};

// Delete package inclusion
export const deletePackageInclusion = async (inclusionId: number) => {
  try {
    const { error } = await supabase
      .from('venue_package_inclusions')
      .delete()
      .eq('inclusion_id', inclusionId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting package inclusion:', err);
    return { error: err.message };
  }
};

// ===== VENUE SEASONAL PRICING =====

// Fetch seasonal pricing
export const fetchSeasonalPricing = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_seasonal_pricing')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueSeasonalPricing[], error: null };
  } catch (err: any) {
    console.error('Error fetching seasonal pricing:', err);
    return { data: null, error: err.message };
  }
};

// Create seasonal pricing
export const createSeasonalPricing = async (pricingData: Omit<VenueSeasonalPricing, 'seasonal_price_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_seasonal_pricing')
      .insert([pricingData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueSeasonalPricing, error: null };
  } catch (err: any) {
    console.error('Error creating seasonal pricing:', err);
    return { data: null, error: err.message };
  }
};

// Update seasonal pricing
export const updateSeasonalPricing = async (seasonalPriceId: number, updates: Partial<VenueSeasonalPricing>) => {
  try {
    const { data, error } = await supabase
      .from('venue_seasonal_pricing')
      .update(updates)
      .eq('seasonal_price_id', seasonalPriceId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueSeasonalPricing, error: null };
  } catch (err: any) {
    console.error('Error updating seasonal pricing:', err);
    return { data: null, error: err.message };
  }
};

// Delete seasonal pricing
export const deleteSeasonalPricing = async (seasonalPriceId: number) => {
  try {
    const { error } = await supabase
      .from('venue_seasonal_pricing')
      .delete()
      .eq('seasonal_price_id', seasonalPriceId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting seasonal pricing:', err);
    return { error: err.message };
  }
};

// ===== VENUE BLOCKED DATES =====

// Fetch blocked dates
export const fetchVenueBlockedDates = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_blocked_dates')
      .select('*')
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as VenueBlockedDate[], error: null };
  } catch (err: any) {
    console.error('Error fetching blocked dates:', err);
    return { data: null, error: err.message };
  }
};

// Create blocked date
export const createVenueBlockedDate = async (blockedDateData: Omit<VenueBlockedDate, 'blocked_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_blocked_dates')
      .insert([blockedDateData])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueBlockedDate, error: null };
  } catch (err: any) {
    console.error('Error creating blocked date:', err);
    return { data: null, error: err.message };
  }
};

// Delete blocked date
export const deleteVenueBlockedDate = async (blockedId: number) => {
  try {
    const { error } = await supabase
      .from('venue_blocked_dates')
      .delete()
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting blocked date:', err);
    return { error: err.message };
  }
};

// ===== VENUE ADMINISTRATORS =====

// Fetch all venue administrators with user details
export const fetchVenueAdministrators = async () => {
  try {
    const { data, error } = await supabase
      .from('venue_administrators')
      .select(`
        *,
        users(user_id, email, first_name, last_name, phone_number)
      `)
      .order('venue_admin_id', { ascending: true });

    if (error) throw error;
    return { data: data as any[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue administrators:', err);
    return { data: null, error: err.message };
  }
};

// Fetch venue administrator by ID
export const getVenueAdministratorById = async (venueAdminId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_administrators')
      .select(`
        *,
        users(user_id, email, first_name, last_name, phone_number)
      `)
      .eq('venue_admin_id', venueAdminId)
      .single();

    if (error) throw error;
    return { data: data as any, error: null };
  } catch (err: any) {
    console.error('Error fetching venue administrator:', err);
    return { data: null, error: err.message };
  }
};

// ===== VENUE ADMIN ASSIGNMENTS =====

// Fetch venue admin assignments for a venue
export const fetchVenueAdminAssignments = async (venueId: number) => {
  try {
    const { data, error } = await supabase
      .from('venue_admin_assignments')
      .select(`
        *,
        venue_administrators(
          venue_admin_id,
          users(user_id, email, first_name, last_name, phone_number)
        )
      `)
      .eq('venue_id', venueId);

    if (error) throw error;
    return { data: data as any[], error: null };
  } catch (err: any) {
    console.error('Error fetching venue admin assignments:', err);
    return { data: null, error: err.message };
  }
};

// Assign venue admin to venue
export const assignVenueAdmin = async (venueId: number, venueAdminId: number, isOwner: boolean = false) => {
  try {
    const { data, error } = await supabase
      .from('venue_admin_assignments')
      .insert([{ venue_id: venueId, venue_admin_id: venueAdminId, is_owner: isOwner }])
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueAdminAssignment, error: null };
  } catch (err: any) {
    console.error('Error assigning venue admin:', err);
    return { data: null, error: err.message };
  }
};

// Update venue admin assignment
export const updateVenueAdminAssignment = async (assignmentId: number, updates: Partial<VenueAdminAssignment>) => {
  try {
    const { data, error } = await supabase
      .from('venue_admin_assignments')
      .update(updates)
      .eq('assignment_id', assignmentId)
      .select();

    if (error) throw error;
    return { data: data?.[0] as VenueAdminAssignment, error: null };
  } catch (err: any) {
    console.error('Error updating venue admin assignment:', err);
    return { data: null, error: err.message };
  }
};

// Remove venue admin from venue
export const removeVenueAdminAssignment = async (assignmentId: number) => {
  try {
    const { error } = await supabase
      .from('venue_admin_assignments')
      .delete()
      .eq('assignment_id', assignmentId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error removing venue admin assignment:', err);
    return { error: err.message };
  }
};

// ===== FETCH COMPLETE VENUE DETAILS (ALL 14 TABLES) =====
export const fetchCompleteVenueDetails = async (venueId: number) => {
  try {
    // 1. Fetch main venue record
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (venueError || !venue) {
      throw new Error('Venue not found');
    }

    // 2. Fetch venue specifications
    const { data: specifications } = await supabase
      .from('venue_specifications')
      .select('*')
      .eq('venue_id', venueId);

    // 3. Fetch venue doors
    const { data: doors } = await supabase
      .from('venue_doors')
      .select('*')
      .eq('venue_id', venueId);

    // 4. Fetch allowed event types
    const { data: allowedEventTypes } = await supabase
      .from('venue_allowed_event_types')
      .select(`
        *,
        event_categories(category_name)
      `)
      .eq('venue_id', venueId);

    // 5. Fetch venue images
    const { data: images } = await supabase
      .from('venue_images')
      .select('*')
      .eq('venue_id', venueId);

    // 6. Fetch floor plans
    const { data: floorPlans } = await supabase
      .from('venue_floor_plans')
      .select('*')
      .eq('venue_id', venueId);

    // 7. Fetch contacts
    const { data: contacts } = await supabase
      .from('venue_contacts')
      .select('*')
      .eq('venue_id', venueId);

    // 8. Fetch base rates
    const { data: baseRates } = await supabase
      .from('venue_base_rates')
      .select('*')
      .eq('venue_id', venueId);

    // 9. Fetch overtime rates
    const { data: overtimeRates } = await supabase
      .from('venue_overtime_rates')
      .select('*')
      .eq('venue_id', venueId);

    // 10. Fetch facilities
    const { data: facilities } = await supabase
      .from('venue_facilities')
      .select('*')
      .eq('venue_id', venueId);

    // 11. Fetch packages
    const { data: packages } = await supabase
      .from('venue_packages')
      .select('*')
      .eq('venue_id', venueId);

    // 12. Fetch package inclusions
    const { data: packageInclusions } = await supabase
      .from('venue_package_inclusions')
      .select('*')
      .in('package_id', packages?.map(p => p.package_id) || []);

    // 13. Fetch rules
    const { data: rules } = await supabase
      .from('venue_rules')
      .select('*')
      .eq('venue_id', venueId);

    // 14. Fetch venue types
    const { data: venueTypes } = await supabase
      .from('venue_venue_types')
      .select(`
        *,
        venue_types(type_name)
      `)
      .eq('venue_id', venueId);

    console.log("🎉 fetchCompleteVenueDetails result:", {
      venue,
      specifications,
      doors,
      allowedEventTypes,
      images,
      floorPlans,
      contacts,
      baseRates,
      overtimeRates,
      facilities,
      packages,
      packageInclusions,
      rules,
      venueTypes,
    });

    return {
      data: {
        venue,
        specifications,
        doors,
        allowedEventTypes,
        images,
        floorPlans,
        contacts,
        baseRates,
        overtimeRates,
        facilities,
        packages,
        packageInclusions,
        rules,
        venueTypes,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching complete venue details:', err);
    return { data: null, error: err.message };
  }
};

// ===== VENUE SPECIFICATIONS =====

// Update venue specification
export const updateVenueSpecification = async (specId: number, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('venue_specifications')
      .update(updates)
      .eq('specification_id', specId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (err: any) {
    console.error('Error updating venue specification:', err);
    return { data: null, error: err.message };
  }
};

// ===== VENUE DOORS =====

// Create venue door
export const createVenueDoor = async (doorData: Omit<any, 'door_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('venue_doors')
      .insert([doorData])
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (err: any) {
    console.error('Error creating venue door:', err);
    return { data: null, error: err.message };
  }
};

// Update venue door
export const updateVenueDoor = async (doorId: number, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('venue_doors')
      .update(updates)
      .eq('door_id', doorId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (err: any) {
    console.error('Error updating venue door:', err);
    return { data: null, error: err.message };
  }
};

// Delete venue door
export const deleteVenueDoor = async (doorId: number) => {
  try {
    const { error } = await supabase
      .from('venue_doors')
      .delete()
      .eq('door_id', doorId);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Error deleting venue door:', err);
    return { error: err.message };
  }
};

// ===== VENUE FLOOR PLANS =====

// Update venue floor plan
export const updateVenueFloorPlan = async (floorPlanId: number, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('venue_floor_plans')
      .update(updates)
      .eq('floor_plan_id', floorPlanId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (err: any) {
    console.error('Error updating floor plan:', err);
    return { data: null, error: err.message };
  }
};
