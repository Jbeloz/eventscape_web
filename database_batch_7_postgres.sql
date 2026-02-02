-- PostgreSQL Version of EventScape Database Schema
-- This is compatible with Supabase

-- ===== CREATE ENUM TYPES =====
CREATE TYPE user_role_enum AS ENUM ('customer', 'event_organizer', 'coordinator', 'venue_administrator', 'administrator');
CREATE TYPE booking_status_enum AS ENUM ('draft', 'pending', 'confirmed', 'cancelled', 'reschedule_requested', 'rescheduled', 'rejected', 'completed');
CREATE TYPE venue_type_enum AS ENUM ('custom_venue', 'affiliated_venue');
CREATE TYPE contact_type_enum AS ENUM ('Email', 'Phone');
CREATE TYPE door_type_enum AS ENUM ('Single', 'Double');
CREATE TYPE door_corner_enum AS ENUM ('Left', 'Right', 'Center');
CREATE TYPE door_swing_enum AS ENUM ('Inward', 'Outward');
CREATE TYPE door_hinge_enum AS ENUM ('Left', 'Right');
CREATE TYPE rate_type_enum AS ENUM ('Hourly', 'Daily');
CREATE TYPE seasonal_rate_type_enum AS ENUM ('Hourly', 'Daily', 'Package', 'All');
CREATE TYPE modifier_type_enum AS ENUM ('Fixed', 'Percentage');
CREATE TYPE price_type_enum AS ENUM ('fixed', 'per_pax');
CREATE TYPE venue_direct_booking_status_enum AS ENUM ('pending', 'confirmed', 'reschedule_requested', 'rescheduled', 'cancelled', 'completed', 'rejected');
CREATE TYPE project_status_enum AS ENUM ('booked', 'finalization', 'finalized', 'in_progress', 'reschedule_requested', 'rescheduled', 'completed', 'cancelled', 'rejected');
CREATE TYPE theme_type_enum AS ENUM ('predefined', 'custom');

-- ===== CREATE HELPER FUNCTION FOR TIMESTAMPS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== CREATE TABLES =====

-- 1. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    auth_id INTEGER NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    user_role user_role_enum NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_role ON users (user_role);

