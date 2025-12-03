import { supabase, isSupabaseConfigured } from '../supabase';
import type { ClientWithStatus, CoachingRelationship, CoachingSession, CoachingStatus } from '@/types';

// Helper to fetch profiles by IDs
const fetchProfilesByIds = async (userIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || userIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (error) {
      console.warn('Error fetching profiles:', error);
      return {};
    }

    const profileMap: Record<string, any> = {};
    (data || []).forEach(p => {
      profileMap[p.id] = p;
    });
    return profileMap;
  } catch (err) {
    console.warn('Exception fetching profiles:', err);
    return {};
  }
};

// Helper to fetch experts by IDs
const fetchExpertsByIds = async (expertIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || expertIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id, name, email, photo_url')
      .in('id', expertIds);

    if (error) {
      console.warn('Error fetching experts:', error);
      return {};
    }

    const expertMap: Record<string, any> = {};
    (data || []).forEach(e => {
      expertMap[e.id] = e;
    });
    return expertMap;
  } catch (err) {
    console.warn('Exception fetching experts:', err);
    return {};
  }
};

// Transform coaching relationship to client with status
const transformClientWithStatus = (relationship: any, profile: any, expert?: any): ClientWithStatus => {
  return {
    id: profile?.id || relationship.user_id,
    role: 'client',
    name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
    email: profile?.email || '',
    photo: profile?.avatar_url,
    status: 'active',
    archetypes: [],
    goals: [],
    riskLevel: 'low',
    assignedCoachId: relationship.expert_id,
    assignedCoachName: expert?.name,
    adherence7d: 0,
    adherence30d: 0,
    sleep7dAvg: 0,
    hrv7dAvg: 0,
    rhr7dAvg: 0,
    lastSyncTime: new Date().toISOString(),
    devices: [],
    coachingStatus: relationship.status as CoachingStatus,
    nextSessionAt: relationship.next_session_at,
    questionnaireCompletedAt: relationship.questionnaire_completed_at,
    relationshipId: relationship.id,
  };
};

