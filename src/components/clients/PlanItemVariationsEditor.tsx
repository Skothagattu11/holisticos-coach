import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  ChevronDown,
  Zap,
  Activity,
  Leaf,
  Moon,
  Bot,
  Settings2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachingRulesService } from "@/lib/services/coachingRulesService";
import type {
  CoachingPlanItemWithVariations,
  PlanItemVariations,
  PlanItemVariation,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

interface PlanItemVariationsEditorProps {
  planId: string;
  onUpdate?: () => void;
}

const VARIATION_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  intense: {
    label: "Intense",
    description: "High recovery - push harder",
    icon: Zap,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  moderate: {
    label: "Moderate",
    description: "Normal recovery - standard effort",
    icon: Activity,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  light: {
    label: "Light",
    description: "Low recovery - gentle movement",
    icon: Leaf,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  rest: {
    label: "Rest",
    description: "Very low recovery - skip or minimal",
    icon: Moon,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};

const DEFAULT_VARIATIONS = ["intense", "moderate", "light", "rest"];

export function PlanItemVariationsEditor({ planId, onUpdate }: PlanItemVariationsEditorProps) {
  const [items, setItems] = useState<CoachingPlanItemWithVariations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<CoachingPlanItemWithVariations | null>(null);
  const { toast } = useToast();

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, [planId]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await coachingRulesService.fetchPlanItemsWithVariations(planId);
      setItems(data);
    } catch (error) {
      console.error("Error fetching plan items:", error);
      toast({
        title: "Error",
        description: "Failed to load plan items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleToggleAiAdjustable = async (item: CoachingPlanItemWithVariations) => {
    try {
      const updated = await coachingRulesService.updatePlanItemVariations(item.id, {
        aiAdjustable: !item.aiAdjustable,
      });
      setItems(items.map(i => i.id === updated.id ? updated : i));
      toast({
        title: updated.aiAdjustable ? "AI Adjustment Enabled" : "AI Adjustment Disabled",
        description: `AI ${updated.aiAdjustable ? "can now" : "will not"} select variations for "${item.title}"`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleSaveVariations = async (item: CoachingPlanItemWithVariations, variations: PlanItemVariations, defaultVariation: string) => {
    try {
      setIsSaving(true);
      const updated = await coachingRulesService.updatePlanItemVariations(item.id, {
        variations,
        defaultVariation,
      });
      setItems(items.map(i => i.id === updated.id ? updated : i));
      setEditingItem(null);
      toast({
        title: "Variations Saved",
        description: `Variations for "${item.title}" have been updated`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Error saving variations:", error);
      toast({
        title: "Error",
        description: "Failed to save variations",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getVariationCount = (item: CoachingPlanItemWithVariations) => {
    if (!item.variations) return 0;
    return Object.keys(item.variations).filter(k => item.variations?.[k]).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Plan Items</h3>
          <p className="text-muted-foreground">
            Add items to the plan first, then you can configure variations for each.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Plan Item Variations</h3>
        <p className="text-sm text-muted-foreground">
          Define intensity variations for each activity. AI will select the appropriate variation based on health data.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const variationCount = getVariationCount(item);
          const isExpanded = expandedItems.has(item.id);

          return (
            <Card key={item.id}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                        <div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {item.category} &bull; {item.frequency} &bull; {item.durationMinutes || 30}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {variationCount > 0 ? (
                          <Badge variant="secondary">
                            {variationCount} variation{variationCount !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No variations
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          <Bot className={cn(
                            "h-4 w-4",
                            item.aiAdjustable ? "text-primary" : "text-muted-foreground"
                          )} />
                          <Switch
                            checked={item.aiAdjustable}
                            onCheckedChange={(e) => {
                              e.stopPropagation();
                              handleToggleAiAdjustable(item);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="border-t pt-4">
                      {!item.aiAdjustable ? (
                        <div className="text-center py-4 bg-muted/30 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            AI adjustment is disabled. This item will always use the standard version.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleToggleAiAdjustable(item)}
                          >
                            Enable AI adjustment
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {DEFAULT_VARIATIONS.map((varKey) => {
                              const config = VARIATION_CONFIG[varKey];
                              const variation = item.variations?.[varKey];
                              const hasVariation = !!variation;
                              const Icon = config.icon;

                              return (
                                <Card
                                  key={varKey}
                                  className={cn(
                                    "cursor-pointer transition-all",
                                    hasVariation
                                      ? "border-primary/50"
                                      : "border-dashed opacity-60 hover:opacity-100"
                                  )}
                                  onClick={() => setEditingItem(item)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={cn("p-1.5 rounded", config.color)}>
                                        <Icon className="h-3 w-3" />
                                      </div>
                                      <span className="font-medium text-sm">{config.label}</span>
                                    </div>
                                    {hasVariation ? (
                                      <div className="text-xs text-muted-foreground">
                                        <p className="truncate">{variation.title}</p>
                                        <p>{variation.duration || item.durationMinutes}min</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Click to add
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Default: <Badge variant="outline">{item.defaultVariation || "standard"}</Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Settings2 className="h-4 w-4 mr-2" />
                              Edit Variations
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Edit Variations Dialog */}
      {editingItem && (
        <VariationsEditDialog
          item={editingItem}
          onSave={(variations, defaultVariation) =>
            handleSaveVariations(editingItem, variations, defaultVariation)
          }
          onClose={() => setEditingItem(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// Separate dialog component for editing variations
function VariationsEditDialog({
  item,
  onSave,
  onClose,
  isSaving,
}: {
  item: CoachingPlanItemWithVariations;
  onSave: (variations: PlanItemVariations, defaultVariation: string) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [variations, setVariations] = useState<PlanItemVariations>(
    item.variations || {}
  );
  const [defaultVariation, setDefaultVariation] = useState(
    item.defaultVariation || "standard"
  );

  const updateVariation = (key: string, updates: Partial<PlanItemVariation> | null) => {
    if (updates === null) {
      // Remove variation
      const { [key]: _, ...rest } = variations;
      setVariations(rest);
    } else {
      setVariations({
        ...variations,
        [key]: {
          ...variations[key],
          ...updates,
        } as PlanItemVariation,
      });
    }
  };

  const addVariation = (key: string) => {
    setVariations({
      ...variations,
      [key]: {
        title: `${item.title} (${VARIATION_CONFIG[key].label})`,
        duration: item.durationMinutes,
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variations: {item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {DEFAULT_VARIATIONS.map((varKey) => {
            const config = VARIATION_CONFIG[varKey];
            const variation = variations[varKey];
            const hasVariation = !!variation;
            const Icon = config.icon;

            return (
              <Card key={varKey} className={cn(!hasVariation && "border-dashed")}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.label}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    {hasVariation ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateVariation(varKey, null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addVariation(varKey)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {hasVariation && (
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={variation.title || ""}
                          onChange={(e) =>
                            updateVariation(varKey, { title: e.target.value })
                          }
                          placeholder={`${item.title} (${config.label})`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={variation.duration || item.durationMinutes || 30}
                          onChange={(e) =>
                            updateVariation(varKey, {
                              duration: parseInt(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={variation.description || ""}
                        onChange={(e) =>
                          updateVariation(varKey, { description: e.target.value })
                        }
                        placeholder="Describe what this variation looks like..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          <div className="space-y-2">
            <Label>Default Variation</Label>
            <Select value={defaultVariation} onValueChange={setDefaultVariation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (no variation)</SelectItem>
                {Object.keys(variations).map((key) => (
                  <SelectItem key={key} value={key}>
                    {VARIATION_CONFIG[key]?.label || key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used when AI cannot determine the appropriate variation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(variations, defaultVariation)} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Variations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
