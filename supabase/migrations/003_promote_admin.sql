-- ============================================
-- PROMOTE USER TO ADMIN
-- Run this after signing up your first user
-- ============================================

-- OPTION 1: Promote by email address
-- Replace 'your-email@example.com' with the actual email
/*
UPDATE public.user_roles
SET role = 'admin', updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
*/

-- OPTION 2: Make the first registered user an admin
DO $$
DECLARE
    first_user_id UUID;
    first_user_email TEXT;
BEGIN
    -- Get the first user by created_at
    SELECT id, email INTO first_user_id, first_user_email
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;

    -- If a user exists, make them admin
    IF first_user_id IS NOT NULL THEN
        UPDATE public.user_roles
        SET role = 'admin', updated_at = NOW()
        WHERE user_id = first_user_id;

        RAISE NOTICE 'User % (%) has been promoted to admin', first_user_email, first_user_id;
    ELSE
        RAISE NOTICE 'No users found. Sign up first, then run this script.';
    END IF;
END;
$$;

-- OPTION 3: Promote a specific user ID
/*
UPDATE public.user_roles
SET role = 'admin', updated_at = NOW()
WHERE user_id = 'paste-user-uuid-here';
*/
