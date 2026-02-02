// User Role Types
export type UserRole = 'customer' | 'event_organizer' | 'coordinator' | 'venue_administrator' | 'administrator';

// Base User Interface
export interface User {
  user_id: number;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  user_role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User Photos
export interface UserPhoto {
  user_id: number;
  file_name: string;
  file_url: string;
  profile_photo?: string;
  is_primary?: boolean;
  uploaded_at: string;
  updated_at: string;
}

// Email Verification
export interface EmailVerification {
  verification_id: number;
  user_id: number;
  email_token_hash: string;
  expires_at: string;
  is_verified: boolean;
  verified_at?: string;
  last_token_sent: string;
  created_at: string;
  updated_at?: string;
}

// Customer Type
export interface Customer {
  customer_id: number;
  user_id: number;
  preferences?: string;
  created_at: string;
  updated_at: string;
}

// Administrator Type
export interface Administrator {
  admin_id: number;
  user_id: number;
  position: string;
  role_description: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Event Organizer Type
export interface EventOrganizer {
  organizer_id: number;
  user_id: number;
  company_name?: string;
  company_address?: string;
  business_email?: string;
  business_number?: string;
  created_at: string;
  updated_at: string;
}

// Coordinator Type
export interface Coordinator {
  coordinator_id: number;
  user_id: number;
  organizer_id: number;
  specialization?: string;
  created_at: string;
  updated_at: string;
}

// Venue Administrator Type
export interface VenueAdministrator {
  venue_admin_id: number;
  user_id: number;
  assigned_venue_id?: number;
  created_at: string;
  updated_at: string;
}

// Combined User Profile (with optional role-specific data)
export interface UserProfile extends User {
  photo?: UserPhoto;
  email_verification?: EmailVerification;
  customer?: Customer;
  administrator?: Administrator;
  event_organizer?: EventOrganizer;
  coordinator?: Coordinator;
  venue_administrator?: VenueAdministrator;
}

// ===== VENUE TYPES =====

// Venue Type Enums
export type VenueTypeEnum = 'custom_venue' | 'affiliated_venue';
export type ContactType = 'Email' | 'Phone';
export type DoorType = 'Single' | 'Double';
export type DoorCorner = 'Left' | 'Right' | 'Center';
export type DoorSwing = 'Inward' | 'Outward';
export type DoorHinge = 'Left' | 'Right';
export type RateType = 'Hourly' | 'Daily';
export type SeasonalRateType = 'Hourly' | 'Daily' | 'Package' | 'All';
export type ModifierType = 'Fixed' | 'Percentage';
export type PriceType = 'fixed' | 'per_pax';

// Venue Base
export interface Venue {
  venue_id: number;
  venue_name: string;
  description: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  zip_code: string;
  country: string;
  max_capacity: number;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  venue_images?: VenueImage[];
}

// Venue Type
export interface VenueType {
  venue_type_id: number;
  type_name: string;
  created_at: string;
  updated_at: string;
}

// Venue Venue Types Junction
export interface VenueVenueType {
  venue_type_link_id: number;
  venue_id: number;
  venue_type_id: number;
  created_at: string;
  updated_at: string;
}

// Venue Contact
export interface VenueContact {
  contact_id: number;
  venue_id: number;
  contact_type: ContactType;
  contact_value: string;
  created_at: string;
  updated_at: string;
}

// Venue Specification
export interface VenueSpecification {
  specification_id: number;
  venue_id: number;
  specification_name: string;
  specification_value: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Venue Allowed Event Types
export interface VenueAllowedEventType {
  venue_event_type_id: number;
  venue_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

// Venue Image
export interface VenueImage {
  image_id: number;
  venue_id: number;
  image_path: string;
  is_thumbnail: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Facility
export interface VenueFacility {
  facility_id: number;
  venue_id: number;
  facility_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Venue Rule
export interface VenueRule {
  rule_id: number;
  venue_id: number;
  rule_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Floor Plan
export interface VenueFloorPlan {
  floor_plan_id: number;
  venue_id: number;
  floor_plan_file: string;
  floor_plan_type: string;
  description?: string;
  length: number;
  width: number;
  height: number;
  area_sqm: number;
  created_at: string;
  updated_at: string;
}

// Venue Door
export interface VenueDoor {
  door_id: number;
  venue_id: number;
  door_type: DoorType;
  width: number;
  height: number;
  door_offset: number;
  corner_position: DoorCorner;
  swing_direction: DoorSwing;
  hinge_position: DoorHinge;
  created_at: string;
  updated_at: string;
}

// Venue Base Rate
export interface VenueBaseRate {
  rate_id: number;
  venue_id: number;
  rate_type: RateType;
  base_price: number;
  weekend_price: number;
  holiday_price: number;
  included_hours: number;
  min_hours: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Overtime Rate
export interface VenueOvertimeRate {
  overtime_rate_id: number;
  venue_id: number;
  rate_type: RateType;
  start_hour: number;
  end_hour?: number;
  price_per_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Package
export interface VenuePackage {
  package_id: number;
  venue_id: number;
  package_name: string;
  description: string;
  duration_hours: number;
  duration_days?: number;
  base_price: number;
  min_hours: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Package Inclusion
export interface VenuePackageInclusion {
  inclusion_id: number;
  package_id: number;
  inclusion_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Seasonal Pricing
export interface VenueSeasonalPricing {
  seasonal_price_id: number;
  venue_id: number;
  rate_type: SeasonalRateType;
  package_id?: number;
  season_name: string;
  start_date: string;
  end_date: string;
  modifier_type: ModifierType;
  modifier_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue Admin Assignment
export interface VenueAdminAssignment {
  assignment_id: number;
  venue_id: number;
  venue_admin_id: number;
  is_owner: boolean;
  assigned_at: string;
  revoked_at?: string;
}

// Venue Blocked Date
export interface VenueBlockedDate {
  blocked_id: number;
  venue_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
  blocked_by: number;
  created_at: string;
  updated_at: string;
}

// Venue Overtime Log
export interface VenueOvertimeLog {
  overtime_id: number;
  venue_id: number;
  overtime_date: string;
  hours_added: number;
  reason?: string;
  venue_admin_id: number;
  created_at: string;
  updated_at: string;
}

// Extended Venue with Relations (optional)
export interface VenueWithDetails extends Venue {
  venue_types?: VenueType[];
  contacts?: VenueContact[];
  specifications?: VenueSpecification[];
  images?: VenueImage[];
  facilities?: VenueFacility[];
  rules?: VenueRule[];
  floor_plans?: VenueFloorPlan[];
  doors?: VenueDoor[];
  base_rates?: VenueBaseRate[];
  overtime_rates?: VenueOvertimeRate[];
  packages?: VenuePackage[];
  blocked_dates?: VenueBlockedDate[];
}

// Form Data Types
export interface CreateUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  role: UserRole;
  companyName?: string;
  companyAddress?: string;
  businessEmail?: string;
  businessNumber?: string;
  specialization?: string;
  position?: string;
  roleDescription?: string;
}

export interface EditUserFormData extends CreateUserFormData {
  userId: number;
}

// Read-only field configurations by role
export const READ_ONLY_FIELDS_BY_ROLE: Record<UserRole, string[]> = {
  customer: ['email', 'user_role'],
  event_organizer: ['email', 'user_role', 'companyName', 'companyAddress'],
  coordinator: ['email', 'user_role'],
  venue_administrator: ['email', 'user_role'],
  administrator: ['email', 'user_role'],
};

// Role-specific additional fields
export const ROLE_SPECIFIC_FIELDS: Record<UserRole, { key: string; label: string; type: string }[]> = {
  customer: [],
  event_organizer: [
    { key: 'companyName', label: 'Company Name', type: 'text' },
    { key: 'companyAddress', label: 'Company Address', type: 'text' },
    { key: 'businessEmail', label: 'Business Email', type: 'email' },
    { key: 'businessNumber', label: 'Business Number', type: 'tel' },
  ],
  coordinator: [
    { key: 'specialization', label: 'Specialization', type: 'text' },
  ],
  venue_administrator: [],
  administrator: [
    { key: 'position', label: 'Position', type: 'text' },
    { key: 'roleDescription', label: 'Role Description', type: 'text' },
  ],
};
