import { supabase, isSupabaseConfigured } from '../supabase';
import type { CoachProfile, CoachCertification, ExpertSpecialty } from '@/types';

// Transform Supabase data to CoachProfile
// Email comes from joined profile data (since expert.id = user.id)
const transformCoachProfile = (data: any): CoachProfile => {
  const specialtiesData = data.expert_specialties || [];
  const credentialsData = data.expert_credentials || [];
  const profile = data.profile; // Joined profile data

  return {
    id: data.id,
    role: 'coach',
    name: data.name || '',
    email: profile?.email || '', // Get email from profile
    photo: data.photo_url,
    status: data.is_active ? 'active' : 'inactive',
    bio: data.bio,
    certifications: credentialsData.map((c: any) => c.title),
    rosterIds: [],
    specialties: specialtiesData.map((s: any) => s.specialty_key as ExpertSpecialty),
    certificationsList: credentialsData.map((c: any) => ({
      id: c.id,
      coachId: data.id,
      name: c.title,
      issuer: c.issuing_organization || '',
      issuedAt: c.issued_date,
      expiresAt: c.expiry_date,
      verificationUrl: c.verification_url,
    })),
    hourlyRate: data.hourly_rate,
    responseTimeHours: data.response_time_hours,
    rating: data.rating_average,
    reviewCount: data.rating_count,
    clientCount: data.total_clients,
    yearsExperience: data.years_experience,
    timezone: data.timezone,
    location: data.location,
    language: data.language,
    isVerified: data.is_verified,
    isAcceptingClients: data.is_accepting_clients,
  };
};

// Helper to fetch profiles by IDs (for email lookup)
const fetchProfilesByIds = async (userIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || userIds.length === 0) return {};

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    (data || []).forEach(p => {
      profileMap[p.id] = p;
    });
    return profileMap;
  } catch (err) {
    console.warn('Error fetching profiles for coaches:', err);
    return {};
  }
};

