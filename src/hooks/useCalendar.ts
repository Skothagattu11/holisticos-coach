/**
 * Calendar Hooks
 * React Query hooks for calendar data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { calendarService, CalendarEvent } from '@/lib/services/calendarService';
import { isSupabaseConfigured } from '@/lib/supabase';

export const useCalendarEvents = (
  coachId: string | undefined,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ['calendar', 'events', coachId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!coachId) return [];
      if (!isSupabaseConfigured()) {
        return [];
      }
      return calendarService.fetchAllEvents(coachId, startDate, endDate);
    },
    enabled: !!coachId,
  });
};

export const useCalendarEventsGrouped = (
  coachId: string | undefined,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ['calendar', 'events-grouped', coachId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!coachId) return new Map<string, CalendarEvent[]>();
      if (!isSupabaseConfigured()) {
        return new Map<string, CalendarEvent[]>();
      }
      return calendarService.fetchEventsGroupedByDate(coachId, startDate, endDate);
    },
    enabled: !!coachId,
  });
};

export const useCoachSessions = (
  coachId: string | undefined,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ['calendar', 'sessions', coachId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!coachId) return [];
      if (!isSupabaseConfigured()) {
        return [];
      }
      return calendarService.fetchCoachSessions(coachId, startDate, endDate);
    },
    enabled: !!coachId,
  });
};

export const useCoachCheckins = (
  coachId: string | undefined,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ['calendar', 'checkins', coachId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!coachId) return [];
      if (!isSupabaseConfigured()) {
        return [];
      }
      return calendarService.fetchCoachCheckins(coachId, startDate, endDate);
    },
    enabled: !!coachId,
  });
};
