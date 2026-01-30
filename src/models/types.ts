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
