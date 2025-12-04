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

  // Fetch client check-ins for a relationship
  async fetchClientCheckIns(relationshipId: string, limit: number = 30): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Parse tasks_completed_details if it's a JSON string
    return (data || []).map(checkin => ({
      ...checkin,
      tasks_completed_details: typeof checkin.tasks_completed_details === 'string'
        ? JSON.parse(checkin.tasks_completed_details)
        : checkin.tasks_completed_details,
    }));
  },

  // Fetch client check-ins by user ID (if no relationship_id set)
  async fetchCheckInsByUserId(userId: string, limit: number = 30): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Parse tasks_completed_details if it's a JSON string
    return (data || []).map(checkin => ({
      ...checkin,
      tasks_completed_details: typeof checkin.tasks_completed_details === 'string'
        ? JSON.parse(checkin.tasks_completed_details)
        : checkin.tasks_completed_details,
    }));
  },

  // Fetch questionnaire responses for a client
  async fetchQuestionnaireResponses(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        questionnaire:questionnaire_id (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Fetch messages between coach and client
  // Note: coaching_messages table doesn't exist yet - returns empty array
  async fetchMessages(relationshipId: string, limit: number = 50): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('coaching_messages')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        // Table doesn't exist - return empty array silently
        console.log('Messages table not available yet');
        return [];
      }
      return data || [];
    } catch (err) {
      console.log('Messages feature not available');
      return [];
    }
  },

  // Send a message to client
  // Note: coaching_messages table doesn't exist yet
  async sendMessage(relationshipId: string, senderId: string, content: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('coaching_messages')
        .insert({
          relationship_id: relationshipId,
          sender_id: senderId,
          content: content,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Messages table not available:', error.message);
        throw new Error('Messaging feature not available yet');
      }
      return data;
    } catch (err) {
      throw new Error('Messaging feature not available yet');
    }
  },

  // Get next scheduled meeting/check-in
  async getNextScheduledEvent(relationshipId: string): Promise<any | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      // Check for scheduled meetings in coaching_sessions
      const { data: meetings, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('relationship_id', relationshipId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1);

      if (!error && meetings && meetings.length > 0) {
        return { type: 'meeting', ...meetings[0] };
      }
    } catch (err) {
      console.log('Could not fetch scheduled events');
    }

    return null;
  },

  // ============================================
  // AVAILABILITY MANAGEMENT
  // ============================================

  // Fetch coach's weekly availability slots
  async fetchAvailability(expertId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('expert_availability')
      .select('*')
      .eq('expert_id', expertId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add a new availability slot
  async addAvailabilitySlot(expertId: string, slot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('expert_availability')
      .insert({
        expert_id: expertId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an availability slot
  async updateAvailabilitySlot(slotId: string, updates: {
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {};
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;

    const { data, error } = await supabase
      .from('expert_availability')
      .update(updateData)
      .eq('id', slotId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an availability slot
  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('expert_availability')
      .delete()
      .eq('id', slotId);

    if (error) throw error;
  },

  // Fetch blocked dates for a coach
  async fetchBlockedDates(expertId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('expert_blocked_dates')
      .select('*')
      .eq('expert_id', expertId)
      .order('blocked_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add a blocked date
  async addBlockedDate(expertId: string, date: string, reason?: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('expert_blocked_dates')
      .insert({
        expert_id: expertId,
        blocked_date: date,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a blocked date
  async deleteBlockedDate(blockedDateId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('expert_blocked_dates')
      .delete()
      .eq('id', blockedDateId);

    if (error) throw error;
  },

  // Fetch session requests for a coach (pending and scheduled)
  async fetchSessionRequests(expertId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coaching_relationships!inner(
          id,
          expert_id,
          user_id,
          profiles:user_id(id, email, full_name)
        )
      `)
      .eq('coaching_relationships.expert_id', expertId)
      .in('status', ['pending_coach_review', 'scheduled'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Confirm a session request (coach selects one proposed slot)
  async confirmSessionRequest(
    sessionId: string,
    selectedSlotIndex: number,
    selectedTime: string
  ): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'scheduled',
        scheduled_at: selectedTime,
        selected_slot_index: selectedSlotIndex,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    // Update the coaching relationship status
    if (data?.relationship_id) {
      await supabase
        .from('coaching_relationships')
        .update({
          status: 'scheduled_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.relationship_id);
    }

    return data;
  },

  // Cancel a session request
  async cancelSessionRequest(sessionId: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // ============================================
  // HEALTH METRICS (DAILY PLANS)
  // ============================================

  // Fetch daily plan for a specific user and date
  // Contains WHOOP/Oura data analysis and AI review
  async fetchDailyPlan(userId: string, date: string): Promise<any | null> {
    console.log('[coachService] fetchDailyPlan called:', { userId, date });

    if (!isSupabaseConfigured() || !supabase) {
      console.log('[coachService] Supabase not configured');
      return null;
    }

    try {
      console.log('[coachService] Executing query...');
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      console.log('[coachService] Query result:', { data, error });

      if (error) {
        console.warn('[coachService] Error fetching daily plan:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('[coachService] Exception fetching daily plan:', err);
      return null;
    }
  },

  // Fetch the most recent daily plans for a user (to find available data)
  async fetchRecentDailyPlans(userId: string, limit: number = 14): Promise<any[]> {
    console.log('[coachService] fetchRecentDailyPlans called:', { userId, limit });

    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      console.log('[coachService] Recent plans result:', { count: data?.length, error });

      if (error) {
        console.warn('[coachService] Error fetching recent plans:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[coachService] Exception fetching recent plans:', err);
      return [];
    }
  },

  // Fetch all daily plans (for debugging - no user filter)
  async fetchAllDailyPlans(limit: number = 10): Promise<any[]> {
    console.log('[coachService] fetchAllDailyPlans called');

    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('user_id, date, protocol_name, energy_zone')
        .order('date', { ascending: false })
        .limit(limit);

      console.log('[coachService] All plans result:', data);

      if (error) {
        console.warn('[coachService] Error fetching all plans:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[coachService] Exception fetching all plans:', err);
      return [];
    }
  },

  // Fetch daily plans for a date range
  async fetchDailyPlansForRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.warn('Error fetching daily plans range:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching daily plans range:', err);
      return [];
    }
  },

  // ============================================
  // COACH NOTES
  // ============================================

  // Fetch notes for a client relationship
  async fetchNotes(relationshipId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching notes:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching notes:', err);
      return [];
    }
  },

  // Create a new note
  async createNote(note: {
    relationshipId: string;
    expertId: string;
    userId: string;
    content: string;
    noteType?: 'general' | 'session' | 'progress' | 'concern' | 'goal';
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coach_notes')
      .insert({
        relationship_id: note.relationshipId,
        expert_id: note.expertId,
        user_id: note.userId,
        content: note.content,
        note_type: note.noteType || 'general',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a note
  async updateNote(noteId: string, updates: {
    content?: string;
    noteType?: string;
    isPinned?: boolean;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.noteType !== undefined) updateData.note_type = updates.noteType;
    if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;

    const { data, error } = await supabase
      .from('coach_notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coach_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // Toggle pin status
  async toggleNotePin(noteId: string, isPinned: boolean): Promise<any> {
    return this.updateNote(noteId, { isPinned });
  },

  // ============================================
  // COACH ALERTS
  // ============================================

  // Fetch alerts for a coach (all clients)
  async fetchAlerts(expertId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('coach_alerts')
        .select('*')
        .eq('expert_id', expertId)
        .eq('is_dismissed', false)
        .order('triggered_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching alerts:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching alerts:', err);
      return [];
    }
  },

  // Fetch alerts for a specific client
  async fetchClientAlerts(relationshipId: string, limit: number = 20): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('coach_alerts')
        .select('*')
        .eq('relationship_id', relationshipId)
        .eq('is_dismissed', false)
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching client alerts:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching client alerts:', err);
      return [];
    }
  },

  // Create a new alert
  async createAlert(alert: {
    relationshipId: string;
    expertId: string;
    userId: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    metricData?: any;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coach_alerts')
      .insert({
        relationship_id: alert.relationshipId,
        expert_id: alert.expertId,
        user_id: alert.userId,
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        metric_data: alert.metricData || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark alert as read
  async markAlertRead(alertId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coach_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  // Mark multiple alerts as read
  async markAlertsRead(alertIds: string[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase || alertIds.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('coach_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in('id', alertIds);

    if (error) throw error;
  },

  // Dismiss alert
  async dismissAlert(alertId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coach_alerts')
      .update({
        is_dismissed: true,
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  // Mark alert as actioned (coach took action)
  async actionAlert(alertId: string, notes?: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coach_alerts')
      .update({
        is_actioned: true,
        actioned_at: new Date().toISOString(),
        action_notes: notes || null,
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  // Get unread alert count
  async getUnreadAlertCount(expertId: string): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('coach_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .eq('is_read', false)
        .eq('is_dismissed', false);

      if (error) {
        console.warn('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.warn('Error getting unread count:', err);
      return 0;
    }
  },

  // Fetch alert preferences for a coach
  async fetchAlertPreferences(expertId: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('coach_alert_preferences')
        .select('*')
        .eq('expert_id', expertId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching alert preferences:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('Error fetching alert preferences:', err);
      return null;
    }
  },

  // Update alert preferences
  async updateAlertPreferences(expertId: string, preferences: {
    recoveryLowThreshold?: number;
    recoveryCriticalThreshold?: number;
    sleepPerformanceLowThreshold?: number;
    sleepDurationMinHours?: number;
    strainHighThreshold?: number;
    hrvDropPercentThreshold?: number;
    daysWithoutCheckinThreshold?: number;
    emailAlertsEnabled?: boolean;
    pushAlertsEnabled?: boolean;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (preferences.recoveryLowThreshold !== undefined) {
      updateData.recovery_low_threshold = preferences.recoveryLowThreshold;
    }
    if (preferences.recoveryCriticalThreshold !== undefined) {
      updateData.recovery_critical_threshold = preferences.recoveryCriticalThreshold;
    }
    if (preferences.sleepPerformanceLowThreshold !== undefined) {
      updateData.sleep_performance_low_threshold = preferences.sleepPerformanceLowThreshold;
    }
    if (preferences.sleepDurationMinHours !== undefined) {
      updateData.sleep_duration_min_hours = preferences.sleepDurationMinHours;
    }
    if (preferences.strainHighThreshold !== undefined) {
      updateData.strain_high_threshold = preferences.strainHighThreshold;
    }
    if (preferences.hrvDropPercentThreshold !== undefined) {
      updateData.hrv_drop_percent_threshold = preferences.hrvDropPercentThreshold;
    }
    if (preferences.daysWithoutCheckinThreshold !== undefined) {
      updateData.days_without_checkin_threshold = preferences.daysWithoutCheckinThreshold;
    }
    if (preferences.emailAlertsEnabled !== undefined) {
      updateData.email_alerts_enabled = preferences.emailAlertsEnabled;
    }
    if (preferences.pushAlertsEnabled !== undefined) {
      updateData.push_alerts_enabled = preferences.pushAlertsEnabled;
    }

    // Upsert - insert if not exists, update if exists
    const { data, error } = await supabase
      .from('coach_alert_preferences')
      .upsert({
        expert_id: expertId,
        ...updateData,
      }, {
        onConflict: 'expert_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // CLIENT GOALS
  // ============================================

  // Fetch goals for a client
  async fetchClientGoals(relationshipId: string): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('client_goals')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching goals:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching goals:', err);
      return [];
    }
  },

  // Create a new goal
  async createGoal(goal: {
    relationshipId: string;
    userId: string;
    expertId: string;
    title: string;
    description?: string;
    category: 'sleep' | 'recovery' | 'activity' | 'nutrition' | 'mindfulness' | 'other';
    targetType: 'value' | 'streak' | 'habit' | 'milestone';
    targetValue?: number;
    targetUnit?: string;
    priority?: 'low' | 'medium' | 'high';
    targetDate?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('client_goals')
      .insert({
        relationship_id: goal.relationshipId,
        user_id: goal.userId,
        expert_id: goal.expertId,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        target_type: goal.targetType,
        target_value: goal.targetValue,
        target_unit: goal.targetUnit,
        priority: goal.priority || 'medium',
        target_date: goal.targetDate,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a goal
  async updateGoal(goalId: string, updates: {
    title?: string;
    description?: string;
    category?: string;
    targetValue?: number;
    targetUnit?: string;
    currentValue?: number;
    streakDays?: number;
    status?: 'active' | 'completed' | 'paused' | 'cancelled';
    priority?: string;
    targetDate?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
    if (updates.targetUnit !== undefined) updateData.target_unit = updates.targetUnit;
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue;
    if (updates.streakDays !== undefined) updateData.streak_days = updates.streakDays;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;

    const { data, error } = await supabase
      .from('client_goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a goal
  async deleteGoal(goalId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('client_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },

  // Record progress for a goal
  async recordGoalProgress(progress: {
    goalId: string;
    userId: string;
    value?: number;
    isAchieved?: boolean;
    notes?: string;
    source?: 'manual' | 'whoop' | 'oura' | 'checkin' | 'auto';
    recordedDate?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const recordedDate = progress.recordedDate || new Date().toISOString().split('T')[0];

    // Upsert - update if exists for this date, insert if not
    const { data, error } = await supabase
      .from('goal_progress')
      .upsert({
        goal_id: progress.goalId,
        user_id: progress.userId,
        recorded_date: recordedDate,
        value: progress.value,
        is_achieved: progress.isAchieved ?? false,
        notes: progress.notes,
        source: progress.source || 'manual',
      }, {
        onConflict: 'goal_id,recorded_date',
      })
      .select()
      .single();

    if (error) throw error;

    // Update goal's current value and streak
    await this.updateGoalFromProgress(progress.goalId);

    return data;
  },

  // Update goal stats from progress records
  async updateGoalFromProgress(goalId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      // Fetch recent progress
      const { data: progress } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('recorded_date', { ascending: false })
        .limit(30);

      if (!progress || progress.length === 0) return;

      // Calculate current streak
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = today;

      for (const p of progress) {
        if (p.recorded_date === checkDate && p.is_achieved) {
          streak++;
          // Move to previous day
          const date = new Date(checkDate);
          date.setDate(date.getDate() - 1);
          checkDate = date.toISOString().split('T')[0];
        } else if (p.recorded_date < checkDate) {
          break;
        }
      }

      // Get latest value
      const latestValue = progress[0]?.value;

      // Update goal
      const { data: goal } = await supabase
        .from('client_goals')
        .select('best_streak')
        .eq('id', goalId)
        .single();

      await supabase
        .from('client_goals')
        .update({
          current_value: latestValue,
          streak_days: streak,
          best_streak: Math.max(streak, goal?.best_streak || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId);
    } catch (err) {
      console.warn('Error updating goal from progress:', err);
    }
  },

  // Fetch progress history for a goal
  async fetchGoalProgress(goalId: string, limit: number = 30): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('recorded_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching goal progress:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching goal progress:', err);
      return [];
    }
  },

  // Get goal summary stats for a client
  async getGoalsSummary(relationshipId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    avgProgress: number;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { total: 0, active: 0, completed: 0, avgProgress: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('client_goals')
        .select('status, current_value, target_value')
        .eq('relationship_id', relationshipId);

      if (error || !data) {
        return { total: 0, active: 0, completed: 0, avgProgress: 0 };
      }

      const total = data.length;
      const active = data.filter(g => g.status === 'active').length;
      const completed = data.filter(g => g.status === 'completed').length;

      // Calculate average progress for value-based goals
      const valueGoals = data.filter(g => g.target_value && g.target_value > 0);
      const avgProgress = valueGoals.length > 0
        ? valueGoals.reduce((acc, g) => acc + ((g.current_value || 0) / g.target_value) * 100, 0) / valueGoals.length
        : 0;

      return { total, active, completed, avgProgress: Math.round(avgProgress) };
    } catch (err) {
      console.warn('Error getting goals summary:', err);
      return { total: 0, active: 0, completed: 0, avgProgress: 0 };
    }
  },

  // ============================================
  // COACHING SESSIONS
  // ============================================

  // Fetch sessions for a client relationship
  async fetchClientSessions(relationshipId: string, options?: {
    status?: string[];
    upcoming?: boolean;
    limit?: number;
  }): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('coaching_sessions')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('scheduled_at', { ascending: true });

      if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      if (options?.upcoming) {
        query = query.gte('scheduled_at', new Date().toISOString());
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching sessions:', err);
      return [];
    }
  },

  // Fetch all sessions for a coach (across all clients)
  async fetchCoachSessions(expertId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: string[];
  }): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      // First get relationships for this coach
      const { data: relationships } = await supabase
        .from('coaching_relationships')
        .select('id, user_id')
        .eq('expert_id', expertId);

      if (!relationships || relationships.length === 0) {
        return [];
      }

      const relationshipIds = relationships.map(r => r.id);

      let query = supabase
        .from('coaching_sessions')
        .select('*')
        .in('relationship_id', relationshipIds)
        .order('scheduled_at', { ascending: true });

      if (options?.startDate) {
        query = query.gte('scheduled_at', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('scheduled_at', options.endDate);
      }

      if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching coach sessions:', error);
        return [];
      }

      // Attach relationship info (user_id) for easy reference
      const relMap: Record<string, string> = {};
      relationships.forEach(r => {
        relMap[r.id] = r.user_id;
      });

      return (data || []).map(session => ({
        ...session,
        user_id: relMap[session.relationship_id],
      }));
    } catch (err) {
      console.warn('Error fetching coach sessions:', err);
      return [];
    }
  },

  // Create a new session
  async createSession(session: {
    relationshipId: string;
    sessionType: 'initial_review' | 'review' | 'follow_up' | 'check_in';
    scheduledAt: string;
    durationMinutes?: number;
    meetingUrl?: string;
    meetingProvider?: string;
    expertNotes?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        relationship_id: session.relationshipId,
        session_type: session.sessionType,
        scheduled_at: session.scheduledAt,
        duration_minutes: session.durationMinutes || 30,
        meeting_url: session.meetingUrl,
        meeting_provider: session.meetingProvider,
        expert_notes: session.expertNotes,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a session
  async updateSession(sessionId: string, updates: {
    scheduledAt?: string;
    durationMinutes?: number;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
    meetingUrl?: string;
    meetingProvider?: string;
    expertNotes?: string;
    userNotes?: string;
    cancellationReason?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.scheduledAt !== undefined) updateData.scheduled_at = updates.scheduledAt;
    if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (updates.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
    }
    if (updates.meetingUrl !== undefined) updateData.meeting_url = updates.meetingUrl;
    if (updates.meetingProvider !== undefined) updateData.meeting_provider = updates.meetingProvider;
    if (updates.expertNotes !== undefined) updateData.expert_notes = updates.expertNotes;
    if (updates.userNotes !== undefined) updateData.user_notes = updates.userNotes;
    if (updates.cancellationReason !== undefined) updateData.cancellation_reason = updates.cancellationReason;

    const { data, error } = await supabase
      .from('coaching_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coaching_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Mark session as completed
  async completeSession(sessionId: string, notes?: string): Promise<any> {
    return this.updateSession(sessionId, {
      status: 'completed',
      expertNotes: notes,
    });
  },

  // Cancel a session
  async cancelSession(sessionId: string, reason?: string): Promise<any> {
    return this.updateSession(sessionId, {
      status: 'cancelled',
      cancellationReason: reason,
    });
  },

  // Reschedule a session
  async rescheduleSession(sessionId: string, newScheduledAt: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Get the current session
    const { data: current } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!current) {
      throw new Error('Session not found');
    }

    // Update the current session status to rescheduled
    await supabase
      .from('coaching_sessions')
      .update({
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Create a new session with the new time
    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        relationship_id: current.relationship_id,
        session_type: current.session_type,
        scheduled_at: newScheduledAt,
        duration_minutes: current.duration_minutes,
        meeting_url: current.meeting_url,
        meeting_provider: current.meeting_provider,
        expert_notes: current.expert_notes,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get session stats for a relationship
  async getSessionStats(relationshipId: string): Promise<{
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    noShow: number;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { total: 0, completed: 0, upcoming: 0, cancelled: 0, noShow: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('status, scheduled_at')
        .eq('relationship_id', relationshipId);

      if (error || !data) {
        return { total: 0, completed: 0, upcoming: 0, cancelled: 0, noShow: 0 };
      }

      const now = new Date().toISOString();
      const total = data.length;
      const completed = data.filter(s => s.status === 'completed').length;
      const upcoming = data.filter(s => s.status === 'scheduled' && s.scheduled_at > now).length;
      const cancelled = data.filter(s => s.status === 'cancelled').length;
      const noShow = data.filter(s => s.status === 'no_show').length;

      return { total, completed, upcoming, cancelled, noShow };
    } catch (err) {
      console.warn('Error getting session stats:', err);
      return { total: 0, completed: 0, upcoming: 0, cancelled: 0, noShow: 0 };
    }
  },

  // ============================================
  // WEEKLY CHECK-INS
  // ============================================

  // Helper to get ISO week string (YYYY-WW)
  getWeekString(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-${weekNum.toString().padStart(2, '0')}`;
  },

  // Get Monday of the week
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  },

  // Get Sunday of the week
  getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  },

  // Fetch weekly check-ins for a client
  async fetchWeeklyCheckins(relationshipId: string, limit: number = 12): Promise<any[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('week_start_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching weekly check-ins:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching weekly check-ins:', err);
      return [];
    }
  },

  // Fetch a specific weekly check-in
  async fetchWeeklyCheckin(relationshipId: string, weekNumber: string): Promise<any | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('relationship_id', relationshipId)
        .eq('week_number', weekNumber)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching weekly check-in:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('Error fetching weekly check-in:', err);
      return null;
    }
  },

  // Create or update a weekly check-in
  async upsertWeeklyCheckin(checkin: {
    relationshipId: string;
    userId: string;
    expertId: string;
    weekNumber: string;
    weekStartDate: string;
    weekEndDate: string;
    summary?: string;
    highlights?: string;
    areasForImprovement?: string;
    focusForNextWeek?: string;
    coachNotes?: string;
    avgEnergy?: number;
    avgMood?: number;
    avgStress?: number;
    taskCompletionRate?: number;
    checkinCount?: number;
    isSharedWithUser?: boolean;
    status?: 'draft' | 'published';
  }): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const upsertData: any = {
      relationship_id: checkin.relationshipId,
      user_id: checkin.userId,
      expert_id: checkin.expertId,
      week_number: checkin.weekNumber,
      week_start_date: checkin.weekStartDate,
      week_end_date: checkin.weekEndDate,
      updated_at: new Date().toISOString(),
    };

    if (checkin.summary !== undefined) upsertData.summary = checkin.summary;
    if (checkin.highlights !== undefined) upsertData.highlights = checkin.highlights;
    if (checkin.areasForImprovement !== undefined) upsertData.areas_for_improvement = checkin.areasForImprovement;
    if (checkin.focusForNextWeek !== undefined) upsertData.focus_for_next_week = checkin.focusForNextWeek;
    if (checkin.coachNotes !== undefined) upsertData.coach_notes = checkin.coachNotes;
    if (checkin.avgEnergy !== undefined) upsertData.avg_energy = checkin.avgEnergy;
    if (checkin.avgMood !== undefined) upsertData.avg_mood = checkin.avgMood;
    if (checkin.avgStress !== undefined) upsertData.avg_stress = checkin.avgStress;
    if (checkin.taskCompletionRate !== undefined) upsertData.task_completion_rate = checkin.taskCompletionRate;
    if (checkin.checkinCount !== undefined) upsertData.checkin_count = checkin.checkinCount;
    if (checkin.isSharedWithUser !== undefined) upsertData.is_shared_with_user = checkin.isSharedWithUser;
    if (checkin.status !== undefined) {
      upsertData.status = checkin.status;
      if (checkin.status === 'published') {
        upsertData.published_at = new Date().toISOString();
        upsertData.shared_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('weekly_checkins')
      .upsert(upsertData, {
        onConflict: 'relationship_id,week_number',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Publish a weekly check-in (make visible to user)
  async publishWeeklyCheckin(checkinId: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('weekly_checkins')
      .update({
        status: 'published',
        is_shared_with_user: true,
        published_at: new Date().toISOString(),
        shared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkinId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a weekly check-in
  async deleteWeeklyCheckin(checkinId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('weekly_checkins')
      .delete()
      .eq('id', checkinId);

    if (error) throw error;
  },

  // Calculate weekly stats from daily check-ins
  async calculateWeeklyStats(
    relationshipId: string,
    userId: string,
    weekStartDate: string,
    weekEndDate: string
  ): Promise<{
    avgEnergy: number | null;
    avgMood: number | null;
    avgStress: number | null;
    taskCompletionRate: number | null;
    checkinCount: number;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { avgEnergy: null, avgMood: null, avgStress: null, taskCompletionRate: null, checkinCount: 0 };
    }

    try {
      // Try fetching by relationship_id first
      let { data, error } = await supabase
        .from('daily_checkins')
        .select('energy_rating, mood_level, stress_level, completion_rate')
        .eq('relationship_id', relationshipId)
        .gte('checkin_date', weekStartDate)
        .lte('checkin_date', weekEndDate);

      // If no data by relationship, try by user_id
      if ((!data || data.length === 0) && userId) {
        const result = await supabase
          .from('daily_checkins')
          .select('energy_rating, mood_level, stress_level, completion_rate')
          .eq('user_id', userId)
          .gte('checkin_date', weekStartDate)
          .lte('checkin_date', weekEndDate);
        data = result.data;
        error = result.error;
      }

      if (error || !data || data.length === 0) {
        return { avgEnergy: null, avgMood: null, avgStress: null, taskCompletionRate: null, checkinCount: 0 };
      }

      const checkinCount = data.length;
      const energyValues = data.filter(d => d.energy_rating != null).map(d => d.energy_rating);
      const moodValues = data.filter(d => d.mood_level != null).map(d => d.mood_level);
      const stressValues = data.filter(d => d.stress_level != null).map(d => d.stress_level);
      const completionValues = data.filter(d => d.completion_rate != null).map(d => d.completion_rate);

      return {
        avgEnergy: energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : null,
        avgMood: moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : null,
        avgStress: stressValues.length > 0 ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length : null,
        taskCompletionRate: completionValues.length > 0 ? completionValues.reduce((a, b) => a + b, 0) / completionValues.length : null,
        checkinCount,
      };
    } catch (err) {
      console.warn('Error calculating weekly stats:', err);
      return { avgEnergy: null, avgMood: null, avgStress: null, taskCompletionRate: null, checkinCount: 0 };
    }
  },
};