-- 2. User Photos Table
CREATE TABLE user_photos (
    user_photo_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    profile_photo VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_user_photo_user ON user_photos (user_id);

-- Add trigger for user_photos
CREATE TRIGGER update_user_photos_updated_at
BEFORE UPDATE ON user_photos
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Event Organizers Table
CREATE TABLE event_organizers (
    organizer_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    company_address VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL UNIQUE,
    business_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_organizer_user ON event_organizers (user_id);

CREATE TRIGGER update_event_organizers_updated_at
BEFORE UPDATE ON event_organizers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Coordinators Table
CREATE TABLE coordinators (
    coordinator_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    organizer_id INTEGER NOT NULL,
    specialization VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE
);
CREATE INDEX idx_coordinator_organizer ON coordinators (organizer_id);

CREATE TRIGGER update_coordinators_updated_at
BEFORE UPDATE ON coordinators
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Venue Administrators Table
CREATE TABLE venue_administrators (
    venue_admin_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    assigned_venue_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_administrators_updated_at
BEFORE UPDATE ON venue_administrators
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Administrators Table
CREATE TABLE administrators (
    admin_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    position VARCHAR(100) NOT NULL DEFAULT 'System Administrator',
    role_description TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_administrators_updated_at
BEFORE UPDATE ON administrators
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. OTP Table
CREATE TABLE otp (
    otp_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    otp_code_hash CHAR(64) NOT NULL,
    otp_expiry TIMESTAMP NOT NULL,
    otp_used_at TIMESTAMP,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    last_otp_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id, otp_code_hash)
);
CREATE INDEX idx_user_id_otp ON otp (user_id);
CREATE INDEX idx_otp_expiry ON otp (otp_expiry);

CREATE TRIGGER update_otp_updated_at
BEFORE UPDATE ON otp
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Password Reset Table
CREATE TABLE password_reset (
    reset_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reset_token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    last_token_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_user_id_pwd ON password_reset (user_id);
CREATE INDEX idx_expires_at ON password_reset (expires_at);

CREATE TRIGGER update_password_reset_updated_at
BEFORE UPDATE ON password_reset
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. Email Verification Table
CREATE TABLE email_verification (
    verification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email_token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,
    last_token_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id, email_token_hash)
);
CREATE INDEX idx_email_verification_user ON email_verification (user_id);
CREATE INDEX idx_email_verification_expiry ON email_verification (expires_at);

CREATE TRIGGER update_email_verification_updated_at
BEFORE UPDATE ON email_verification
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. Event Themes Table
CREATE TABLE event_themes (
    event_theme_id SERIAL PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL UNIQUE,
    theme_description TEXT NOT NULL,
    primary_color VARCHAR(100) NOT NULL,
    secondary_color VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_event_themes_updated_at
BEFORE UPDATE ON event_themes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 12. Theme Categories Table
CREATE TABLE theme_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_theme_categories_updated_at
BEFORE UPDATE ON theme_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 13. Decoration Styles Table
CREATE TABLE decoration_styles (
    decoration_style_id SERIAL PRIMARY KEY,
    style_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_decoration_styles_updated_at
BEFORE UPDATE ON decoration_styles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 14. Lighting Styles Table
CREATE TABLE lighting_styles (
    lighting_style_id SERIAL PRIMARY KEY,
    style_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_lighting_styles_updated_at
BEFORE UPDATE ON lighting_styles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 15. Event Theme Categories Table
CREATE TABLE event_theme_categories (
    theme_category_id SERIAL PRIMARY KEY,
    event_theme_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES theme_categories(category_id) ON DELETE CASCADE
);

CREATE TRIGGER update_event_theme_categories_updated_at
BEFORE UPDATE ON event_theme_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 16. Event Theme Decorations Table
CREATE TABLE event_theme_decorations (
    theme_decoration_id SERIAL PRIMARY KEY,
    event_theme_id INTEGER NOT NULL,
    decoration_style_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (decoration_style_id) REFERENCES decoration_styles(decoration_style_id) ON DELETE CASCADE
);

CREATE TRIGGER update_event_theme_decorations_updated_at
BEFORE UPDATE ON event_theme_decorations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 17. Event Theme Lighting Table
CREATE TABLE event_theme_lighting (
    theme_lighting_id SERIAL PRIMARY KEY,
    event_theme_id INTEGER NOT NULL,
    lighting_style_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (lighting_style_id) REFERENCES lighting_styles(lighting_style_id) ON DELETE CASCADE
);

CREATE TRIGGER update_event_theme_lighting_updated_at
BEFORE UPDATE ON event_theme_lighting
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 18. Event Theme Accent Colors Table
CREATE TABLE event_theme_accent_colors (
    accent_color_id SERIAL PRIMARY KEY,
    event_theme_id INTEGER NOT NULL,
    color_value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE
);

CREATE TRIGGER update_event_theme_accent_colors_updated_at
BEFORE UPDATE ON event_theme_accent_colors
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 19. Event Theme Images Table
CREATE TABLE event_theme_images (
    image_id SERIAL PRIMARY KEY,
    event_theme_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE
);
CREATE INDEX idx_event_theme_id ON event_theme_images (event_theme_id);

CREATE TRIGGER update_event_theme_images_updated_at
BEFORE UPDATE ON event_theme_images
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 20. Package Types Table
CREATE TABLE package_types (
    package_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_package_types_updated_at
BEFORE UPDATE ON package_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 21. Event Packages Table
CREATE TABLE event_packages (
    package_id SERIAL PRIMARY KEY,
    package_type_id INTEGER NOT NULL,
    package_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    excess_pax_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_type_id) REFERENCES package_types(package_type_id) ON DELETE CASCADE
);

CREATE TRIGGER update_event_packages_updated_at
BEFORE UPDATE ON event_packages
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 22. Package Pax Prices Table
CREATE TABLE package_pax_prices (
    pax_price_id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL,
    pax_count INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id) ON DELETE CASCADE
);

CREATE TRIGGER update_package_pax_prices_updated_at
BEFORE UPDATE ON package_pax_prices
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 23. Service Categories Table
CREATE TABLE service_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON service_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 24. Services Table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(category_id) ON DELETE CASCADE
);

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 25. Package Services Table
CREATE TABLE package_services (
    package_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    PRIMARY KEY (package_id, service_id),
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 26. Add-on Categories Table
CREATE TABLE add_on_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_add_on_categories_updated_at
BEFORE UPDATE ON add_on_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 27. Add-ons Table
CREATE TABLE add_ons (
    add_on_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    add_on_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price_type price_type_enum NOT NULL,
    default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES add_on_categories(category_id) ON DELETE CASCADE
);

CREATE TRIGGER update_add_ons_updated_at
BEFORE UPDATE ON add_ons
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 28. Event Categories Table
CREATE TABLE event_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_event_categories_updated_at
BEFORE UPDATE ON event_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 29. Venues Table
CREATE TABLE venues (
    venue_id SERIAL PRIMARY KEY,
    venue_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    max_capacity INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_venue_name ON venues (venue_name);

CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 30. Venue Admin Assignments Table
CREATE TABLE venue_admin_assignments (
    assignment_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    venue_admin_id INTEGER NOT NULL,
    is_owner BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE,
    UNIQUE (venue_id, venue_admin_id)
);
CREATE INDEX idx_venue_asg ON venue_admin_assignments (venue_id);
CREATE INDEX idx_venue_admin_asg ON venue_admin_assignments (venue_admin_id);

-- 31. Venue Types Table
CREATE TABLE venue_types (
    venue_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_venue_types_updated_at
BEFORE UPDATE ON venue_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 32. Venue Venue Types Table
CREATE TABLE venue_venue_types (
    venue_type_link_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    venue_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_type_id) REFERENCES venue_types(venue_type_id) ON DELETE CASCADE,
    UNIQUE (venue_id, venue_type_id)
);

CREATE TRIGGER update_venue_venue_types_updated_at
BEFORE UPDATE ON venue_venue_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 33. Venue Contacts Table
CREATE TABLE venue_contacts (
    contact_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    contact_type contact_type_enum NOT NULL,
    contact_value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_contacts_updated_at
BEFORE UPDATE ON venue_contacts
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 34. Venue Specifications Table
CREATE TABLE venue_specifications (
    specification_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    specification_name VARCHAR(100) NOT NULL,
    specification_value VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    UNIQUE (venue_id, specification_name)
);

CREATE TRIGGER update_venue_specifications_updated_at
BEFORE UPDATE ON venue_specifications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 35. Venue Allowed Event Types Table
CREATE TABLE venue_allowed_event_types (
    venue_event_type_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES event_categories(category_id) ON DELETE CASCADE,
    UNIQUE (venue_id, category_id)
);

CREATE TRIGGER update_venue_allowed_event_types_updated_at
BEFORE UPDATE ON venue_allowed_event_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 36. Venue Images Table
CREATE TABLE venue_images (
    image_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);
CREATE INDEX idx_venue_id ON venue_images (venue_id);

CREATE TRIGGER update_venue_images_updated_at
BEFORE UPDATE ON venue_images
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 37. Venue Facilities Table
CREATE TABLE venue_facilities (
    facility_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_facilities_updated_at
BEFORE UPDATE ON venue_facilities
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 38. Venue Rules Table
CREATE TABLE venue_rules (
    rule_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    rule_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_rules_updated_at
BEFORE UPDATE ON venue_rules
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 39. Venue Floor Plans Table
CREATE TABLE venue_floor_plans (
    floor_plan_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    floor_plan_file VARCHAR(255) NOT NULL,
    floor_plan_type VARCHAR(100) NOT NULL,
    description TEXT,
    length DECIMAL(5,2) NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    area_sqm DECIMAL(7,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_floor_plans_updated_at
BEFORE UPDATE ON venue_floor_plans
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 40. Venue Doors Table
CREATE TABLE venue_doors (
    door_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    door_type door_type_enum NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    door_offset DECIMAL(5,2) NOT NULL,
    corner_position door_corner_enum NOT NULL DEFAULT 'Center',
    swing_direction door_swing_enum NOT NULL DEFAULT 'Inward',
    hinge_position door_hinge_enum NOT NULL DEFAULT 'Left',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_doors_updated_at
BEFORE UPDATE ON venue_doors
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 41. Venue Base Rates Table
CREATE TABLE venue_base_rates (
    rate_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    rate_type rate_type_enum NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    weekend_price DECIMAL(12,2) NOT NULL,
    holiday_price DECIMAL(12,2) NOT NULL,
    included_hours INTEGER NOT NULL,
    min_hours INTEGER NOT NULL DEFAULT 2,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_base_rates_updated_at
BEFORE UPDATE ON venue_base_rates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 42. Venue Overtime Rates Table
CREATE TABLE venue_overtime_rates (
    overtime_rate_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    rate_type rate_type_enum NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER,
    price_per_hour DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_overtime_rates_updated_at
BEFORE UPDATE ON venue_overtime_rates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 43. Venue Packages Table
CREATE TABLE venue_packages (
    package_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    package_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    duration_hours INTEGER NOT NULL,
    duration_days INTEGER,
    base_price DECIMAL(12,2) NOT NULL,
    min_hours INTEGER NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    UNIQUE (venue_id, package_name)
);
CREATE INDEX idx_package_name ON venue_packages (package_name);

CREATE TRIGGER update_venue_packages_updated_at
BEFORE UPDATE ON venue_packages
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 44. Venue Package Inclusions Table
CREATE TABLE venue_package_inclusions (
    inclusion_id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL,
    inclusion_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES venue_packages(package_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_package_inclusions_updated_at
BEFORE UPDATE ON venue_package_inclusions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 45. Venue Seasonal Pricing Table
CREATE TABLE venue_seasonal_pricing (
    seasonal_price_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    rate_type seasonal_rate_type_enum NOT NULL,
    package_id INTEGER,
    season_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    modifier_type modifier_type_enum NOT NULL,
    modifier_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES venue_packages(package_id) ON DELETE SET NULL
);
CREATE INDEX idx_season_name ON venue_seasonal_pricing (season_name);

CREATE TRIGGER update_venue_seasonal_pricing_updated_at
BEFORE UPDATE ON venue_seasonal_pricing
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 46. Bookings Table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    coordinator_id INTEGER NOT NULL,
    venue_id INTEGER,
    venue_type venue_type_enum NOT NULL,
    event_date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    guest_capacity INTEGER NOT NULL,
    booking_status booking_status_enum NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coordinator_id) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL
);

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 47. Booking Add-ons Table
CREATE TABLE booking_add_ons (
    booking_add_on_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    add_on_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (add_on_id) REFERENCES add_ons(add_on_id) ON DELETE SET NULL,
    UNIQUE (booking_id, add_on_id)
);

CREATE TRIGGER update_booking_add_ons_updated_at
BEFORE UPDATE ON booking_add_ons
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 48. Booking Themes Table
CREATE TABLE booking_themes (
    booking_theme_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    theme_type theme_type_enum NOT NULL DEFAULT 'predefined',
    event_theme_id INTEGER,
    custom_theme_name VARCHAR(100),
    primary_color VARCHAR(50),
    secondary_color VARCHAR(50),
    accent_color VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE SET NULL,
    UNIQUE (booking_id)
);

CREATE TRIGGER update_booking_themes_updated_at
BEFORE UPDATE ON booking_themes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 49. Booking Pricing Table
CREATE TABLE booking_pricing (
    pricing_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    package_id INTEGER NOT NULL,
    selected_pax INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    excess_pax INTEGER NOT NULL DEFAULT 0,
    excess_price DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id) ON DELETE CASCADE
);

CREATE TRIGGER update_booking_pricing_updated_at
BEFORE UPDATE ON booking_pricing
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 50. Custom Venues Table
CREATE TABLE custom_venues (
    custom_venue_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    custom_venue_name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    custom_venue_capacity INTEGER NOT NULL,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE TRIGGER update_custom_venues_updated_at
BEFORE UPDATE ON custom_venues
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 51. Projects Table
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    booking_theme_id INTEGER,
    project_name VARCHAR(255) NOT NULL,
    organizer_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    project_status project_status_enum NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_theme_id) REFERENCES booking_themes(booking_theme_id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 52. Reschedules Table
CREATE TABLE reschedules (
    reschedule_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    old_event_date DATE NOT NULL,
    old_time_start TIME NOT NULL,
    old_time_end TIME NOT NULL,
    new_event_date DATE NOT NULL,
    new_time_start TIME NOT NULL,
    new_time_end TIME NOT NULL,
    requested_by INTEGER NOT NULL,
    reason TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE SET NULL
);

-- 53. Reviews Table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    organizer_id INTEGER NOT NULL,
    venue_id INTEGER,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL,
    UNIQUE (project_id, customer_id)
);

-- 54. Venue Direct Bookings Table
CREATE TABLE venue_direct_bookings (
    direct_booking_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    venue_admin_id INTEGER NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_contact VARCHAR(20) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    guest_capacity INTEGER NOT NULL,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(20),
    status venue_direct_booking_status_enum NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_direct_bookings_updated_at
BEFORE UPDATE ON venue_direct_bookings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 55. Direct Booking Themes Table
CREATE TABLE direct_booking_themes (
    direct_booking_theme_id SERIAL PRIMARY KEY,
    direct_booking_id INTEGER NOT NULL,
    theme_type theme_type_enum NOT NULL DEFAULT 'predefined',
    event_theme_id INTEGER,
    custom_theme_name VARCHAR(100),
    primary_color VARCHAR(50),
    secondary_color VARCHAR(50),
    accent_color VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (direct_booking_id) REFERENCES venue_direct_bookings(direct_booking_id) ON DELETE CASCADE,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE SET NULL,
    UNIQUE (direct_booking_id)
);

CREATE TRIGGER update_direct_booking_themes_updated_at
BEFORE UPDATE ON direct_booking_themes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 56. Venue Direct Reschedules Table
CREATE TABLE venue_direct_reschedules (
    reschedule_id SERIAL PRIMARY KEY,
    direct_booking_id INTEGER NOT NULL,
    old_event_date DATE NOT NULL,
    old_time_start TIME NOT NULL,
    old_time_end TIME NOT NULL,
    old_guest_capacity INTEGER NOT NULL,
    new_event_date DATE NOT NULL,
    new_time_start TIME NOT NULL,
    new_time_end TIME NOT NULL,
    new_guest_capacity INTEGER NOT NULL,
    requested_by INTEGER NOT NULL,
    reason TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (direct_booking_id) REFERENCES venue_direct_bookings(direct_booking_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE SET NULL
);

-- 57. Venue Blocked Dates Table
CREATE TABLE venue_blocked_dates (
    blocked_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    blocked_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE,
    UNIQUE (venue_id, start_date, end_date)
);

CREATE TRIGGER update_venue_blocked_dates_updated_at
BEFORE UPDATE ON venue_blocked_dates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 58. Venue Overtime Logs Table
CREATE TABLE venue_overtime_logs (
    overtime_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    overtime_date DATE NOT NULL,
    hours_added DECIMAL(5,2) NOT NULL,
    reason TEXT,
    venue_admin_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TRIGGER update_venue_overtime_logs_updated_at
BEFORE UPDATE ON venue_overtime_logs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 59. Booking Adjustments Table
CREATE TABLE booking_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    adjustment_type VARCHAR(100) NOT NULL,
    adjustment_amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    adjusted_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (adjusted_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TRIGGER update_booking_adjustments_updated_at
BEFORE UPDATE ON booking_adjustments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 60. Booking Billing Summary Table
CREATE TABLE booking_billing_summary (
    billing_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP,
    venue_admin_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TRIGGER update_booking_billing_summary_updated_at
BEFORE UPDATE ON booking_billing_summary
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add foreign key constraint for venue_administrators.assigned_venue_id
ALTER TABLE venue_administrators
ADD CONSTRAINT fk_venue_admin_venue FOREIGN KEY (assigned_venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL;

-- ===== DISABLE ROW LEVEL SECURITY ON ALL TABLES =====
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_administrators DISABLE ROW LEVEL SECURITY;
ALTER TABLE administrators DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE theme_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE decoration_styles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lighting_styles DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_theme_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_theme_decorations DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_theme_lighting DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_theme_accent_colors DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_theme_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_pax_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE add_on_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_admin_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_venue_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_specifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_allowed_event_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_floor_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_doors DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_base_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_overtime_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_package_inclusions DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_seasonal_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_add_ons DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_direct_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_booking_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_direct_reschedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_blocked_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_overtime_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_billing_summary DISABLE ROW LEVEL SECURITY;

-- Grant sequence permissions for anonymous and authenticated users
GRANT USAGE, SELECT ON SEQUENCE event_categories_category_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_types_venue_type_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venues_venue_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_venue_types_venue_type_link_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_contacts_contact_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_images_image_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_facilities_facility_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_rules_rule_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_floor_plans_floor_plan_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_doors_door_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_base_rates_rate_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_overtime_rates_overtime_rate_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_packages_package_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_package_inclusions_inclusion_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_seasonal_pricing_seasonal_price_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_blocked_dates_blocked_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_overtime_logs_overtime_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_specifications_specification_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_allowed_event_types_venue_event_type_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE venue_admin_assignments_assignment_id_seq TO anon, authenticated, service_role;
