import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/lib/services/planService';
import type { CoachingPlan, CoachingPlanItem, PlanItemCategory, PlanItemFrequency } from '@/types';

// Query keys
export const planKeys = {
  all: ['plans'] as const,
  byRelationship: (relationshipId: string) => [...planKeys.all, 'relationship', relationshipId] as const,
  active: (relationshipId: string) => [...planKeys.all, 'active', relationshipId] as const,
  detail: (planId: string) => [...planKeys.all, 'detail', planId] as const,
  itemCounts: (planId: string) => [...planKeys.all, 'counts', planId] as const,
};

// ==================== PLAN QUERIES ====================

// Fetch all plans for a coaching relationship
export const useClientPlans = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: planKeys.byRelationship(relationshipId || ''),
    queryFn: () => planService.fetchPlansByRelationship(relationshipId!),
    enabled: !!relationshipId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch active plan for a relationship
export const useActivePlan = (relationshipId: string | undefined) => {
  return useQuery({
    queryKey: planKeys.active(relationshipId || ''),
    queryFn: () => planService.fetchActivePlan(relationshipId!),
    enabled: !!relationshipId,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch single plan with items
export const usePlanWithItems = (planId: string | undefined) => {
  return useQuery({
    queryKey: planKeys.detail(planId || ''),
    queryFn: () => planService.fetchPlanWithItems(planId!),
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch plan item counts by category
export const usePlanItemCounts = (planId: string | undefined) => {
  return useQuery({
    queryKey: planKeys.itemCounts(planId || ''),
    queryFn: () => planService.getPlanItemCounts(planId!),
    enabled: !!planId,
    staleTime: 1000 * 60 * 5,
  });
};

// ==================== PLAN MUTATIONS ====================

// Create a new plan
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      relationshipId,
      title,
      description,
    }: {
      relationshipId: string;
      title: string;
      description?: string;
    }) => planService.createPlan(relationshipId, title, description),
    onSuccess: (newPlan, { relationshipId }) => {
      // Invalidate plans list
      queryClient.invalidateQueries({ queryKey: planKeys.byRelationship(relationshipId) });
      // Invalidate active plan (since new plan becomes active)
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Update plan details
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      updates,
    }: {
      planId: string;
      relationshipId: string;
      updates: {
        title?: string;
        description?: string;
        isActive?: boolean;
      };
    }) => planService.updatePlan(planId, updates),
    onSuccess: (updatedPlan, { planId, relationshipId }) => {
      // Update plan in cache
      queryClient.setQueryData(planKeys.detail(planId), updatedPlan);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: planKeys.byRelationship(relationshipId) });
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Set a plan as active
export const useSetActivePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      relationshipId,
    }: {
      planId: string;
      relationshipId: string;
    }) => planService.setActivePlan(planId, relationshipId),
    onSuccess: (_, { relationshipId }) => {
      // Invalidate all plan queries for this relationship
      queryClient.invalidateQueries({ queryKey: planKeys.byRelationship(relationshipId) });
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Delete a plan
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      relationshipId,
    }: {
      planId: string;
      relationshipId: string;
    }) => planService.deletePlan(planId),
    onSuccess: (_, { planId, relationshipId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: planKeys.detail(planId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: planKeys.byRelationship(relationshipId) });
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// ==================== PLAN ITEM MUTATIONS ====================

// Add a plan item
export const useAddPlanItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      item,
    }: {
      planId: string;
      relationshipId: string;
      item: {
        title: string;
        description?: string;
        category: PlanItemCategory;
        frequency: PlanItemFrequency;
        scheduledTime?: string;
        durationMinutes?: number;
      };
    }) => planService.addPlanItem(planId, item),
    onSuccess: (newItem, { planId, relationshipId }) => {
      // Invalidate plan detail to get updated items
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      // Invalidate item counts
      queryClient.invalidateQueries({ queryKey: planKeys.itemCounts(planId) });
      // Invalidate active plan if this is it
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Update a plan item
export const useUpdatePlanItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      updates,
    }: {
      itemId: string;
      planId: string;
      relationshipId: string;
      updates: {
        title?: string;
        description?: string;
        category?: PlanItemCategory;
        frequency?: PlanItemFrequency;
        scheduledTime?: string;
        durationMinutes?: number;
      };
    }) => planService.updatePlanItem(itemId, updates),
    onSuccess: (updatedItem, { planId, relationshipId }) => {
      // Invalidate plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      // Invalidate item counts (category might have changed)
      queryClient.invalidateQueries({ queryKey: planKeys.itemCounts(planId) });
      // Invalidate active plan
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Delete a plan item
export const useDeletePlanItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
    }: {
      itemId: string;
      planId: string;
      relationshipId: string;
    }) => planService.deletePlanItem(itemId),
    onSuccess: (_, { planId, relationshipId }) => {
      // Invalidate plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      // Invalidate item counts
      queryClient.invalidateQueries({ queryKey: planKeys.itemCounts(planId) });
      // Invalidate active plan
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// Reorder plan items
export const useReorderPlanItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      itemIds,
    }: {
      planId: string;
      relationshipId: string;
      itemIds: string[];
    }) => planService.reorderPlanItems(planId, itemIds),
    onSuccess: (_, { planId, relationshipId }) => {
      // Invalidate plan detail to get updated order
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      // Invalidate active plan
      queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
    },
  });
};

// ==================== CONVENIENCE HOOKS ====================

// Combined hook for common plan operations
export const usePlans = (relationshipId: string | undefined) => {
  const queryClient = useQueryClient();
  const { data: plans, isLoading: isLoadingPlans, refetch: refetchPlans } = useClientPlans(relationshipId);
  const { data: activePlan, isLoading: isLoadingActive, refetch: refetchActive } = useActivePlan(relationshipId);

  const refetch = () => {
    refetchPlans();
    refetchActive();
  };

  return {
    plans: plans || [],
    activePlan,
    isLoading: isLoadingPlans || isLoadingActive,
    refetchPlans: refetch,
    invalidatePlans: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({ queryKey: planKeys.byRelationship(relationshipId) });
        queryClient.invalidateQueries({ queryKey: planKeys.active(relationshipId) });
      }
    },
  };
};
