# HolisticOS Coach Dashboard - Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase account and project

## 1. Install Dependencies

```bash
cd holisticos-coach
npm install
```

## 2. Configure Environment Variables

Create a `.env` file in the root of the project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project:
1. Go to Project Settings > API
2. Copy the "Project URL" and "anon public" key

## 3. Set Up Database

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_create_tables.sql`
4. Paste and run the SQL

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 4. Create First Admin User

1. Start the development server: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Sign up with your email and password
4. Go to Supabase Dashboard > SQL Editor
5. Run the admin promotion script:

```sql
-- Replace with your actual email
UPDATE public.user_roles
SET role = 'admin', updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

Or run `supabase/migrations/002_seed_admin.sql` to make the first registered user an admin.

## 5. Verify Setup

1. Refresh the page (or sign out and sign in again)
2. You should now see the "User Management" menu item in the sidebar
3. Navigate to User Management to manage user roles

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access - can manage users, coaches, clients, questionnaires |
| **Coach** | Can view their own profile, their clients, questionnaires |
| **Client** | Can view dashboard and settings only |

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | Mirrors auth.users data |
| `user_roles` | Stores user roles (admin, coach, client) |
| `experts` | Coach profiles with bio, rates, experience |
| `expert_specialties` | Coach specializations |
| `expert_certifications` | Coach certifications |
| `coaching_relationships` | Links coaches to clients |
| `coaching_sessions` | Scheduled coaching sessions |
| `questionnaires` | Questionnaire templates |
| `questionnaire_questions` | Questions for each questionnaire |
| `questionnaire_responses` | Client responses to questionnaires |

## Troubleshooting

### "Failed to load users" error
- Make sure RLS policies are set up correctly
- Verify the current user has admin role in `user_roles` table

### User not showing correct role
- Check the `user_roles` table has an entry for the user
- The role should be one of: 'admin', 'coach', 'client'

### Coach profile not created when promoting user
- Ensure the `experts` table exists
- Check for any RLS policy violations in the Supabase logs

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
