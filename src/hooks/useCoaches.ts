import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/lib/services';
import type { CoachProfile, ExpertSpecialty } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

// Get the expert ID for a user (useful when user.id != expert.id)
export const useExpertIdForUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['expert-id', userId],
    queryFn: async () => {
      if (!userId) return null;
      if (!isSupabaseConfigured()) return null;
      return coachService.getExpertIdForUser(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
};

export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }
      return coachService.fetchCoaches();
    },
  });
};

export const useCoach = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      if (!coachId) return null;
      if (!isSupabaseConfigured()) {
        return null;
      }
      return coachService.fetchCoachById(coachId);
    },
    enabled: !!coachId,
  });
};

export const useCreateCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: {
      name: string;
      email: string;
      bio?: string;
      photoUrl?: string;
      hourlyRate?: number;
      yearsExperience?: number;
      specialties?: ExpertSpecialty[];
    }) => coachService.createCoach(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

export const useUpdateCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ coachId, updates }: {
      coachId: string;
      updates: {
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
      };
    }) => coachService.updateCoach(coachId, updates),
    onSuccess: (_, { coachId }) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coach', coachId] });
    },
  });
};

export const useAddCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ coachId, certification }: {
      coachId: string;
      certification: {
        name: string;
        issuer: string;
        issuedAt?: string;
        expiresAt?: string;
        verificationUrl?: string;
      };
    }) => coachService.addCertification(coachId, certification),
    onSuccess: (_, { coachId }) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coach', coachId] });
    },
  });
};

export const useRemoveCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificationId: string) => coachService.removeCertification(certificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

export const useUpdateSpecialties = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ coachId, specialties }: {
      coachId: string;
      specialties: ExpertSpecialty[];
    }) => coachService.updateSpecialties(coachId, specialties),
    onSuccess: (_, { coachId }) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coach', coachId] });
    },
  });
};

export const useCoachClients = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['coach-clients', coachId],
    queryFn: () => coachService.fetchCoachClients(coachId!),
    enabled: !!coachId && isSupabaseConfigured(),
  });
};
