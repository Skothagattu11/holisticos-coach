import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Slider } from "@/components/ui/slider";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachingRulesService } from "@/lib/services/coachingRulesService";
import type { CoachingRule, CoachingRuleType, CoachingRuleCreate } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CoachingRulesManagerProps {
  relationshipId: string;
}

const RULE_TYPE_CONFIG: Record<CoachingRuleType, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  condition: {
    label: "IF/THEN Condition",
    description: "When health data matches criteria, apply specific actions",
    icon: AlertTriangle,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  preference: {
    label: "Preference",
    description: "General guidelines for how to approach situations",
    icon: Lightbulb,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  constraint: {
    label: "Hard Constraint",
    description: "Rules that must always be followed",
    icon: ShieldCheck,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function CoachingRulesManager({ relationshipId }: CoachingRulesManagerProps) {
  const [rules, setRules] = useState<CoachingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingRule, setEditingRule] = useState<CoachingRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    ruleType: CoachingRuleType;
    priority: number;
  }>({
    title: "",
    description: "",
    ruleType: "condition",
    priority: 5,
  });

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, [relationshipId]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await coachingRulesService.fetchRulesByRelationship(relationshipId);
      setRules(data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast({
        title: "Error",
        description: "Failed to load coaching rules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ruleType: "condition",
      priority: 5,
    });
    setEditingRule(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleOpenEdit = (rule: CoachingRule) => {
    setFormData({
      title: rule.title,
      description: rule.description,
      ruleType: rule.ruleType,
      priority: rule.priority,
    });
    setEditingRule(rule);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingRule) {
        // Update existing rule
        const updated = await coachingRulesService.updateRule(editingRule.id, {
          title: formData.title,
          description: formData.description,
          ruleType: formData.ruleType,
          priority: formData.priority,
        });
        setRules(rules.map(r => r.id === updated.id ? updated : r));
        toast({
          title: "Rule Updated",
          description: "The coaching rule has been updated",
        });
      } else {
        // Create new rule
        const newRule = await coachingRulesService.createRule({
          relationshipId,
          title: formData.title,
          description: formData.description,
          ruleType: formData.ruleType,
          priority: formData.priority,
        });
        setRules([newRule, ...rules].sort((a, b) => b.priority - a.priority));
        toast({
          title: "Rule Created",
          description: "The coaching rule has been added",
        });
      }

      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: "Error",
        description: "Failed to save the rule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: CoachingRule) => {
    try {
      const updated = await coachingRulesService.toggleRuleActive(rule.id, !rule.isActive);
      setRules(rules.map(r => r.id === updated.id ? updated : r));
      toast({
        title: updated.isActive ? "Rule Activated" : "Rule Deactivated",
        description: `"${rule.title}" is now ${updated.isActive ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast({
        title: "Error",
        description: "Failed to toggle rule status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteRuleId) return;

    try {
      await coachingRulesService.deleteRule(deleteRuleId);
      setRules(rules.filter(r => r.id !== deleteRuleId));
      toast({
        title: "Rule Deleted",
        description: "The coaching rule has been removed",
      });
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete the rule",
        variant: "destructive",
      });
    } finally {
      setDeleteRuleId(null);
    }
  };

  const handleUseTemplate = (template: ReturnType<typeof coachingRulesService.getRuleTemplates>[0]) => {
    setFormData({
      title: template.title,
      description: template.description,
      ruleType: template.ruleType,
      priority: template.priority,
    });
    setShowTemplates(false);
    setShowAddDialog(true);
  };

  const templates = coachingRulesService.getRuleTemplates();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Coaching Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define rules for how AI should adapt the daily protocol based on health data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Rules Defined</h3>
            <p className="text-muted-foreground mb-4">
              Add coaching rules to guide how AI adapts the daily protocol based on the client's health data.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setShowTemplates(true)}>
                Browse Templates
              </Button>
              <Button onClick={handleOpenAdd}>
                Create Custom Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const typeConfig = RULE_TYPE_CONFIG[rule.ruleType];
            const TypeIcon = typeConfig.icon;

            return (
              <Card
                key={rule.id}
                className={cn(
                  "transition-opacity",
                  !rule.isActive && "opacity-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className={cn("p-2 rounded-md border", typeConfig.color)}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{rule.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Priority: {rule.priority}/10
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rule.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(rule)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteRuleId(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Rule" : "Add Coaching Rule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Low HRV Recovery"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select
                value={formData.ruleType}
                onValueChange={(v) => setFormData({ ...formData, ruleType: v as CoachingRuleType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RULE_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {RULE_TYPE_CONFIG[formData.ruleType].description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Natural Language)</Label>
              <Textarea
                id="description"
                placeholder="Describe the rule in natural language. The AI will interpret this when adapting the daily protocol.

Example: When HRV is more than 15% below baseline, use Light or Rest variation for workouts. Recovery is the priority."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Priority</Label>
                <span className="text-sm font-medium">{formData.priority}/10</span>
              </div>
              <Slider
                value={[formData.priority]}
                onValueChange={([v]) => setFormData({ ...formData, priority: v })}
                min={0}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority rules are applied first when multiple rules match.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? "Update Rule" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Rule Templates
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {templates.map((template, index) => {
              const typeConfig = RULE_TYPE_CONFIG[template.ruleType];
              const TypeIcon = typeConfig.icon;

              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-md border", typeConfig.color)}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            Priority: {template.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
