/**
 * Calendar Service
 * Handles fetching sessions and check-ins for coach calendar view
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export type CalendarEventType = 'session' | 'checkin';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  dateTime: Date;
  durationMinutes: number;
  title: string;
  subtitle?: string;
  clientName?: string;
  clientId?: string;
  relationshipId?: string;
  status?: string;
  metadata?: Record<string, any>;
}

const getSessionTitle = (sessionType: string): string => {
  switch (sessionType) {
    case 'initial_review':
      return 'Initial Review';
    case 'follow_up':
      return 'Follow-up Session';
    case 'check_in':
      return 'Check-in Call';
    default:
      return 'Session';
  }
};

// Helper to fetch profiles by IDs
const fetchProfilesByIds = async (userIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || userIds.length === 0) return {};

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, raw_user_meta_data')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    (data || []).forEach(p => {
      profileMap[p.id] = p;
    });
    return profileMap;
  } catch (err) {
    console.warn('Error fetching profiles:', err);
    return {};
  }
};

export const calendarService = {
  /**
   * Fetch all scheduled sessions for the coach within a date range
   */
  async fetchCoachSessions(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      // First get all relationships where current user is the coach
      const { data: relationships, error: relError } = await supabase
        .from('coaching_relationships')
        .select('id, user_id')
        .eq('expert_id', coachId);

      console.log('[Calendar] Fetching relationships for expert:', coachId);
      console.log('[Calendar] Relationships found:', relationships);

      if (relError) {
        console.error('[Calendar] Error fetching relationships:', relError);
        throw relError;
      }
      if (!relationships || relationships.length === 0) {
        console.log('[Calendar] No relationships found for this coach');
        return [];
      }

      const relationshipIds = relationships.map((r) => r.id);
      const userIds = relationships.map((r) => r.user_id).filter(Boolean);

      // Fetch profiles for all clients
      const profileMap = await fetchProfilesByIds(userIds);

      // Create a map from relationship_id to user profile
      const relToProfile: Record<string, any> = {};
      relationships.forEach((rel) => {
        if (rel.user_id && profileMap[rel.user_id]) {
          relToProfile[rel.id] = profileMap[rel.user_id];
        }
      });

      // Fetch sessions for those relationships
      const { data: sessions, error: sessError } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          relationship_id,
          scheduled_at,
          duration_minutes,
          status,
          session_type,
          meeting_url
        `)
        .in('relationship_id', relationshipIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true });

      console.log('[Calendar] Sessions query result:', { sessions, sessError });

      if (sessError) {
        console.error('[Calendar] Error fetching sessions:', sessError);
        throw sessError;
      }
      if (!sessions) return [];

      return sessions.map((data: any) => {
        const profile = relToProfile[data.relationship_id];

        let clientName = 'Client';
        if (profile) {
          clientName = profile.full_name ||
                      profile.raw_user_meta_data?.full_name ||
                      profile.email?.split('@')[0] ||
                      'Client';
        }

        const sessionType = data.session_type || 'follow_up';

        return {
          id: data.id,
          type: 'session' as CalendarEventType,
          dateTime: new Date(data.scheduled_at),
          durationMinutes: data.duration_minutes || 30,
          title: getSessionTitle(sessionType),
          subtitle: clientName,
          clientName,
          clientId: profile?.id,
          relationshipId: data.relationship_id,
          status: data.status,
          metadata: {
            session_type: sessionType,
            meeting_url: data.meeting_url,
          },
        };
      });
    } catch (err) {
      console.error('Error fetching coach sessions:', err);
      return [];
    }
  },

  /**
   * Fetch all weekly check-ins for the coach within a date range
   */
  async fetchCoachCheckins(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      // First get all relationships where current user is the coach
      const { data: relationships, error: relError } = await supabase
        .from('coaching_relationships')
        .select('id, user_id')
        .eq('expert_id', coachId);

      if (relError) throw relError;
      if (!relationships || relationships.length === 0) return [];

      const relationshipIds = relationships.map((r) => r.id);
      const userIds = relationships.map((r) => r.user_id).filter(Boolean);

      // Fetch profiles for all clients
      const profileMap = await fetchProfilesByIds(userIds);

      // Create a map from relationship_id to user profile
      const relToProfile: Record<string, any> = {};
      relationships.forEach((rel) => {
        if (rel.user_id && profileMap[rel.user_id]) {
          relToProfile[rel.id] = profileMap[rel.user_id];
        }
      });

      // Fetch check-ins for those relationships
      const { data: checkins, error: checkError } = await supabase
        .from('weekly_checkins')
        .select(`
          id,
          relationship_id,
          week_number,
          week_start,
          week_end,
          is_reviewed
        `)
        .in('relationship_id', relationshipIds)
        .gte('week_end', startDate.toISOString().split('T')[0])
        .lte('week_end', endDate.toISOString().split('T')[0])
        .order('week_end', { ascending: true });

      if (checkError) throw checkError;
      if (!checkins) return [];

      return checkins.map((data: any) => {
        const profile = relToProfile[data.relationship_id];

        let clientName = 'Client';
        if (profile) {
          clientName = profile.full_name ||
                      profile.raw_user_meta_data?.full_name ||
                      profile.email?.split('@')[0] ||
                      'Client';
        }

        const weekNumber = data.week_number || 1;

        return {
          id: data.id,
          type: 'checkin' as CalendarEventType,
          dateTime: new Date(data.week_end),
          durationMinutes: 0, // Not a timed event
          title: `Week ${weekNumber} Check-in`,
          subtitle: clientName,
          clientName,
          clientId: profile?.id,
          relationshipId: data.relationship_id,
          status: data.is_reviewed ? 'reviewed' : 'pending',
          metadata: {
            week_number: weekNumber,
            week_start: data.week_start,
            week_end: data.week_end,
            is_reviewed: data.is_reviewed || false,
          },
        };
      });
    } catch (err) {
      console.error('Error fetching coach check-ins:', err);
      return [];
    }
  },

  /**
   * Fetch all calendar events (sessions + check-ins) for a date range
   */
  async fetchAllEvents(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const [sessions, checkins] = await Promise.all([
      this.fetchCoachSessions(coachId, startDate, endDate),
      this.fetchCoachCheckins(coachId, startDate, endDate),
    ]);

    const allEvents = [...sessions, ...checkins];

    // Sort by date/time
    allEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    return allEvents;
  },

  /**
   * Get events grouped by date for calendar display
   */
  async fetchEventsGroupedByDate(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, CalendarEvent[]>> {
    const events = await this.fetchAllEvents(coachId, startDate, endDate);

    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const dateKey = event.dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const existing = grouped.get(dateKey) || [];
      existing.push(event);
      grouped.set(dateKey, existing);
    }

    return grouped;
  },
};
