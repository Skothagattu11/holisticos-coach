import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Loader2,
  ListChecks,
  Utensils,
  Dumbbell,
  Moon,
  Brain,
  Target,
  Scale,
  GripVertical,
  Save,
  RotateCcw,
  FileUp,
  Copy,
  MoreVertical,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useActivePlan,
  useClientPlans,
  useCreatePlan,
  useUpdatePlan,
  useSetActivePlan,
  useDeletePlan,
} from "@/hooks/usePlans";
import { planService } from "@/lib/services/planService";
import type { CoachingPlan, CoachingPlanItem, PlanItemCategory, PlanItemFrequency } from "@/types";

interface PlanTabProps {
  relationshipId: string;
}

// Draft item for local state (can have temp IDs for new items)
interface DraftPlanItem extends Omit<CoachingPlanItem, 'id' | 'planId' | 'createdAt' | 'updatedAt'> {
  id: string;
  tempId?: string; // For new items not yet saved
  isDeleted?: boolean; // For tracking deletions
  isModified?: boolean; // For tracking modifications
  isNew?: boolean; // For new items
}

const CATEGORY_CONFIG: Record<PlanItemCategory, { label: string; icon: React.ElementType; color: string }> = {
  nutrition: { label: "Nutrition", icon: Utensils, color: "text-orange-500 bg-orange-500/10" },
  fitness: { label: "Fitness", icon: Dumbbell, color: "text-blue-500 bg-blue-500/10" },
  recovery: { label: "Recovery", icon: Moon, color: "text-purple-500 bg-purple-500/10" },
  mindfulness: { label: "Mindfulness", icon: Brain, color: "text-pink-500 bg-pink-500/10" },
  habits: { label: "Habits", icon: Target, color: "text-green-500 bg-green-500/10" },
  measurements: { label: "Measurements", icon: Scale, color: "text-cyan-500 bg-cyan-500/10" },
};

const FREQUENCY_OPTIONS: { value: PlanItemFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
];

