import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionnaireService } from '@/lib/services';
import type { Questionnaire, QuestionType } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

export const useQuestionnaires = () => {
  return useQuery({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }
      return questionnaireService.fetchQuestionnaires();
    },
  });
};

export const useActiveQuestionnaires = () => {
  return useQuery({
    queryKey: ['questionnaires', 'active'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }
      return questionnaireService.fetchActiveQuestionnaires();
    },
  });
};

export const useCoachQuestionnaires = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['questionnaires', 'coach', coachId],
    queryFn: async () => {
      if (!coachId || !isSupabaseConfigured()) {
        return [];
      }
      return questionnaireService.fetchQuestionnairesByExpert(coachId);
    },
    enabled: !!coachId,
  });
};

export const useQuestionnaire = (questionnaireId: string | undefined) => {
  return useQuery({
    queryKey: ['questionnaire', questionnaireId],
    queryFn: async () => {
      if (!questionnaireId) return null;
      if (!isSupabaseConfigured()) {
        return null;
      }
      return questionnaireService.fetchQuestionnaireById(questionnaireId);
    },
    enabled: !!questionnaireId,
  });
};

export const useCreateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionnaire: {
      title: string;
      description?: string;
      specialty?: string;
      createdBy: string;
      questions: Array<{
        id?: string;
        question: string;
        type: QuestionType;
        options?: string[];
        required?: boolean;
        placeholder?: string;
      }>;
    }) => questionnaireService.createQuestionnaire(questionnaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
  });
};

export const useUpdateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionnaireId, updates }: {
      questionnaireId: string;
      updates: {
        title?: string;
        description?: string;
        specialty?: string;
        isActive?: boolean;
        questions?: Array<{
          id?: string;
          question: string;
          type: QuestionType;
          options?: string[];
          required?: boolean;
          placeholder?: string;
        }>;
      };
    }) => questionnaireService.updateQuestionnaire(questionnaireId, updates),
    onSuccess: (_, { questionnaireId }) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['questionnaire', questionnaireId] });
    },
  });
};

export const useQuestionnaireResponses = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: ['questionnaire-responses', relationshipId],
    queryFn: () => questionnaireService.fetchResponsesByRelationship(relationshipId!),
    enabled: !!relationshipId && isSupabaseConfigured(),
  });
};

export const useQuestionnaireResponse = (responseId: string | undefined) => {
  return useQuery({
    queryKey: ['questionnaire-response', responseId],
    queryFn: () => questionnaireService.fetchResponseById(responseId!),
    enabled: !!responseId && isSupabaseConfigured(),
  });
};

export const useSubmitQuestionnaireResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, templateId, responses }: {
      relationshipId: string;
      templateId: string;
      responses: Record<string, any>;
    }) => questionnaireService.submitResponse(relationshipId, templateId, responses),
    onSuccess: (_, { relationshipId }) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-responses', relationshipId] });
    },
  });
};

export const useDeleteQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionnaireId: string) => questionnaireService.deleteQuestionnaire(questionnaireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    },
  });
};
