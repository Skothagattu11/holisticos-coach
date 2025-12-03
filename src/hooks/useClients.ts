import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/lib/services';
import type { ClientWithStatus, CoachingStatus } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export const useAllClients = () => {
  return useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }
      return clientService.fetchAllClients();
    },
  });
};

export const useCoachClients = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['clients', 'coach', coachId],
    queryFn: async () => {
      if (!coachId) return [];
      if (!isSupabaseConfigured()) {
        return [];
      }
      return clientService.fetchCoachClients(coachId);
    },
    enabled: !!coachId,
  });
};

export const useClientByRelationship = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: ['client', 'relationship', relationshipId],
    queryFn: () => clientService.fetchClientByRelationshipId(relationshipId!),
    enabled: !!relationshipId && isSupabaseConfigured(),
  });
};

export const useCoachingRelationship = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: ['relationship', relationshipId],
    queryFn: () => clientService.fetchRelationship(relationshipId!),
    enabled: !!relationshipId && isSupabaseConfigured(),
  });
};

export const useCoachingSessions = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: ['sessions', relationshipId],
    queryFn: () => clientService.fetchSessions(relationshipId!),
    enabled: !!relationshipId && isSupabaseConfigured(),
  });
};

export const useUpdateRelationshipStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, status }: {
      relationshipId: string;
      status: CoachingStatus;
    }) => clientService.updateRelationshipStatus(relationshipId, status),
    onSuccess: (_, { relationshipId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['relationship', relationshipId] });
    },
  });
};

export const useScheduleSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, scheduledAt, sessionType, durationMinutes }: {
      relationshipId: string;
      scheduledAt: string;
      sessionType?: 'initial_review' | 'follow_up' | 'check_in';
      durationMinutes?: number;
    }) => clientService.scheduleSession(relationshipId, scheduledAt, sessionType, durationMinutes),
    onSuccess: (_, { relationshipId }) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', relationshipId] });
      queryClient.invalidateQueries({ queryKey: ['relationship', relationshipId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, notes }: {
      sessionId: string;
      notes?: string;
    }) => clientService.completeSession(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useClientCountsByStatus = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['client-counts', coachId],
    queryFn: () => clientService.getClientCountsByStatus(coachId!),
    enabled: !!coachId && isSupabaseConfigured(),
  });
};