export const clientService = {
  // Fetch all clients with their coaching status (for admin)
  async fetchAllClients(): Promise<ClientWithStatus[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch relationships
    const { data: relationships, error } = await supabase
      .from('coaching_relationships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!relationships || relationships.length === 0) return [];

    // Get unique user IDs and expert IDs
    const userIds = [...new Set(relationships.map(r => r.user_id).filter(Boolean))];
    const expertIds = [...new Set(relationships.map(r => r.expert_id).filter(Boolean))];

    // Fetch profiles and experts in parallel
    const [profileMap, expertMap] = await Promise.all([
      fetchProfilesByIds(userIds),
      fetchExpertsByIds(expertIds),
    ]);

    // Transform data
    return relationships.map(rel =>
      transformClientWithStatus(rel, profileMap[rel.user_id], expertMap[rel.expert_id])
    );
  },

  // Fetch clients for a specific coach
  async fetchCoachClients(coachId: string): Promise<ClientWithStatus[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    console.log('[fetchCoachClients] Fetching clients for coach:', coachId);

    // Fetch relationships for this coach
    const { data: relationships, error } = await supabase
      .from('coaching_relationships')
      .select('*')
      .eq('expert_id', coachId)
      .order('created_at', { ascending: false });

    console.log('[fetchCoachClients] Query result:', { relationships, error });

    if (error) {
      console.error('[fetchCoachClients] Error:', error);
      throw error;
    }
    if (!relationships || relationships.length === 0) {
      console.log('[fetchCoachClients] No relationships found');
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(relationships.map(r => r.user_id).filter(Boolean))];

    // Fetch profiles
    const profileMap = await fetchProfilesByIds(userIds);

    // Transform data
    return relationships.map(rel =>
      transformClientWithStatus(rel, profileMap[rel.user_id])
    );
  },

  // Fetch single client by relationship ID
  async fetchClientByRelationshipId(relationshipId: string): Promise<ClientWithStatus | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch relationship
    const { data: relationship, error } = await supabase
      .from('coaching_relationships')
      .select('*')
      .eq('id', relationshipId)
      .single();

    if (error) throw error;
    if (!relationship) return null;

    // Fetch profile and expert in parallel
    const [profileMap, expertMap] = await Promise.all([
      fetchProfilesByIds([relationship.user_id].filter(Boolean)),
      fetchExpertsByIds([relationship.expert_id].filter(Boolean)),
    ]);

    return transformClientWithStatus(
      relationship,
      profileMap[relationship.user_id],
      expertMap[relationship.expert_id]
    );
  },

  // Fetch coaching relationship details
  async fetchRelationship(relationshipId: string): Promise<CoachingRelationship | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch relationship data
    const { data, error } = await supabase
      .from('coaching_relationships')
      .select('*')
      .eq('id', relationshipId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch profile and expert in parallel
    const [profileMap, expertMap] = await Promise.all([
      fetchProfilesByIds([data.user_id].filter(Boolean)),
      fetchExpertsByIds([data.expert_id].filter(Boolean)),
    ]);

    const profile = profileMap[data.user_id];
    const expert = expertMap[data.expert_id];

    return {
      id: data.id,
      coachId: data.expert_id,
      clientId: data.user_id,
      status: data.status as CoachingStatus,
      startedAt: data.created_at,
      nextSessionAt: data.next_session_at,
      questionnaireCompletedAt: data.questionnaire_completed_at,
      client: {
        id: profile?.id || data.user_id,
        email: profile?.email || '',
        name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
      },
      coach: {
        id: expert?.id,
        name: expert?.name,
        email: expert?.email,
      },
    } as CoachingRelationship;
  },

  // Fetch scheduled sessions for a relationship
  async fetchSessions(relationshipId: string): Promise<CoachingSession[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(session => ({
      id: session.id,
      relationshipId: session.relationship_id,
      scheduledAt: session.scheduled_at,
      sessionType: session.session_type,
      status: session.status,
      notes: session.notes,
      durationMinutes: session.duration_minutes || 30,
    }));
  },

  // Update coaching relationship status
  async updateRelationshipStatus(
    relationshipId: string,
    status: CoachingStatus
  ): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coaching_relationships')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationshipId);

    if (error) throw error;
  },

  // Schedule a new session
  async scheduleSession(
    relationshipId: string,
    scheduledAt: string,
    sessionType: 'initial_review' | 'follow_up' | 'check_in' = 'follow_up',
    durationMinutes: number = 30
  ): Promise<CoachingSession> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        relationship_id: relationshipId,
        scheduled_at: scheduledAt,
        session_type: sessionType,
        duration_minutes: durationMinutes,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Update relationship's next_session_at
    await supabase
      .from('coaching_relationships')
      .update({
        next_session_at: scheduledAt,
        status: 'scheduled_review',
      })
      .eq('id', relationshipId);

    return {
      id: data.id,
      relationshipId: data.relationship_id,
      scheduledAt: data.scheduled_at,
      sessionType: data.session_type,
      status: data.status,
      notes: data.notes,
      durationMinutes: data.duration_minutes,
    };
  },

  // Mark session as completed
  async completeSession(sessionId: string, notes?: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'completed',
        notes,
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Get client counts by status for a coach
  async getClientCountsByStatus(coachId: string): Promise<Record<CoachingStatus, number>> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_relationships')
      .select('status')
      .eq('expert_id', coachId);

    if (error) throw error;

    const counts: Record<CoachingStatus, number> = {
      pending_questionnaire: 0,
      pending_schedule: 0,
      scheduled_review: 0,
      active: 0,
      paused: 0,
      completed: 0,
    };

    (data || []).forEach(item => {
      const status = item.status as CoachingStatus;
      if (status in counts) {
        counts[status]++;
      }
    });

    return counts;
  },
};
