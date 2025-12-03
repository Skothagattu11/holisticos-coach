import { supabase, isSupabaseConfigured } from '../supabase';
import type { CoachingPlan, CoachingPlanItem, PlanItemCategory, PlanItemFrequency } from '@/types';

// Transform Supabase data to CoachingPlan
const transformPlan = (data: any): CoachingPlan => {
  return {
    id: data.id,
    relationshipId: data.relationship_id,
    title: data.title,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    items: data.plan_items?.map(transformPlanItem) || [],
  };
};

// Transform Supabase data to CoachingPlanItem
const transformPlanItem = (data: any): CoachingPlanItem => {
  return {
    id: data.id,
    planId: data.plan_id,
    title: data.title,
    description: data.description,
    category: data.category as PlanItemCategory,
    frequency: data.frequency as PlanItemFrequency,
    scheduledTime: data.scheduled_time,
    durationMinutes: data.duration_minutes,
    sortOrder: data.sort_order || 0,
    createdAt: data.created_at,
  };
};

export const planService = {
  // ==================== PLANS ====================

  // Fetch all plans for a coaching relationship
  async fetchPlansByRelationship(relationshipId: string): Promise<CoachingPlan[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_plans')
      .select(`
        *,
        plan_items (*)
      `)
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformPlan);
  },

  // Fetch active plan for a relationship
  async fetchActivePlan(relationshipId: string): Promise<CoachingPlan | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_plans')
      .select(`
        *,
        plan_items (*)
      `)
      .eq('relationship_id', relationshipId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data ? transformPlan(data) : null;
  },

  // Fetch single plan with items
  async fetchPlanWithItems(planId: string): Promise<CoachingPlan | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_plans')
      .select(`
        *,
        plan_items (*)
      `)
      .eq('id', planId)
      .single();

    if (error) throw error;
    return data ? transformPlan(data) : null;
  },

  // Create a new plan
  async createPlan(relationshipId: string, title: string, description?: string): Promise<CoachingPlan> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // First, deactivate any existing active plans for this relationship
    await supabase
      .from('coaching_plans')
      .update({ is_active: false })
      .eq('relationship_id', relationshipId)
      .eq('is_active', true);

    // Create the new plan
    const { data, error } = await supabase
      .from('coaching_plans')
      .insert({
        relationship_id: relationshipId,
        title,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return transformPlan({ ...data, plan_items: [] });
  },

  // Update plan details
  async updatePlan(planId: string, updates: {
    title?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<CoachingPlan> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('coaching_plans')
      .update({
        title: updates.title,
        description: updates.description,
        is_active: updates.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select(`
        *,
        plan_items (*)
      `)
      .single();

    if (error) throw error;
    return transformPlan(data);
  },

  // Set a plan as active (deactivates others)
  async setActivePlan(planId: string, relationshipId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Deactivate all plans for this relationship
    await supabase
      .from('coaching_plans')
      .update({ is_active: false })
      .eq('relationship_id', relationshipId);

    // Activate the selected plan
    const { error } = await supabase
      .from('coaching_plans')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) throw error;
  },

  // Delete a plan
  async deletePlan(planId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Plan items will be deleted via CASCADE
    const { error } = await supabase
      .from('coaching_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  },

  // ==================== PLAN ITEMS ====================

  // Add a plan item
  async addPlanItem(planId: string, item: {
    title: string;
    description?: string;
    category: PlanItemCategory;
    frequency: PlanItemFrequency;
    scheduledTime?: string;
    durationMinutes?: number;
  }): Promise<CoachingPlanItem> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Get current max sort order
    const { data: existingItems } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingItems && existingItems.length > 0
      ? (existingItems[0].sort_order || 0) + 1
      : 0;

    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        plan_id: planId,
        title: item.title,
        description: item.description,
        category: item.category,
        frequency: item.frequency,
        scheduled_time: item.scheduledTime,
        duration_minutes: item.durationMinutes,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    // Update plan's updated_at
    await supabase
      .from('coaching_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', planId);

    return transformPlanItem(data);
  },

  // Update a plan item
  async updatePlanItem(itemId: string, updates: {
    title?: string;
    description?: string;
    category?: PlanItemCategory;
    frequency?: PlanItemFrequency;
    scheduledTime?: string;
    durationMinutes?: number;
  }): Promise<CoachingPlanItem> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('plan_items')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        frequency: updates.frequency,
        scheduled_time: updates.scheduledTime,
        duration_minutes: updates.durationMinutes,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Update plan's updated_at
    if (data.plan_id) {
      await supabase
        .from('coaching_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.plan_id);
    }

    return transformPlanItem(data);
  },

  // Delete a plan item
  async deletePlanItem(itemId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Get plan_id before deleting
    const { data: item } = await supabase
      .from('plan_items')
      .select('plan_id')
      .eq('id', itemId)
      .single();

    const { error } = await supabase
      .from('plan_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Update plan's updated_at
    if (item?.plan_id) {
      await supabase
        .from('coaching_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', item.plan_id);
    }
  },

  // Reorder plan items
  async reorderPlanItems(planId: string, itemIds: string[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Update sort_order for each item
    const updates = itemIds.map((id, index) =>
      supabase
        .from('plan_items')
        .update({ sort_order: index })
        .eq('id', id)
    );

    await Promise.all(updates);

    // Update plan's updated_at
    await supabase
      .from('coaching_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', planId);
  },

  // ==================== TEMPLATES ====================

  // Fetch all templates for the current coach
  async fetchTemplates(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    items: any[];
    createdAt: string;
  }>> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      items: t.items || [],
      createdAt: t.created_at,
    }));
  },

  // Create a new template
  async createTemplate(name: string, description: string | undefined, items: any[]): Promise<{
    id: string;
    name: string;
    description?: string;
    items: any[];
    createdAt: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('plan_templates')
      .insert({
        coach_id: user.id,
        name,
        description,
        items,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      items: data.items || [],
      createdAt: data.created_at,
    };
  },

  // Update a template
  async updateTemplate(templateId: string, updates: {
    name?: string;
    description?: string;
    items?: any[];
  }): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('plan_templates')
      .update({
        name: updates.name,
        description: updates.description,
        items: updates.items,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) throw error;
  },

  // Delete a template
  async deleteTemplate(templateId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('plan_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  // ==================== HELPERS ====================

  // Get item counts by category for a plan
  async getPlanItemCounts(planId: string): Promise<Record<PlanItemCategory, number>> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('plan_items')
      .select('category')
      .eq('plan_id', planId);

    if (error) throw error;

    const counts: Record<PlanItemCategory, number> = {
      nutrition: 0,
      fitness: 0,
      recovery: 0,
      mindfulness: 0,
      habits: 0,
      measurements: 0,
    };

    (data || []).forEach(item => {
      const category = item.category as PlanItemCategory;
      if (category in counts) {
        counts[category]++;
      }
    });

    return counts;
  },
};
