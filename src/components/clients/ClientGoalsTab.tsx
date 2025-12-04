import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Target,
  Plus,
  Moon,
  Heart,
  Activity,
  Utensils,
  Brain,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Pause,
  Play,
  Flame,
  Calendar,
  TrendingUp,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

interface ClientGoalsTabProps {
  relationshipId: string;
  userId: string;
  clientName?: string;
}

type GoalCategory = "sleep" | "recovery" | "activity" | "nutrition" | "mindfulness" | "other";
type GoalStatus = "active" | "completed" | "paused" | "cancelled";
type GoalPriority = "low" | "medium" | "high";
type GoalTargetType = "value" | "streak" | "habit" | "milestone";

interface Goal {
  id: string;
  relationship_id: string;
  user_id: string;
  expert_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_type: GoalTargetType;
  target_value: number | null;
  target_unit: string | null;
  current_value: number | null;
  streak_days: number;
  best_streak: number;
  status: GoalStatus;
  priority: GoalPriority;
  start_date: string;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_CONFIG: Record<GoalCategory, { icon: typeof Target; color: string; bgColor: string; label: string }> = {
  sleep: { icon: Moon, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Sleep" },
  recovery: { icon: Heart, color: "text-green-500", bgColor: "bg-green-500/10", label: "Recovery" },
  activity: { icon: Activity, color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Activity" },
  nutrition: { icon: Utensils, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Nutrition" },
  mindfulness: { icon: Brain, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Mindfulness" },
  other: { icon: Target, color: "text-gray-500", bgColor: "bg-gray-500/10", label: "Other" },
};

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-500 bg-red-500/10 border-red-500/30" },
  medium: { label: "Medium", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
  low: { label: "Low", color: "text-green-500 bg-green-500/10 border-green-500/30" },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-primary/10 text-primary" },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-500" },
  paused: { label: "Paused", color: "bg-yellow-500/10 text-yellow-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-500/10 text-gray-500" },
};

export const ClientGoalsTab = ({ relationshipId, userId, clientName }: ClientGoalsTabProps) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expertId, setExpertId] = useState<string | null>(null);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<GoalCategory>("activity");
  const [formTargetType, setFormTargetType] = useState<GoalTargetType>("habit");
  const [formTargetValue, setFormTargetValue] = useState<string>("");
  const [formTargetUnit, setFormTargetUnit] = useState("");
  const [formPriority, setFormPriority] = useState<GoalPriority>("medium");
  const [formTargetDate, setFormTargetDate] = useState("");

  // Filter state
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<GoalCategory | "all">("all");

  // Fetch expert ID
  useEffect(() => {
    const fetchExpertId = async () => {
      if (!user?.id) return;
      const id = await coachService.getExpertIdForUser(user.id);
      setExpertId(id);
    };
    fetchExpertId();
  }, [user?.id]);

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        const data = await coachService.fetchClientGoals(relationshipId);
        setGoals(data);
      } catch (error) {
        console.error("Error fetching goals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, [relationshipId]);

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("activity");
    setFormTargetType("habit");
    setFormTargetValue("");
    setFormTargetUnit("");
    setFormPriority("medium");
    setFormTargetDate("");
    setEditingGoal(null);
  };

  // Open edit dialog
  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormDescription(goal.description || "");
    setFormCategory(goal.category);
    setFormTargetType(goal.target_type);
    setFormTargetValue(goal.target_value?.toString() || "");
    setFormTargetUnit(goal.target_unit || "");
    setFormPriority(goal.priority);
    setFormTargetDate(goal.target_date || "");
    setShowCreateDialog(true);
  };

  // Create or update goal
  const handleSaveGoal = async () => {
    if (!formTitle.trim() || !expertId) return;

    setIsSaving(true);
    try {
      if (editingGoal) {
        // Update existing goal
        const updated = await coachService.updateGoal(editingGoal.id, {
          title: formTitle,
          description: formDescription || undefined,
          category: formCategory,
          targetValue: formTargetValue ? parseFloat(formTargetValue) : undefined,
          targetUnit: formTargetUnit || undefined,
          priority: formPriority,
          targetDate: formTargetDate || undefined,
        });
        setGoals(goals.map(g => g.id === editingGoal.id ? updated : g));
      } else {
        // Create new goal
        const newGoal = await coachService.createGoal({
          relationshipId,
          userId,
          expertId,
          title: formTitle,
          description: formDescription || undefined,
          category: formCategory,
          targetType: formTargetType,
          targetValue: formTargetValue ? parseFloat(formTargetValue) : undefined,
          targetUnit: formTargetUnit || undefined,
          priority: formPriority,
          targetDate: formTargetDate || undefined,
        });
        setGoals([newGoal, ...goals]);
      }

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving goal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update goal status
  const handleUpdateStatus = async (goalId: string, status: GoalStatus) => {
    try {
      const updated = await coachService.updateGoal(goalId, { status });
      setGoals(goals.map(g => g.id === goalId ? updated : g));
    } catch (error) {
      console.error("Error updating goal status:", error);
    }
  };

  // Delete goal
  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;

    try {
      await coachService.deleteGoal(deleteGoalId);
      setGoals(goals.filter(g => g.id !== deleteGoalId));
      setDeleteGoalId(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  // Filter goals
  const filteredGoals = goals.filter(g => {
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (filterCategory !== "all" && g.category !== filterCategory) return false;
    return true;
  });

  // Calculate progress percentage
  const getProgressPercent = (goal: Goal): number => {
    if (goal.target_type === "value" && goal.target_value) {
      return Math.min(100, Math.round(((goal.current_value || 0) / goal.target_value) * 100));
    }
    return 0;
  };

  // Summary stats
  const summary = {
    total: goals.length,
    active: goals.filter(g => g.status === "active").length,
    completed: goals.filter(g => g.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{summary.active} active</Badge>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              {summary.completed} completed
            </Badge>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as GoalStatus | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as GoalCategory | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <config.icon className={cn("h-4 w-4", config.color)} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {filterStatus !== "all" || filterCategory !== "all"
                ? "No goals match your filters."
                : `Set wellness goals for ${clientName || "this client"} to track their progress.`}
            </p>
            {filterStatus === "all" && filterCategory === "all" && (
              <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const categoryConfig = CATEGORY_CONFIG[goal.category];
            const statusConfig = STATUS_CONFIG[goal.status];
            const priorityConfig = PRIORITY_CONFIG[goal.priority];
            const Icon = categoryConfig.icon;
            const progress = getProgressPercent(goal);

            return (
              <Card key={goal.id} className={cn(
                "transition-all",
                goal.status === "completed" && "opacity-70"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className={cn("p-2 rounded-lg shrink-0", categoryConfig.bgColor)}>
                      <Icon className={cn("h-5 w-5", categoryConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={cn("text-xs", statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                              {priorityConfig.label}
                            </Badge>
                            {goal.streak_days > 0 && (
                              <Badge variant="outline" className="text-xs gap-1 text-orange-500 border-orange-500/30">
                                <Flame className="h-3 w-3" />
                                {goal.streak_days} day streak
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}

                          {/* Progress for value-based goals */}
                          {goal.target_type === "value" && goal.target_value && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-mono font-medium">
                                  {goal.current_value || 0} / {goal.target_value} {goal.target_unit || ""}
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          {/* Target date */}
                          {goal.target_date && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </div>
                          )}

                          {/* Best streak */}
                          {goal.best_streak > 0 && goal.target_type !== "value" && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              Best streak: {goal.best_streak} days
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(goal)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {goal.status === "active" && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(goal.id, "completed")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                  Mark Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(goal.id, "paused")}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              </>
                            )}
                            {goal.status === "paused" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(goal.id, "active")}>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </DropdownMenuItem>
                            )}
                            {goal.status === "completed" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(goal.id, "active")}>
                                <Play className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteGoalId(goal.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Update the goal details below."
                : `Set a wellness goal for ${clientName || "this client"}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Title *</label>
              <Input
                placeholder="e.g., Sleep 8 hours per night"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Additional details about this goal..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as GoalCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as GoalPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingGoal && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Type</label>
                <Select value={formTargetType} onValueChange={(v) => setFormTargetType(v as GoalTargetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habit">Daily Habit (track completion)</SelectItem>
                    <SelectItem value="value">Target Value (track progress)</SelectItem>
                    <SelectItem value="streak">Streak Goal (build consistency)</SelectItem>
                    <SelectItem value="milestone">One-time Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formTargetType === "value" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Value</label>
                  <Input
                    type="number"
                    placeholder="e.g., 8"
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    placeholder="e.g., hours, %, steps"
                    value={formTargetUnit}
                    onChange={(e) => setFormTargetUnit(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date (optional)</label>
              <Input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal} disabled={!formTitle.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingGoal ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? All progress data will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
