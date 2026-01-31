-- ============================================
-- IMPORTANT: Before running this script, ensure you have run supabase_alter_schema.sql
-- to add the updated_at column to the otp table. If not, remove the updated_at column
-- from the INSERT statement below (it may not exist yet in your current schema).
-- ============================================

-- ============================================
-- FIX SCHEMA: Change auth_id from INTEGER to TEXT (for Supabase UUIDs)
-- ============================================
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_auth_id_key,
ALTER COLUMN auth_id TYPE TEXT USING auth_id::TEXT,
ADD UNIQUE (auth_id);

-- Replace this with your actual auth UUID from Supabase Auth
DO $$ 
DECLARE
  auth_uuid TEXT := 'd7de9f47-020a-45e7-b15f-be143bf1f9ae';
  user_id INTEGER;
BEGIN
  -- Insert user into users table
  INSERT INTO users (
    auth_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
    user_role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    auth_uuid,
    'jbalejoshift0928@gmail.com',
    'managed_by_supabase_auth',
    'Admin',
    'User',
    NULL,
    'administrator',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING users.user_id INTO user_id;

  -- Insert administrator record
  INSERT INTO administrators (
    user_id,
    position,
    role_description,
    admin_notes,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'System Administrator',
    'Full system administrator with all permissions',
    'Created via SQL script',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  -- Insert verified email verification record
  INSERT INTO email_verification (
    user_id,
    email_token_hash,
    expires_at,
    is_verified,
    verified_at,
    last_token_sent,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    '0000000000000000000000000000000000000000000000000000000071c24591',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  -- Insert OTP record (optional, for backup)
  INSERT INTO otp (
    user_id,
    otp_code_hash,
    otp_expiry,
    otp_attempts,
    otp_used_at,
    last_otp_sent,
    created_at
  ) VALUES (
    user_id,
    '00000000000000000000000000000000000000000000000000000000625ab458',
    CURRENT_TIMESTAMP + INTERVAL '10 minutes',
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  RAISE NOTICE 'Administrator account created successfully! User ID: %', user_id;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- Run this after to verify the account was created:
-- ============================================
-- SELECT u.user_id, u.email, u.first_name, u.last_name, u.user_role, u.is_active, 
--        ev.is_verified, a.position
-- FROM users u
-- LEFT JOIN email_verification ev ON u.user_id = ev.user_id
-- LEFT JOIN administrators a ON u.user_id = a.user_id
-- WHERE u.email = 'jbalejoshift0928@gmail.com';