export const PlanTab = ({ relationshipId }: PlanTabProps) => {
  // Dialog states
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<DraftPlanItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<PlanItemCategory>>(
    new Set(["nutrition", "fitness", "recovery", "mindfulness", "habits", "measurements"])
  );

  // New plan form state
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");

  // New item form state
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PlanItemCategory>("habits");
  const [newItemFrequency, setNewItemFrequency] = useState<PlanItemFrequency>("daily");
  const [newItemTime, setNewItemTime] = useState("");
  const [newItemDuration, setNewItemDuration] = useState("");

  // Template state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description?: string; items: any[]; itemCount: number }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Draft state - local changes not yet saved
  const [draftItems, setDraftItems] = useState<DraftPlanItem[]>([]);
  const [draftPlanTitle, setDraftPlanTitle] = useState("");
  const [draftPlanDescription, setDraftPlanDescription] = useState("");
  const [isDraftMode, setIsDraftMode] = useState(false);

  // Queries
  const { data: activePlan, isLoading: loadingPlan } = useActivePlan(relationshipId);
  const { data: allPlans = [] } = useClientPlans(relationshipId);

  // Mutations
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const setActivePlan = useSetActivePlan();
  const deletePlan = useDeletePlan();

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Initialize draft from active plan when it loads
  useEffect(() => {
    if (activePlan && !isDraftMode) {
      setDraftItems(
        (activePlan.items || []).map(item => ({
          ...item,
          isDeleted: false,
          isModified: false,
          isNew: false,
        }))
      );
      setDraftPlanTitle(activePlan.title);
      setDraftPlanDescription(activePlan.description || "");
    }
  }, [activePlan, isDraftMode]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!activePlan) return draftItems.length > 0;

    // Check for any modifications
    const hasModifiedItems = draftItems.some(item => item.isModified || item.isNew || item.isDeleted);
    const titleChanged = draftPlanTitle !== activePlan.title;
    const descriptionChanged = draftPlanDescription !== (activePlan.description || "");

    return hasModifiedItems || titleChanged || descriptionChanged;
  }, [draftItems, draftPlanTitle, draftPlanDescription, activePlan]);

  // Get visible draft items (not deleted)
  const visibleDraftItems = useMemo(() => {
    return draftItems.filter(item => !item.isDeleted);
  }, [draftItems]);

  const toggleCategory = (category: PlanItemCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) {
      toast.error("Please enter a plan title");
      return;
    }

    try {
      await createPlan.mutateAsync({
        relationshipId,
        title: newPlanTitle,
        description: newPlanDescription || undefined,
      });
      toast.success("Plan created successfully");
      setNewPlanTitle("");
      setNewPlanDescription("");
      setIsCreatePlanOpen(false);
      setDraftItems([]);
      setIsDraftMode(false);
    } catch (error) {
      toast.error("Failed to create plan");
      console.error(error);
    }
  };

  const handleAddItemToDraft = () => {
    if (!newItemTitle.trim()) {
      toast.error("Please enter an item title");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newItem: DraftPlanItem = {
      id: tempId,
      tempId,
      title: newItemTitle,
      description: newItemDescription || undefined,
      category: newItemCategory,
      frequency: newItemFrequency,
      scheduledTime: newItemTime || undefined,
      durationMinutes: newItemDuration ? parseInt(newItemDuration) : undefined,
      sortOrder: draftItems.length,
      isNew: true,
      isModified: false,
      isDeleted: false,
    };

    setDraftItems(prev => [...prev, newItem]);
    setIsDraftMode(true);
    toast.success("Item added to draft");
    resetItemForm();
    setIsAddItemOpen(false);
  };

  const handleUpdateItemInDraft = () => {
    if (!editingItem) return;

    setDraftItems(prev =>
      prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            title: newItemTitle,
            description: newItemDescription || undefined,
            category: newItemCategory,
            frequency: newItemFrequency,
            scheduledTime: newItemTime || undefined,
            durationMinutes: newItemDuration ? parseInt(newItemDuration) : undefined,
            isModified: !item.isNew, // Only mark as modified if not new
          };
        }
        return item;
      })
    );
    setIsDraftMode(true);
    toast.success("Item updated in draft");
    resetItemForm();
    setEditingItem(null);
  };

  const handleDeleteItemFromDraft = (item: DraftPlanItem) => {
    if (item.isNew) {
      // If it's a new item, just remove it
      setDraftItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      // Mark existing item as deleted
      setDraftItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, isDeleted: true } : i))
      );
    }
    setIsDraftMode(true);
    toast.success("Item removed from draft");
  };

  const handleSaveAllChanges = async () => {
    if (!activePlan) {
      toast.error("No active plan to save to");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update plan title/description if changed
      if (draftPlanTitle !== activePlan.title || draftPlanDescription !== (activePlan.description || "")) {
        await planService.updatePlan(activePlan.id, {
          title: draftPlanTitle,
          description: draftPlanDescription || undefined,
        });
      }

      // 2. Process item changes in batch
      const newItems = draftItems.filter(item => item.isNew && !item.isDeleted);
      const modifiedItems = draftItems.filter(item => item.isModified && !item.isNew && !item.isDeleted);
      const deletedItems = draftItems.filter(item => item.isDeleted && !item.isNew);

      // Delete items
      for (const item of deletedItems) {
        await planService.deletePlanItem(item.id);
      }

      // Add new items
      for (const item of newItems) {
        await planService.addPlanItem(activePlan.id, {
          title: item.title,
          description: item.description,
          category: item.category,
          frequency: item.frequency,
          scheduledTime: item.scheduledTime,
          durationMinutes: item.durationMinutes,
        });
      }

      // Update modified items
      for (const item of modifiedItems) {
        await planService.updatePlanItem(item.id, {
          title: item.title,
          description: item.description,
          category: item.category,
          frequency: item.frequency,
          scheduledTime: item.scheduledTime,
          durationMinutes: item.durationMinutes,
        });
      }

      toast.success("All changes saved successfully!");
      setIsDraftMode(false);

      // Refresh the plan data
      window.location.reload(); // Simple refresh to get updated data
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (activePlan) {
      setDraftItems(
        (activePlan.items || []).map(item => ({
          ...item,
          isDeleted: false,
          isModified: false,
          isNew: false,
        }))
      );
      setDraftPlanTitle(activePlan.title);
      setDraftPlanDescription(activePlan.description || "");
    } else {
      setDraftItems([]);
      setDraftPlanTitle("");
      setDraftPlanDescription("");
    }
    setIsDraftMode(false);
    setConfirmDiscardOpen(false);
    toast.info("Changes discarded");
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setLoadingTemplates(true);
    try {
      // Save template to Supabase (coach-specific)
      const items = visibleDraftItems.map(({ id, tempId, isDeleted, isModified, isNew, ...item }) => item);
      await planService.createTemplate(templateName, templateDescription || undefined, items);

      toast.success("Plan saved as template!");
      setTemplateName("");
      setTemplateDescription("");
      setIsTemplateDialogOpen(false);
      loadTemplates();
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const fetchedTemplates = await planService.fetchTemplates();
      setTemplates(fetchedTemplates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        items: t.items,
        itemCount: t.items?.length || 0,
      })));
    } catch (error) {
      console.error("Failed to load templates:", error);
      // Silently fail - templates are optional
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      toast.error("Template not found");
      return;
    }

    const templateItems: DraftPlanItem[] = template.items.map((item: any, index: number) => ({
      ...item,
      id: `temp-${Date.now()}-${index}`,
      tempId: `temp-${Date.now()}-${index}`,
      isNew: true,
      isModified: false,
      isDeleted: false,
      sortOrder: draftItems.length + index,
    }));

    setDraftItems(prev => [...prev, ...templateItems]);
    setIsDraftMode(true);
    setIsApplyTemplateOpen(false);
    toast.success(`Applied template: ${template.name}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await planService.deleteTemplate(templateId);
      loadTemplates();
      toast.success("Template deleted");
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleSetActivePlan = async (planId: string) => {
    try {
      await setActivePlan.mutateAsync({ planId, relationshipId });
      toast.success("Plan activated");
      setSelectedPlanId(null);
    } catch (error) {
      toast.error("Failed to activate plan");
      console.error(error);
    }
  };

  const handleDuplicatePlan = async (plan: CoachingPlan) => {
    try {
      const newPlan = await createPlan.mutateAsync({
        relationshipId,
        title: `${plan.title} (Copy)`,
        description: plan.description,
      });

      // Copy items from original plan
      if (plan.items && newPlan) {
        for (const item of plan.items) {
          await planService.addPlanItem(newPlan.id, {
            title: item.title,
            description: item.description,
            category: item.category,
            frequency: item.frequency,
            scheduledTime: item.scheduledTime,
            durationMinutes: item.durationMinutes,
          });
        }
      }

      toast.success("Plan duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate plan");
      console.error(error);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const resetItemForm = () => {
    setNewItemTitle("");
    setNewItemDescription("");
    setNewItemCategory("habits");
    setNewItemFrequency("daily");
    setNewItemTime("");
    setNewItemDuration("");
  };

  const openEditItem = (item: DraftPlanItem) => {
    setEditingItem(item);
    setNewItemTitle(item.title);
    setNewItemDescription(item.description || "");
    setNewItemCategory(item.category);
    setNewItemFrequency(item.frequency);
    setNewItemTime(item.scheduledTime || "");
    setNewItemDuration(item.durationMinutes?.toString() || "");
  };

  const getItemsByCategory = (category: PlanItemCategory): DraftPlanItem[] => {
    return visibleDraftItems
      .filter((item) => item.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDiscardOpen(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAllChanges}
                  disabled={isSaving}
                  className="bg-success hover:bg-success/90"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Header */}
      {activePlan ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  {isDraftMode ? (
                    <Input
                      value={draftPlanTitle}
                      onChange={(e) => setDraftPlanTitle(e.target.value)}
                      className="text-lg font-semibold h-8 max-w-md"
                    />
                  ) : (
                    <CardTitle>{activePlan.title}</CardTitle>
                  )}
                </div>
                {isDraftMode ? (
                  <Textarea
                    value={draftPlanDescription}
                    onChange={(e) => setDraftPlanDescription(e.target.value)}
                    placeholder="Plan description..."
                    className="mt-2 resize-none"
                    rows={2}
                  />
                ) : (
                  activePlan.description && (
                    <CardDescription className="mt-1">{activePlan.description}</CardDescription>
                  )
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-success border-success">
                  Active
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Save as Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsApplyTemplateOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Apply Template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDuplicatePlan(activePlan)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Plan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsCreatePlanOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Items:</span>
                <span className="ml-2 font-medium">{visibleDraftItems.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(activePlan.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {new Date(activePlan.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">All Plans:</span>
                <span className="ml-2 font-medium">{allPlans.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Plan</h3>
            <p className="text-muted-foreground mb-4">
              Create a coaching plan or apply a template to get started.
            </p>
            <div className="flex justify-center gap-2">
              <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Plan</DialogTitle>
                    <DialogDescription>
                      Create a coaching plan for your client. Add items after creating the plan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-title">Plan Title</Label>
                      <Input
                        id="plan-title"
                        placeholder="e.g., Week 1-4 Foundation Phase"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-description">Description (optional)</Label>
                      <Textarea
                        id="plan-description"
                        placeholder="Describe the goals for this plan..."
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePlan} disabled={createPlan.isPending}>
                      {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {templates.length > 0 && (
                <Button variant="outline" onClick={() => setIsApplyTemplateOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  From Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {activePlan && (
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsApplyTemplateOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </div>
          <Dialog open={isAddItemOpen || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setIsAddItemOpen(false);
              setEditingItem(null);
              resetItemForm();
            } else {
              setIsAddItemOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Plan Item" : "Add Plan Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details for this plan item."
                    : "Add a new item to the plan. Changes will be saved when you click 'Save Changes'."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item-title">Title *</Label>
                  <Input
                    id="item-title"
                    placeholder="e.g., Morning Protein Shake"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    placeholder="Add details or instructions..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={newItemCategory}
                      onValueChange={(v) => setNewItemCategory(v as PlanItemCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(CATEGORY_CONFIG) as [PlanItemCategory, typeof CATEGORY_CONFIG[PlanItemCategory]][]).map(
                          ([value, config]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Select
                      value={newItemFrequency}
                      onValueChange={(v) => setNewItemFrequency(v as PlanItemFrequency)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-time">Scheduled Time</Label>
                    <Input
                      id="item-time"
                      type="time"
                      value={newItemTime}
                      onChange={(e) => setNewItemTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-duration">Duration (minutes)</Label>
                    <Input
                      id="item-duration"
                      type="number"
                      placeholder="30"
                      value={newItemDuration}
                      onChange={(e) => setNewItemDuration(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddItemOpen(false);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingItem ? handleUpdateItemInDraft : handleAddItemToDraft}>
                  {editingItem ? "Update Item" : "Add to Draft"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Plan Items by Category */}
      {activePlan && (
        <div className="space-y-4">
          {(Object.entries(CATEGORY_CONFIG) as [PlanItemCategory, typeof CATEGORY_CONFIG[PlanItemCategory]][]).map(
            ([category, config]) => {
              const items = getItemsByCategory(category);
              const Icon = config.icon;
              const isExpanded = expandedCategories.has(category);

              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-md", config.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            {config.label}
                            <Badge variant="secondary" className="ml-2">
                              {items.length}
                            </Badge>
                          </CardTitle>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {items.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No {config.label.toLowerCase()} items yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group",
                                  item.isNew && "border-success/50 bg-success/5",
                                  item.isModified && "border-warning/50 bg-warning/5"
                                )}
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground/50 mt-0.5 cursor-grab" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{item.title}</p>
                                        {item.isNew && (
                                          <Badge variant="outline" className="text-xs text-success border-success">
                                            New
                                          </Badge>
                                        )}
                                        {item.isModified && (
                                          <Badge variant="outline" className="text-xs text-warning border-warning">
                                            Modified
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditItem(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteItemFromDraft(item)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {item.frequency}
                                    </Badge>
                                    {item.scheduledTime && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(item.scheduledTime)}
                                      </span>
                                    )}
                                    {item.durationMinutes && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {item.durationMinutes} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            }
          )}
        </div>
      )}

      {/* All Plans */}
      {allPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Plans ({allPlans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    plan.isActive && "border-success/50 bg-success/5"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{plan.title}</p>
                      {plan.isActive && (
                        <Badge variant="outline" className="text-success border-success text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.createdAt).toLocaleDateString()} • {plan.items?.length || 0} items
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!plan.isActive && (
                        <DropdownMenuItem onClick={() => handleSetActivePlan(plan.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Set as Active
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Delete this plan?")) {
                            deletePlan.mutate({ planId: plan.id, relationshipId });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save as Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this plan as a template to reuse with other clients. Templates are private to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., Foundation Phase Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Describe when to use this template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {visibleDraftItems.length} items will be saved to this template.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={loadingTemplates}>
              {loadingTemplates && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <FileUp className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={isApplyTemplateOpen} onOpenChange={setIsApplyTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Select a template to add its items to the current plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No templates saved yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Save a plan as template to reuse it with other clients.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.itemCount} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyTemplateOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Discard Dialog */}
      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive text-destructive-foreground">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Plan Dialog (for when active plan exists) */}
      <Dialog open={isCreatePlanOpen && !!activePlan} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              This will create a new plan. You can switch between plans at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-plan-title">Plan Title</Label>
              <Input
                id="new-plan-title"
                placeholder="e.g., Week 5-8 Progression Phase"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan-description">Description (optional)</Label>
              <Textarea
                id="new-plan-description"
                placeholder="Describe the goals for this plan..."
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={createPlan.isPending}>
              {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
