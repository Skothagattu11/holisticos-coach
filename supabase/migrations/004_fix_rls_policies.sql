-- ============================================
-- FIX RLS POLICIES - Remove infinite recursion
-- Run this to fix the 500 error
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_system" ON public.user_roles;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_system" ON public.profiles;

-- ============================================
-- SIMPLE RLS POLICIES (no recursion)
-- ============================================

-- USER_ROLES: Everyone can read all roles (simple, no recursion)
CREATE POLICY "user_roles_select_all" ON public.user_roles
    FOR SELECT USING (TRUE);

-- USER_ROLES: Only the user's own row can be read (alternative if you want restriction)
-- CREATE POLICY "user_roles_select_own" ON public.user_roles
--     FOR SELECT USING (auth.uid() = user_id);

-- USER_ROLES: Allow inserts (for trigger/system)
CREATE POLICY "user_roles_insert_all" ON public.user_roles
    FOR INSERT WITH CHECK (TRUE);

-- USER_ROLES: Allow updates (will restrict in app layer)
CREATE POLICY "user_roles_update_all" ON public.user_roles
    FOR UPDATE USING (TRUE);

-- PROFILES: Everyone can read all profiles
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT USING (TRUE);

-- PROFILES: Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- PROFILES: Allow inserts (for trigger/system)
CREATE POLICY "profiles_insert_all" ON public.profiles
    FOR INSERT WITH CHECK (TRUE);
