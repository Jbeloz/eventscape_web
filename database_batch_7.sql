CREATE DATABASE EventScape;

USE EventScape;

CREATE TABLE users (
	user_id 			INT AUTO_INCREMENT PRIMARY KEY,
    auth_id				INT NOT NULL UNIQUE,
	email 				VARCHAR(255) NOT NULL UNIQUE,
	password_hash 		VARCHAR(255) NOT NULL,
	first_name 			VARCHAR(100) NOT NULL,
	last_name 			VARCHAR(100) NOT NULL,
	phone_number 		VARCHAR(20) DEFAULT NULL,
	user_role 			ENUM ('customer', 'event_organizer', 'coordinator', 'venue_administrator', 'administrator') NOT NULL DEFAULT 'customer',
	is_active 			TINYINT(1) NOT NULL DEFAULT 1,
	created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (user_role)
);

CREATE TABLE user_photos (
	user_photo_id		INT AUTO_INCREMENT PRIMARY KEY,
    user_id         	INT NOT NULL,
    profile_photo	 	VARCHAR(500) NOT NULL,
    file_name 			VARCHAR(255) NOT NULL,
    file_url 			VARCHAR(500) NOT NULL,
    is_primary          TINYINT(1) NOT NULL DEFAULT 0,
    uploaded_at     	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_photo_user (user_id)
);