export const coachService = {
  // Get expert ID for a user (checks both id match and user_id column)
  async getExpertIdForUser(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('getExpertIdForUser: Supabase not configured');
      return null;
    }

    try {
      // First check if expert.id = user.id (our preferred linking method)
      console.log('getExpertIdForUser: Checking expert.id =', userId);
      const { data: expertById, error: error1 } = await supabase
        .from('experts')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error1) {
        console.warn('getExpertIdForUser: Error checking by id:', error1);
      }

      if (expertById) {
        console.log('getExpertIdForUser: Found expert by id match:', expertById.id);
        return expertById.id;
      }

      // Fallback: check if expert.user_id = user.id
      console.log('getExpertIdForUser: Checking expert.user_id =', userId);
      const { data: expertByUserId, error: error2 } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error2) {
        console.warn('getExpertIdForUser: Error checking by user_id:', error2);
      }

      if (expertByUserId) {
        console.log('getExpertIdForUser: Found expert by user_id match:', expertByUserId.id);
        return expertByUserId.id;
      }

      console.log('getExpertIdForUser: No expert found for user:', userId);
      return null;
    } catch (err) {
      console.warn('Error getting expert ID for user:', err);
      return null;
    }
  },

  // Fetch all coaches
  async fetchCoaches(): Promise<CoachProfile[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('experts')
      .select(`
        *,
        expert_specialties (specialty_key),
        expert_credentials (id, title, issuing_organization, issued_date, expiry_date, verification_url)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Fetch profiles to get emails (expert.id = user.id = profile.id)
    const expertIds = data.map(e => e.id);
    const profileMap = await fetchProfilesByIds(expertIds);

    // Attach profile data to each expert
    return data.map(expert =>
      transformCoachProfile({ ...expert, profile: profileMap[expert.id] })
    );
  },

  // Fetch single coach by ID
  async fetchCoachById(coachId: string): Promise<CoachProfile | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('experts')
      .select(`
        *,
        expert_specialties (specialty_key),
        expert_credentials (id, title, issuing_organization, issued_date, expiry_date, verification_url)
      `)
      .eq('id', coachId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch profile for email (expert.id = user.id = profile.id)
    const profileMap = await fetchProfilesByIds([coachId]);
    return transformCoachProfile({ ...data, profile: profileMap[coachId] });
  },

  // Create new coach profile
  // Note: experts table doesn't have email column
  async createCoach(profile: {
    name: string;
    email?: string; // Kept for interface compatibility but not stored in experts table
    bio?: string;
    photoUrl?: string;
    hourlyRate?: number;
    yearsExperience?: number;
    specialties?: ExpertSpecialty[];
  }): Promise<CoachProfile> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Insert expert record (email not stored in experts table)
    const { data: expert, error: expertError } = await supabase
      .from('experts')
      .insert({
        name: profile.name,
        bio: profile.bio,
        photo_url: profile.photoUrl,
        hourly_rate: profile.hourlyRate,
        years_experience: profile.yearsExperience,
        is_active: true,
      })
      .select()
      .single();

    if (expertError) throw expertError;

    // Insert specialties if provided
    if (profile.specialties && profile.specialties.length > 0) {
      const specialtiesData = profile.specialties.map(s => ({
        expert_id: expert.id,
        specialty_key: s,
      }));

      const { error: specialtiesError } = await supabase
        .from('expert_specialties')
        .insert(specialtiesData);

      if (specialtiesError) console.error('Error adding specialties:', specialtiesError);
    }

    return this.fetchCoachById(expert.id) as Promise<CoachProfile>;
  },

  // Update coach profile
  async updateCoach(coachId: string, updates: {
    name?: string;
    bio?: string;
    photoUrl?: string;
    hourlyRate?: number;
    yearsExperience?: number;
    isActive?: boolean;
    timezone?: string;
    location?: string;
    language?: string;
    isVerified?: boolean;
    isAcceptingClients?: boolean;
  }): Promise<CoachProfile> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('experts')
      .update({
        name: updates.name,
        bio: updates.bio,
        photo_url: updates.photoUrl,
        hourly_rate: updates.hourlyRate,
        years_experience: updates.yearsExperience,
        is_active: updates.isActive,
        timezone: updates.timezone,
        location: updates.location,
        language: updates.language,
        is_verified: updates.isVerified,
        is_accepting_clients: updates.isAcceptingClients,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coachId);

    if (error) throw error;
    return this.fetchCoachById(coachId) as Promise<CoachProfile>;
  },

  // Add certification to coach
  async addCertification(coachId: string, certification: {
    name: string;
    issuer: string;
    issuedAt?: string;
    expiresAt?: string;
    verificationUrl?: string;
  }): Promise<CoachCertification> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('expert_credentials')
      .insert({
        expert_id: coachId,
        title: certification.name,
        issuing_organization: certification.issuer,
        issued_date: certification.issuedAt,
        expiry_date: certification.expiresAt,
        verification_url: certification.verificationUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      coachId: coachId,
      name: data.title,
      issuer: data.issuing_organization,
      issuedAt: data.issued_date,
      expiresAt: data.expiry_date,
      verificationUrl: data.verification_url,
    };
  },

  // Remove certification
  async removeCertification(certificationId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('expert_credentials')
      .delete()
      .eq('id', certificationId);

    if (error) throw error;
  },

  // Update coach specialties
  async updateSpecialties(coachId: string, specialties: ExpertSpecialty[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Remove existing specialties
    await supabase
      .from('expert_specialties')
      .delete()
      .eq('expert_id', coachId);

    // Add new specialties
    if (specialties.length > 0) {
      const { error } = await supabase
        .from('expert_specialties')
        .insert(specialties.map(s => ({
          expert_id: coachId,
          specialty_key: s,
        })));

      if (error) throw error;
    }
  },

  // Get coach's default template settings
  async getCoachSettings(coachId: string): Promise<{
    defaultQuestionnaireId: string | null;
    defaultPlanTemplateId: string | null;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { defaultQuestionnaireId: null, defaultPlanTemplateId: null };
    }

    const { data, error } = await supabase
      .from('experts')
      .select('default_questionnaire_id, default_plan_template_id')
      .eq('id', coachId)
      .single();

    if (error) {
      console.warn('Error fetching coach settings:', error);
      return { defaultQuestionnaireId: null, defaultPlanTemplateId: null };
    }

    return {
      defaultQuestionnaireId: data?.default_questionnaire_id || null,
      defaultPlanTemplateId: data?.default_plan_template_id || null,
    };
  },

  // Update coach's default template settings
  async updateCoachSettings(coachId: string, settings: {
    defaultQuestionnaireId?: string | null;
    defaultPlanTemplateId?: string | null;
  }): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (settings.defaultQuestionnaireId !== undefined) {
      updateData.default_questionnaire_id = settings.defaultQuestionnaireId;
    }
    if (settings.defaultPlanTemplateId !== undefined) {
      updateData.default_plan_template_id = settings.defaultPlanTemplateId;
    }

    console.log('updateCoachSettings: Updating expert', coachId, 'with:', updateData);

    const { data, error } = await supabase
      .from('experts')
      .update(updateData)
      .eq('id', coachId)
      .select();

    console.log('updateCoachSettings: Result:', { data, error });

    if (error) throw error;
  },

  // Fetch coach's assigned clients - uses separate queries to avoid join issues
  async fetchCoachClients(coachId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch relationships
    const { data: relationships, error } = await supabase
      .from('coaching_relationships')
      .select('*')
      .eq('expert_id', coachId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!relationships || relationships.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(relationships.map(r => r.user_id).filter(Boolean))];

    // Fetch profiles separately
    let profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds);

        (profiles || []).forEach(p => {
          profileMap[p.id] = p;
        });
      } catch (err) {
        console.warn('Error fetching profiles:', err);
      }
    }

    // Combine data
    return relationships.map(rel => ({
      ...rel,
      profile: profileMap[rel.user_id] || null,
    }));
  },
};
