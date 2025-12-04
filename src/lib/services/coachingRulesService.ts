import { supabase, isSupabaseConfigured } from '../supabase';
import type {
  CoachingRule,
  CoachingRuleCreate,
  CoachingRuleType,
  PlanItemVariations,
  CoachingPlanItemWithVariations
} from '@/types';

// Transform Supabase data to CoachingRule
const transformRule = (data: any): CoachingRule => {
  return {
    id: data.id,
    relationshipId: data.relationship_id,
    ruleType: data.rule_type as CoachingRuleType,
    title: data.title || '',
    description: data.description,
    priority: data.priority ?? 0,
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const coachingRulesService = {
  // ==================== COACHING RULES ====================

  // Fetch all rules for a coaching relationship
  async fetchRulesByRelationship(relationshipId: string): Promise<CoachingRule[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_rules')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformRule);
  },

  // Fetch active rules only
  async fetchActiveRules(relationshipId: string): Promise<CoachingRule[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_rules')
      .select('*')
      .eq('relationship_id', relationshipId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformRule);
  },

  // Create a new rule
  async createRule(rule: CoachingRuleCreate): Promise<CoachingRule> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_rules')
      .insert({
        relationship_id: rule.relationshipId,
        rule_type: rule.ruleType,
        title: rule.title,
        description: rule.description,
        priority: rule.priority ?? 5,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  // Update a rule
  async updateRule(ruleId: string, updates: {
    title?: string;
    description?: string;
    ruleType?: CoachingRuleType;
    priority?: number;
    isActive?: boolean;
  }): Promise<CoachingRule> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.ruleType !== undefined) updateData.rule_type = updates.ruleType;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('coaching_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  // Toggle rule active status
  async toggleRuleActive(ruleId: string, isActive: boolean): Promise<CoachingRule> {
    return this.updateRule(ruleId, { isActive });
  },

  // Delete a rule
  async deleteRule(ruleId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('coaching_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },

  // ==================== PLAN ITEM VARIATIONS ====================

  // Fetch plan item with variations
  async fetchPlanItemWithVariations(itemId: string): Promise<CoachingPlanItemWithVariations | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('plan_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      planId: data.plan_id,
      title: data.title,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
      scheduledTime: data.scheduled_time,
      durationMinutes: data.duration_minutes,
      sortOrder: data.sort_order || 0,
      createdAt: data.created_at,
      variations: data.variations || {},
      defaultVariation: data.default_variation || 'standard',
      aiAdjustable: data.ai_adjustable ?? true,
    };
  },

  // Update plan item variations
  async updatePlanItemVariations(itemId: string, updates: {
    variations?: PlanItemVariations;
    defaultVariation?: string;
    aiAdjustable?: boolean;
  }): Promise<CoachingPlanItemWithVariations> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {};

    if (updates.variations !== undefined) updateData.variations = updates.variations;
    if (updates.defaultVariation !== undefined) updateData.default_variation = updates.defaultVariation;
    if (updates.aiAdjustable !== undefined) updateData.ai_adjustable = updates.aiAdjustable;

    const { data, error } = await supabase
      .from('plan_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Update parent plan's updated_at
    if (data.plan_id) {
      await supabase
        .from('coaching_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.plan_id);
    }

    return {
      id: data.id,
      planId: data.plan_id,
      title: data.title,
      description: data.description,
      category: data.category,
      frequency: data.frequency,
      scheduledTime: data.scheduled_time,
      durationMinutes: data.duration_minutes,
      sortOrder: data.sort_order || 0,
      createdAt: data.created_at,
      variations: data.variations || {},
      defaultVariation: data.default_variation || 'standard',
      aiAdjustable: data.ai_adjustable ?? true,
    };
  },

  // Fetch all plan items with variations for a plan
  async fetchPlanItemsWithVariations(planId: string): Promise<CoachingPlanItemWithVariations[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      planId: item.plan_id,
      title: item.title,
      description: item.description,
      category: item.category,
      frequency: item.frequency,
      scheduledTime: item.scheduled_time,
      durationMinutes: item.duration_minutes,
      sortOrder: item.sort_order || 0,
      createdAt: item.created_at,
      variations: item.variations || {},
      defaultVariation: item.default_variation || 'standard',
      aiAdjustable: item.ai_adjustable ?? true,
    }));
  },

  // ==================== RULE TEMPLATES ====================

  // Get common rule templates for coaches to use
  getRuleTemplates(): Array<{
    title: string;
    description: string;
    ruleType: CoachingRuleType;
    priority: number;
  }> {
    return [
      {
        title: 'Low HRV Recovery',
        description: 'When HRV is more than 15% below baseline, use Light or Rest variation for workouts. Recovery is the priority.',
        ruleType: 'condition',
        priority: 10,
      },
      {
        title: 'Sleep Deprivation',
        description: 'If sleep duration is less than 6 hours, skip HIIT and focus on gentle movement and hydration.',
        ruleType: 'condition',
        priority: 9,
      },
      {
        title: 'Max Intense Days',
        description: 'Maximum 3 intense workout days per week. Client tends to overtrain when feeling good.',
        ruleType: 'constraint',
        priority: 8,
      },
      {
        title: 'Meeting Day Adjustments',
        description: 'On days with 4+ hours of meetings, prioritize stress management and short movement breaks over long workouts.',
        ruleType: 'preference',
        priority: 5,
      },
      {
        title: 'High Recovery Opportunity',
        description: 'When recovery score is above 85%, allow Intense variation for workouts to capitalize on good recovery.',
        ruleType: 'condition',
        priority: 6,
      },
      {
        title: 'Weekend Schedule',
        description: 'On weekends, allow longer workout durations and more flexibility with timing.',
        ruleType: 'preference',
        priority: 4,
      },
      {
        title: 'Stress Threshold',
        description: 'If user reports stress level above 7/10, prioritize breathwork and light movement over intense exercise.',
        ruleType: 'condition',
        priority: 8,
      },
      {
        title: 'Travel Days',
        description: 'On travel days, reduce workout expectations to 15-minute sessions and focus on mobility.',
        ruleType: 'constraint',
        priority: 7,
      },
    ];
  },
};
