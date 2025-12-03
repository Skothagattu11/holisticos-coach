-- ============================================
-- USER ROLES & PROFILES
-- Migration: 002_user_roles.sql
-- Description: Adds user roles and profiles tables for dashboard authentication
-- ============================================

-- ============================================
-- 1. CREATE TABLES FIRST (no policies yet)
-- ============================================

-- User Roles Table (create first since profiles policy references it)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'coach', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    email_confirmed_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES FOR USER_ROLES
-- ============================================
CREATE POLICY "user_roles_select_own" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_admin" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "user_roles_update_admin" ON public.user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Allow system to insert roles (for trigger)
CREATE POLICY "user_roles_insert_system" ON public.user_roles
    FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 4. RLS POLICIES FOR PROFILES
-- ============================================
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow system to insert profiles (for trigger)
CREATE POLICY "profiles_insert_system" ON public.profiles
    FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 5. TRIGGERS FOR AUTO-SYNC
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, avatar_url, email_confirmed_at, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email_confirmed_at,
        NEW.created_at
    );

    -- Insert default user_role (client)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile on user update
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', full_name),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        email_confirmed_at = NEW.email_confirmed_at,
        last_sign_in_at = NEW.last_sign_in_at,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid;
    RETURN COALESCE(user_role, 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is coach (or admin)
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. SYNC EXISTING USERS (one-time)
-- ============================================
INSERT INTO public.profiles (id, email, full_name, email_confirmed_at, created_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
    email_confirmed_at,
    created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach TO anon, authenticated;
