import { supabase, isSupabaseConfigured } from '../supabase';
import type { Questionnaire, QuestionnaireQuestion, QuestionnaireResponse, QuestionType } from '@/types';

// Transform JSONB questions from questionnaire_templates
const transformQuestions = (questionsJson: any[], templateId: string): QuestionnaireQuestion[] => {
  if (!questionsJson || !Array.isArray(questionsJson)) return [];

  return questionsJson.map((q: any, index: number) => ({
    id: q.id || `q_${index}`,
    questionnaireId: templateId,
    question: q.question,
    type: (q.type || 'text') as QuestionType,
    options: q.options,
    required: q.required ?? true,
    orderIndex: index,
    placeholder: q.placeholder,
  }));
};

// Transform Supabase data to Questionnaire
const transformQuestionnaire = (data: any): Questionnaire => {
  const questions = transformQuestions(data.questions, data.id);

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    specialty: data.specialty_key,
    isActive: data.is_active ?? true,
    createdBy: data.expert_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    questions,
  };
};

export const questionnaireService = {
  // Fetch all questionnaire templates
  async fetchQuestionnaires(): Promise<Questionnaire[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformQuestionnaire);
  },

  // Fetch active questionnaires
  async fetchActiveQuestionnaires(): Promise<Questionnaire[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformQuestionnaire);
  },

  // Fetch questionnaires by expert/coach
  async fetchQuestionnairesByExpert(expertId: string): Promise<Questionnaire[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformQuestionnaire);
  },

  // Fetch single questionnaire by ID
  async fetchQuestionnaireById(questionnaireId: string): Promise<Questionnaire | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('id', questionnaireId)
      .single();

    if (error) throw error;
    return data ? transformQuestionnaire(data) : null;
  },

  // Create new questionnaire template
  async createQuestionnaire(questionnaire: {
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
  }): Promise<Questionnaire> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Format questions as JSONB
    const questionsJson = questionnaire.questions.map((q, index) => ({
      id: q.id || `q_${index}`,
      question: q.question,
      type: q.type,
      options: q.options,
      required: q.required ?? true,
      placeholder: q.placeholder,
    }));

    console.log('createQuestionnaire: Inserting with expert_id:', questionnaire.createdBy);

    const { data, error } = await supabase
      .from('questionnaire_templates')
      .insert({
        title: questionnaire.title,
        description: questionnaire.description,
        specialty_key: questionnaire.specialty,
        expert_id: questionnaire.createdBy,
        questions: questionsJson,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('createQuestionnaire: Error:', error);
      throw error;
    }

    console.log('createQuestionnaire: Success, created:', data);
    return transformQuestionnaire(data);
  },

  // Update questionnaire template
  async updateQuestionnaire(questionnaireId: string, updates: {
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
  }): Promise<Questionnaire> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.specialty !== undefined) updateData.specialty_key = updates.specialty;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.questions !== undefined) {
      updateData.questions = updates.questions.map((q, index) => ({
        id: q.id || `q_${index}`,
        question: q.question,
        type: q.type,
        options: q.options,
        required: q.required ?? true,
        placeholder: q.placeholder,
      }));
    }

    const { error } = await supabase
      .from('questionnaire_templates')
      .update(updateData)
      .eq('id', questionnaireId);

    if (error) throw error;
    return this.fetchQuestionnaireById(questionnaireId) as Promise<Questionnaire>;
  },

  // Fetch responses for a relationship
  async fetchResponsesByRelationship(relationshipId: string): Promise<QuestionnaireResponse[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        template:template_id (*)
      `)
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(response => ({
      id: response.id,
      questionnaireId: response.template_id,
      relationshipId: response.relationship_id,
      clientId: response.relationship_id, // No direct user_id in questionnaire_responses
      answers: response.responses || {},
      submittedAt: response.submitted_at || response.created_at,
      reviewedAt: response.reviewed_at,
      expertNotes: response.expert_notes,
      questionnaire: response.template ? transformQuestionnaire(response.template) : undefined,
    }));
  },

  // Fetch response by ID
  async fetchResponseById(responseId: string): Promise<QuestionnaireResponse | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        template:template_id (*)
      `)
      .eq('id', responseId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      questionnaireId: data.template_id,
      relationshipId: data.relationship_id,
      clientId: data.relationship_id,
      answers: data.responses || {},
      submittedAt: data.submitted_at || data.created_at,
      reviewedAt: data.reviewed_at,
      expertNotes: data.expert_notes,
      questionnaire: data.template ? transformQuestionnaire(data.template) : undefined,
    };
  },

  // Submit questionnaire response
  async submitResponse(relationshipId: string, templateId: string, responses: Record<string, any>): Promise<QuestionnaireResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .insert({
        relationship_id: relationshipId,
        template_id: templateId,
        responses,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      questionnaireId: data.template_id,
      relationshipId: data.relationship_id,
      clientId: data.relationship_id,
      answers: data.responses || {},
      submittedAt: data.submitted_at,
    };
  },

  // Add expert notes to response
  async addExpertNotes(responseId: string, notes: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('questionnaire_responses')
      .update({
        expert_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', responseId);

    if (error) throw error;
  },

  // Delete questionnaire template
  async deleteQuestionnaire(questionnaireId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('questionnaire_templates')
      .delete()
      .eq('id', questionnaireId);

    if (error) throw error;
  },
};
