-- ============================================
-- ADD FOREIGN KEYS TO PROFILES TABLE
-- This allows joining coaching_relationships to profiles via REST API
-- ============================================

-- Add foreign key from coaching_relationships.user_id to profiles.id
-- This enables the `profile:user_id (...)` join syntax in Supabase queries
ALTER TABLE coaching_relationships
ADD CONSTRAINT coaching_relationships_user_id_profiles_fk
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Note: The original foreign key to auth.users remains, but Supabase
-- will use the profiles foreign key for REST API joins since auth.users
-- is not directly accessible via REST.