CREATE TABLE customers (
    customer_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL UNIQUE,
    preferences         TEXT DEFAULT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE event_organizers (
    organizer_id 		INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL UNIQUE,
    company_name        VARCHAR(150) NOT NULL,
    company_address     VARCHAR(255) NOT NULL,
    business_email      VARCHAR(255) NOT NULL UNIQUE,
    business_number     VARCHAR(20) NOT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_organizer_user (user_id)
);

CREATE TABLE coordinators (
    coordinator_id 		INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL UNIQUE,
    organizer_id 		INT NOT NULL,
    specialization      VARCHAR(100) NOT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE,
    INDEX idx_coordinator_organizer (organizer_id)
);

CREATE TABLE venue_administrators (
    venue_admin_id 		INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL UNIQUE,
    assigned_venue_id   INT DEFAULT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL
);

CREATE TABLE administrators (
    admin_id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL UNIQUE,
    position            VARCHAR(100) NOT NULL DEFAULT 'System Administrator',
    role_description    TEXT NOT NULL,
    admin_notes         TEXT DEFAULT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE otp (
    otp_id 				INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL,
    otp_code_hash 		CHAR(64) NOT NULL,
    otp_expiry 			DATETIME NOT NULL,
    otp_used_at 		DATETIME DEFAULT NULL,
    otp_attempts 		INT NOT NULL DEFAULT 0,
    last_otp_sent 		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_otp (user_id, otp_code_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_otp_expiry (otp_expiry)
);

CREATE TABLE password_reset (
    reset_id 			INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL,
    reset_token_hash 	CHAR(64) NOT NULL,
    expires_at 			DATETIME NOT NULL,
    used_at 			DATETIME DEFAULT NULL,
    last_token_sent 	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE email_verification (
    verification_id 	INT AUTO_INCREMENT PRIMARY KEY,
    user_id 			INT NOT NULL,
    email_token_hash 	CHAR(64) NOT NULL,
    expires_at 			DATETIME NOT NULL,
    is_verified 		TINYINT(1) NOT NULL DEFAULT 0,
    verified_at 		DATETIME DEFAULT NULL,
    last_token_sent 	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_email_token (user_id, email_token_hash),
    INDEX idx_email_verification_user (user_id),
    INDEX idx_email_verification_expiry (expires_at)
);

CREATE TABLE event_themes (
    event_theme_id 		INT AUTO_INCREMENT PRIMARY KEY,
    theme_name 			VARCHAR(100) NOT NULL,
    theme_description 	TEXT NOT NULL,
    primary_color 		VARCHAR(100) NOT NULL,
    secondary_color 	VARCHAR(100) DEFAULT NULL,
    is_active 			BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(theme_name)
);

CREATE TABLE theme_categories (
    category_id 		INT AUTO_INCREMENT PRIMARY KEY,
    category_name 		VARCHAR(50) NOT NULL UNIQUE,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE decoration_styles (
    decoration_style_id 	INT AUTO_INCREMENT PRIMARY KEY,
    style_name 				VARCHAR(50) NOT NULL UNIQUE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE lighting_styles (
    lighting_style_id 		INT AUTO_INCREMENT PRIMARY KEY,
    style_name 				VARCHAR(50) NOT NULL UNIQUE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE event_theme_categories (
    theme_category_id 		INT AUTO_INCREMENT PRIMARY KEY,
    event_theme_id 			INT NOT NULL,
    category_id 			INT NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES theme_categories(category_id) ON DELETE CASCADE
);

CREATE TABLE event_theme_decorations (
    theme_decoration_id 	INT AUTO_INCREMENT PRIMARY KEY,
    event_theme_id 			INT NOT NULL,
    decoration_style_id 	INT NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (decoration_style_id) REFERENCES decoration_styles(decoration_style_id) ON DELETE CASCADE
);

CREATE TABLE event_theme_lighting (
    theme_lighting_id 		INT AUTO_INCREMENT PRIMARY KEY,
    event_theme_id 			INT NOT NULL,
    lighting_style_id 		INT NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    FOREIGN KEY (lighting_style_id) REFERENCES lighting_styles(lighting_style_id) ON DELETE CASCADE
);

CREATE TABLE event_theme_accent_colors (
    accent_color_id 		INT AUTO_INCREMENT PRIMARY KEY,
    event_theme_id 			INT NOT NULL,
    color_value 			VARCHAR(100) NOT NULL,      
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE
);

CREATE TABLE event_theme_images (
    image_id 				INT AUTO_INCREMENT PRIMARY KEY,
    event_theme_id 			INT NOT NULL,
    image_path 				VARCHAR(255) NOT NULL,
    is_thumbnail 			BOOLEAN NOT NULL DEFAULT FALSE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE CASCADE,
    INDEX idx_event_theme_id(event_theme_id)
);

CREATE TABLE package_types (
    package_type_id 		INT AUTO_INCREMENT PRIMARY KEY,
    type_name       		VARCHAR(255) NOT NULL UNIQUE,
    description     		TEXT NOT NULL,
    is_active           	BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE event_packages (
    package_id          INT AUTO_INCREMENT PRIMARY KEY,
    package_type_id     INT NOT NULL,
    package_name        VARCHAR(150) NOT NULL,
    description         TEXT NOT NULL,
    excess_pax_price    DECIMAL(10,2) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_type_id) REFERENCES package_types(package_type_id)
);

CREATE TABLE package_pax_prices (
    pax_price_id    	INT AUTO_INCREMENT PRIMARY KEY,
    package_id      	INT NOT NULL,
    pax_count       	INT NOT NULL,
    price           	DECIMAL(10,2) NOT NULL,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id)
);

CREATE TABLE service_categories (
    category_id     	INT AUTO_INCREMENT PRIMARY KEY,
    category_name   	VARCHAR(100) NOT NULL UNIQUE,
    created_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 			TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE services (
    service_id      INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    service_name    VARCHAR(150) NOT NULL,
    description     TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at 		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 		TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(category_id)
);

CREATE TABLE package_services (
    package_id     INT NOT NULL,
    service_id     INT NOT NULL,
    PRIMARY KEY (package_id, service_id),
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE TABLE add_on_categories (
    category_id    INT AUTO_INCREMENT PRIMARY KEY,
    category_name  VARCHAR(100) NOT NULL UNIQUE,
    description    TEXT NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE add_ons (
    add_on_id      INT AUTO_INCREMENT PRIMARY KEY,
    category_id    INT NOT NULL,
    add_on_name    VARCHAR(150) NOT NULL,
    description    TEXT NOT NULL,
    price_type     ENUM('fixed', 'per_pax') NOT NULL,
    default_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES add_on_categories(category_id)
);

CREATE TABLE event_categories (
    category_id 			INT AUTO_INCREMENT PRIMARY KEY,
    category_name 			VARCHAR(50) NOT NULL UNIQUE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE venues (
    venue_id 				INT AUTO_INCREMENT PRIMARY KEY,
    venue_name 				VARCHAR(150) NOT NULL,
    description 			TEXT NOT NULL,
    street_address         	VARCHAR(255) NOT NULL,
    barangay               	VARCHAR(100) NOT NULL,
    city                   	VARCHAR(100) NOT NULL,
    province               	VARCHAR(100) NOT NULL,
    zip_code               	VARCHAR(10) NOT NULL,
    country                	VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    max_capacity 			INT NOT NULL,      
    created_by 				INT NOT NULL,              
    is_active 				BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(venue_name),
    INDEX idx_venue_name (venue_name)
);

CREATE TABLE venue_admin_assignments (
    assignment_id       INT AUTO_INCREMENT PRIMARY KEY,
    venue_id            INT NOT NULL,
    venue_admin_id      INT NOT NULL,
    is_owner            BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at          TIMESTAMP NULL,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE,
    UNIQUE (venue_id, venue_admin_id),
    INDEX idx_venue (venue_id),
    INDEX idx_venue_admin (venue_admin_id)
);

CREATE TABLE venue_types (
    venue_type_id 			INT AUTO_INCREMENT PRIMARY KEY,
    type_name 				VARCHAR(100) NOT NULL UNIQUE,  
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE venue_venue_types (
    venue_type_link_id 		INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    venue_type_id 			INT NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_type_id) REFERENCES venue_types(venue_type_id) ON DELETE CASCADE,
    UNIQUE(venue_id, venue_type_id)
);

CREATE TABLE venue_contacts (
    contact_id 				INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    contact_type 			ENUM('Email','Phone') NOT NULL,
    contact_value 			VARCHAR(100) NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TABLE venue_specifications (
    specification_id 		INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    specification_name  	VARCHAR(100) NOT NULL,                
    specification_value  	VARCHAR(100) NOT NULL,
    notes 					TEXT DEFAULT NULL,                       
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    UNIQUE(venue_id, specification_name)
);

CREATE TABLE venue_allowed_event_types (
    venue_event_type_id 	INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    category_id 			INT NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES event_categories(category_id) ON DELETE CASCADE,
    UNIQUE(venue_id, category_id)
);

CREATE TABLE venue_images (
    image_id 				INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    image_path 				VARCHAR(255) NOT NULL, 
    is_thumbnail 			BOOLEAN NOT NULL DEFAULT FALSE, 
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    INDEX idx_venue_id (venue_id)
);

CREATE TABLE venue_facilities (
    facility_id 			INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    facility_name 			VARCHAR(100) NOT NULL,
    description 			TEXT DEFAULT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TABLE venue_rules (
    rule_id 				INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    rule_text 				TEXT NOT NULL,  
    is_active 				BOOLEAN NOT NULL DEFAULT TRUE,  
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TABLE venue_floor_plans (
    floor_plan_id 			INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    floor_plan_file 		VARCHAR(255) NOT NULL,
    floor_plan_type       	VARCHAR(100) NOT NULL,
    description           	TEXT DEFAULT NULL, 
    length					DECIMAL(5,2) NOT NULL,
    width	 				DECIMAL(5,2) NOT NULL,
    height	 				DECIMAL(5,2) NOT NULL,
    area_sqm 				DECIMAL(7,2) NOT NULL,
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TABLE venue_doors (
    door_id 				INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 				INT NOT NULL,
    door_type 				ENUM('Single','Double') NOT NULL,
    width 					DECIMAL(5,2) NOT NULL,
    height	 				DECIMAL(5,2) NOT NULL,
    offset	 				DECIMAL(5,2) NOT NULL, 
    corner_position 		ENUM('Left','Right','Center') NOT NULL DEFAULT 'Center',
    swing_direction 		ENUM('Inward','Outward') NOT NULL DEFAULT 'Inward',
    hinge_position 			ENUM('Left','Right') NOT NULL DEFAULT 'Left',
    created_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 				TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE TABLE venue_base_rates (
    rate_id 					INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 					INT NOT NULL,
    rate_type 					ENUM('Hourly','Daily') NOT NULL,      
    base_price 					DECIMAL(12,2) NOT NULL,             
    weekend_price 				DECIMAL(12,2) NOT NULL,      
    holiday_price 				DECIMAL(12,2) NOT NULL,      
    included_hours 				INT NOT NULL,                   
    min_hours 					INT NOT NULL DEFAULT 2,                        
    notes 						TEXT DEFAULT NULL,
    is_active 					BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE TABLE venue_overtime_rates (
    overtime_rate_id 			INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 					INT NOT NULL,
    rate_type 					ENUM('Hourly','Daily') NOT NULL,
    start_hour 					INT NOT NULL,
    end_hour 					INT DEFAULT NULL,
    price_per_hour 				DECIMAL(12,2) NOT NULL,
    is_active 					BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE TABLE venue_packages (
    package_id 					INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 					INT NOT NULL,
    package_name 				VARCHAR(150) NOT NULL,
    description 				TEXT NOT NULL,
    duration_hours 				INT NOT NULL,   
    duration_days 				INT DEFAULT NULL,    
    base_price 					DECIMAL(12,2) NOT NULL,
    min_hours 					INT NOT NULL,        
    notes 						TEXT DEFAULT NULL,
    is_active 					BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    UNIQUE (venue_id, package_name),
	INDEX idx_package_name (package_name)
);

CREATE TABLE venue_package_inclusions (
    inclusion_id 				INT AUTO_INCREMENT PRIMARY KEY,
    package_id 					INT NOT NULL,
    inclusion_name 				VARCHAR(150) NOT NULL,
    is_active 					BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES venue_packages(package_id)
);

CREATE TABLE venue_seasonal_pricing (
    seasonal_price_id 			INT AUTO_INCREMENT PRIMARY KEY,
    venue_id 					INT NOT NULL,
    rate_type 					ENUM('Hourly','Daily','Package','All') NOT NULL,
    package_id 					INT DEFAULT NULL,   
    season_name 				VARCHAR(100) NOT NULL,
    start_date 					DATE NOT NULL,
    end_date 					DATE NOT NULL,
    modifier_type 				ENUM('Fixed','Percentage') NOT NULL,
    modifier_value 				DECIMAL(10,2) NOT NULL,  
    is_active 					BOOLEAN NOT NULL DEFAULT TRUE,
    created_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 					TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    FOREIGN KEY (package_id) REFERENCES venue_packages(package_id),
    INDEX idx_season_name (season_name)
);

CREATE TABLE bookings (
    booking_id            	INT AUTO_INCREMENT PRIMARY KEY,
    coordinator_id        	INT NOT NULL,
    venue_id              	INT DEFAULT NULL,
    venue_type            	ENUM ('custom_venue', 'affiliated_venue') NOT NULL,
    event_date            	DATE NOT NULL,
    time_start            	TIME NOT NULL,
    time_end              	TIME NOT NULL,
    guest_capacity        	INT NOT NULL,
    booking_status 			ENUM ('draft', 'pending', 'confirmed', 'cancelled', 'reschedule_requested', 'rescheduled', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    notes                 	TEXT DEFAULT NULL,
    created_at            	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coordinator_id) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
	FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL
);

CREATE TABLE booking_add_ons (
    booking_add_on_id 		INT AUTO_INCREMENT PRIMARY KEY,
    booking_id        		INT NOT NULL,
    add_on_id         		INT NOT NULL DEFAULT NULL,
    quantity          		INT NOT NULL DEFAULT 1,
    unit_price        		DECIMAL(10,2) NOT NULL, 
    total_price       		DECIMAL(10,2) NOT NULL, 
    created_at        		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
	FOREIGN KEY (add_on_id) REFERENCES add_ons(add_on_id) ON DELETE SET NULL,
    UNIQUE (booking_id, add_on_id)
);

CREATE TABLE booking_themes (
    booking_theme_id    INT AUTO_INCREMENT PRIMARY KEY,
    booking_id          INT NOT NULL,
    theme_type          ENUM('predefined','custom') NOT NULL DEFAULT 'predefined',
    event_theme_id      INT DEFAULT NULL,
    custom_theme_name   VARCHAR(100) DEFAULT NULL,
    primary_color       VARCHAR(50) DEFAULT NULL,
    secondary_color     VARCHAR(50) DEFAULT NULL,
    accent_color        VARCHAR(50) DEFAULT NULL,
    notes               TEXT DEFAULT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE SET NULL,
    UNIQUE(booking_id)
);

CREATE TABLE booking_pricing (
    pricing_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL UNIQUE,
    package_id      INT NOT NULL,
    selected_pax    INT NOT NULL,
    base_price      DECIMAL(10,2) NOT NULL,
    excess_pax      INT NOT NULL DEFAULT 0,
    excess_price    DECIMAL(10,2) DEFAULT 0,
    total_amount    DECIMAL(10,2) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES event_packages(package_id)
);

CREATE TABLE custom_venues (
    custom_venue_id 		INT AUTO_INCREMENT PRIMARY KEY,
    booking_id 				INT NOT NULL,
    custom_venue_name     	VARCHAR(255) NOT NULL,
    street_address         	VARCHAR(255) NOT NULL,
    barangay               	VARCHAR(100) NOT NULL,
    city                   	VARCHAR(100) NOT NULL,
    province               	VARCHAR(100) NOT NULL,
    zip_code               	VARCHAR(10) NOT NULL,
    country                	VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    custom_venue_capacity 	INT NOT NULL,
    base_price            	DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at        		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        		TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE (booking_id)
);

CREATE TABLE projects (
    project_id            INT AUTO_INCREMENT PRIMARY KEY,
    booking_id            INT NOT NULL,
    booking_theme_id 	  INT DEFAULT NULL,
    project_name          VARCHAR(255) NOT NULL,
    organizer_id    	  INT NOT NULL,
    customer_id           INT NOT NULL,
    project_status 		  ENUM ('booked', 'finalization', 'finalized', 'in_progress', 'reschedule_requested', 'rescheduled', 'completed', 'cancelled', 'rejected') NOT NULL,
    notes                 TEXT DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_theme_id) REFERENCES booking_themes(booking_theme_id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE reschedules (
    reschedule_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id         INT NOT NULL,
    project_id         INT NOT NULL,
    old_event_date     DATE NOT NULL,
    old_time_start     TIME NOT NULL,
    old_time_end       TIME NOT NULL,
    new_event_date     DATE NOT NULL,
    new_time_start     TIME NOT NULL,
    new_time_end       TIME NOT NULL,
    requested_by       INT NOT NULL, 
    reason             TEXT DEFAULT NULL,
    approved_by        INT DEFAULT NULL,     
    approved_at        TIMESTAMP DEFAULT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE SET NULL
);

CREATE TABLE reviews (
    review_id           INT AUTO_INCREMENT PRIMARY KEY,
    project_id          INT NOT NULL,
    booking_id          INT NOT NULL,
    customer_id         INT NOT NULL,
    organizer_id  		INT NOT NULL,
    venue_id            INT NULL,
    rating              TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text         TEXT DEFAULT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES event_organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL,
    UNIQUE (project_id, customer_id)
);

CREATE TABLE venue_direct_bookings (
    direct_booking_id  INT AUTO_INCREMENT PRIMARY KEY,
    venue_id           INT NOT NULL,
    venue_admin_id     INT NOT NULL, 
    client_name        VARCHAR(255) NOT NULL,
    client_email       VARCHAR(255) NOT NULL,
    client_contact     VARCHAR(20) NOT NULL,
    event_name         VARCHAR(255) NOT NULL,
    event_date         DATE NOT NULL,
    time_start         TIME NOT NULL,
    time_end           TIME NOT NULL,
    guest_capacity     INT NOT NULL,
    organizer_name     VARCHAR(255) NULL, 
    organizer_contact  VARCHAR(20) NULL,  
    status 			   ENUM ('pending', 'confirmed', 'reschedule_requested', 'rescheduled', 'cancelled', 'completed', 'rejected') NOT NULL DEFAULT 'confirmed',
    notes 			   TEXT DEFAULT NULL,
    created_at 		   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at 		   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TABLE direct_booking_themes (
    direct_booking_theme_id 	INT AUTO_INCREMENT PRIMARY KEY,
    direct_booking_id       	INT NOT NULL,
    theme_type              	ENUM('predefined','custom') NOT NULL DEFAULT 'predefined',
    event_theme_id          	INT DEFAULT NULL,
    custom_theme_name       	VARCHAR(100) DEFAULT NULL,
    primary_color           	VARCHAR(50) DEFAULT NULL,
    secondary_color         	VARCHAR(50) DEFAULT NULL,
    accent_color            	VARCHAR(50) DEFAULT NULL,
    notes                   	TEXT DEFAULT NULL,
    created_at              	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (direct_booking_id) REFERENCES venue_direct_bookings(direct_booking_id) ON DELETE CASCADE,
    FOREIGN KEY (event_theme_id) REFERENCES event_themes(event_theme_id) ON DELETE SET NULL,
    UNIQUE(direct_booking_id)
);

CREATE TABLE venue_direct_reschedules (
    reschedule_id        INT AUTO_INCREMENT PRIMARY KEY,
    direct_booking_id    INT NOT NULL,
    old_event_date       DATE NOT NULL,
    old_time_start       TIME NOT NULL,
    old_time_end         TIME NOT NULL,
    old_guest_capacity   INT NOT NULL,
    new_event_date       DATE NOT NULL,
    new_time_start       TIME NOT NULL,
    new_time_end         TIME NOT NULL,
    new_guest_capacity   INT NOT NULL,
    requested_by         INT NOT NULL, 
    reason               TEXT DEFAULT NULL,
    approved_at          TIMESTAMP NULL, 
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (direct_booking_id) REFERENCES venue_direct_bookings(direct_booking_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TABLE venue_blocked_dates (
    blocked_id        INT AUTO_INCREMENT PRIMARY KEY,
    venue_id          INT NOT NULL,
    venue_admin_id    INT NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    reason            VARCHAR(255) DEFAULT NULL,  
    description       TEXT DEFAULT NULL,           
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (venue_id, start_date, end_date)
);

CREATE TABLE venue_overtime_logs (
    overtime_id        INT AUTO_INCREMENT PRIMARY KEY,
    booking_id         INT NOT NULL,
    coordinator_id     INT DEFAULT NULL,
    venue_admin_id     INT DEFAULT NULL,
    overtime_hours     DECIMAL(5,2) NOT NULL,
    rate_per_hour      DECIMAL(12,2) NOT NULL,
    total_amount       DECIMAL(12,2) NOT NULL,
    notes              TEXT DEFAULT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_id) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TABLE booking_adjustments (
    adjustment_id     	INT AUTO_INCREMENT PRIMARY KEY,
    booking_id        	INT NULL,
    direct_booking_id 	INT NULL,
    venue_id          	INT NOT NULL,
    coordinator_id    	INT DEFAULT NULL,
    venue_admin_id    	INT DEFAULT NULL,
    adjustment_type   	ENUM('discount','extra_charge') NOT NULL,
    adjustment_method 	ENUM('fixed','percentage') NOT NULL DEFAULT 'fixed',
    description       	VARCHAR(255) DEFAULT NULL,
    amount            	DECIMAL(12,2) NOT NULL,
    created_at        	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (direct_booking_id) REFERENCES venue_direct_bookings(direct_booking_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_id) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);

CREATE TABLE booking_billing_summary (
    billing_id          	INT AUTO_INCREMENT PRIMARY KEY,
    booking_id          	INT NOT NULL,
    base_amount         	DECIMAL(12,2) NOT NULL,
    overtime_amount     	DECIMAL(12,2) DEFAULT 0,
    total_discounts     	DECIMAL(12,2) DEFAULT 0,
    total_extra_charges 	DECIMAL(12,2) DEFAULT 0,
    final_amount        	DECIMAL(12,2) NOT NULL,
    coordinator_id      	INT DEFAULT NULL,
    venue_admin_id      	INT DEFAULT NULL,
    created_at        		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          	TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_id) REFERENCES coordinators(coordinator_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_admin_id) REFERENCES venue_administrators(venue_admin_id) ON DELETE CASCADE
);