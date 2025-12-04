import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Edit,
  Trash2,
  Zap,
  Heart,
  Activity,
  ListChecks,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

interface WeeklyCheckin {
  id: string;
  relationship_id: string;
  user_id: string;
  expert_id: string;
  week_number: string;
  week_start_date: string;
  week_end_date: string;
  summary?: string;
  highlights?: string;
  areas_for_improvement?: string;
  focus_for_next_week?: string;
  coach_notes?: string;
  avg_energy?: number;
  avg_mood?: number;
  avg_stress?: number;
  task_completion_rate?: number;
  checkin_count?: number;
  is_shared_with_user: boolean;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyCheckinTabProps {
  relationshipId: string;
  userId: string;
  clientName: string;
}

export const WeeklyCheckinTab = ({ relationshipId, userId, clientName }: WeeklyCheckinTabProps) => {
  const { user } = useAuth();
  const [weeklyCheckins, setWeeklyCheckins] = useState<WeeklyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [currentCheckin, setCurrentCheckin] = useState<WeeklyCheckin | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<{
    avgEnergy: number | null;
    avgMood: number | null;
    avgStress: number | null;
    taskCompletionRate: number | null;
    checkinCount: number;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    highlights: "",
    areasForImprovement: "",
    focusForNextWeek: "",
    coachNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Get week info
  const weekStart = coachService.getWeekStart(selectedWeek);
  const weekEnd = coachService.getWeekEnd(selectedWeek);
  const weekNumber = coachService.getWeekString(selectedWeek);

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [checkins, existingCheckin, stats] = await Promise.all([
        coachService.fetchWeeklyCheckins(relationshipId),
        coachService.fetchWeeklyCheckin(relationshipId, weekNumber),
        coachService.calculateWeeklyStats(
          relationshipId,
          userId,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        ),
      ]);

      setWeeklyCheckins(checkins);
      setCurrentCheckin(existingCheckin);
      setWeeklyStats(stats);

      // Populate form with existing data
      if (existingCheckin) {
        setFormData({
          summary: existingCheckin.summary || "",
          highlights: existingCheckin.highlights || "",
          areasForImprovement: existingCheckin.areas_for_improvement || "",
          focusForNextWeek: existingCheckin.focus_for_next_week || "",
          coachNotes: existingCheckin.coach_notes || "",
        });
      } else {
        setFormData({
          summary: "",
          highlights: "",
          areasForImprovement: "",
          focusForNextWeek: "",
          coachNotes: "",
        });
      }
    } catch (error) {
      console.error("Error loading weekly check-in data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [relationshipId, userId, weekNumber]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedWeek(newDate);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const expertId = await coachService.getExpertIdForUser(user.id);
      if (!expertId) {
        console.error("Could not find expert ID for user");
        return;
      }

      await coachService.upsertWeeklyCheckin({
        relationshipId,
        userId,
        expertId,
        weekNumber,
        weekStartDate: weekStart.toISOString().split('T')[0],
        weekEndDate: weekEnd.toISOString().split('T')[0],
        summary: formData.summary || undefined,
        highlights: formData.highlights || undefined,
        areasForImprovement: formData.areasForImprovement || undefined,
        focusForNextWeek: formData.focusForNextWeek || undefined,
        coachNotes: formData.coachNotes || undefined,
        avgEnergy: weeklyStats?.avgEnergy ?? undefined,
        avgMood: weeklyStats?.avgMood ?? undefined,
        avgStress: weeklyStats?.avgStress ?? undefined,
        taskCompletionRate: weeklyStats?.taskCompletionRate ?? undefined,
        checkinCount: weeklyStats?.checkinCount,
        status: publish ? 'published' : 'draft',
        isSharedWithUser: publish,
      });

      setShowPublishDialog(false);
      loadData();
    } catch (error) {
      console.error("Error saving weekly check-in:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentCheckin?.id) {
      // Save and publish in one go
      await handleSave(true);
    } else {
      // Just publish existing
      try {
        setSaving(true);
        await coachService.publishWeeklyCheckin(currentCheckin.id);
        setShowPublishDialog(false);
        loadData();
      } catch (error) {
        console.error("Error publishing weekly check-in:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!currentCheckin?.id) return;

    try {
      await coachService.deleteWeeklyCheckin(currentCheckin.id);
      loadData();
    } catch (error) {
      console.error("Error deleting weekly check-in:", error);
    }
  };

  const isCurrentWeek = weekNumber === coachService.getWeekString(new Date());
  const isFutureWeek = weekStart > new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWeek(new Date())}
                className="text-xs"
              >
                This Week
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  Week {weekNumber.split('-')[1]}, {weekNumber.split('-')[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(weekStart, weekEnd)}
                </p>
              </div>
              {currentCheckin && (
                <Badge
                  variant={currentCheckin.status === 'published' ? 'default' : 'secondary'}
                  className="gap-1"
                >
                  {currentCheckin.status === 'published' ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Draft
                    </>
                  )}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(1)}
              disabled={isFutureWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Check-ins</span>
            </div>
            <div className="text-2xl font-bold">
              {weeklyStats?.checkinCount || 0} / 7
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Avg Energy</span>
            </div>
            <div className="text-2xl font-bold">
              {weeklyStats?.avgEnergy?.toFixed(1) || "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm text-muted-foreground">Avg Mood</span>
            </div>
            <div className="text-2xl font-bold">
              {weeklyStats?.avgMood?.toFixed(1) || "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Avg Stress</span>
            </div>
            <div className="text-2xl font-bold">
              {weeklyStats?.avgStress?.toFixed(1) || "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Task Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {weeklyStats?.taskCompletionRate?.toFixed(0) || "—"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Check-in Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Weekly Report for {clientName}
          </CardTitle>
          <CardDescription>
            This feedback will be visible to the client in their weekly report when published.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Weekly Summary
            </Label>
            <Textarea
              placeholder="Brief summary of this week's progress and overall performance..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
            />
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              Highlights & Wins
            </Label>
            <Textarea
              placeholder="What went well this week? What did the client do great?"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              rows={3}
            />
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Areas for Improvement
            </Label>
            <Textarea
              placeholder="What could be improved? What challenges were encountered?"
              value={formData.areasForImprovement}
              onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
              rows={3}
            />
          </div>

          {/* Focus for Next Week */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              Focus for Next Week
            </Label>
            <Textarea
              placeholder="Recommended focus areas and priorities for the coming week..."
              value={formData.focusForNextWeek}
              onChange={(e) => setFormData({ ...formData, focusForNextWeek: e.target.value })}
              rows={3}
            />
          </div>

          {/* Private Coach Notes */}
          <div className="space-y-2 pt-4 border-t">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <EyeOff className="h-4 w-4" />
              Private Coach Notes (not shared with client)
            </Label>
            <Textarea
              placeholder="Internal notes, observations, or reminders for yourself..."
              value={formData.coachNotes}
              onChange={(e) => setFormData({ ...formData, coachNotes: e.target.value })}
              rows={2}
              className="bg-muted/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {currentCheckin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Weekly Check-in?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this week's check-in. This action cannot be undone.
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
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save as Draft
              </Button>

              {currentCheckin?.status === 'published' ? (
                <Button variant="secondary" disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Already Published
                </Button>
              ) : (
                <Button onClick={() => setShowPublishDialog(true)} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish to Client
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Weekly Check-ins History */}
      {weeklyCheckins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Weekly Reports</CardTitle>
            <CardDescription>
              Click on a week to view or edit its report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weeklyCheckins.slice(0, 8).map((checkin) => (
                <div
                  key={checkin.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    checkin.week_number === weekNumber && "border-primary bg-primary/5"
                  )}
                  onClick={() => {
                    const start = new Date(checkin.week_start_date);
                    setSelectedWeek(start);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        Week {checkin.week_number.split('-')[1]}, {checkin.week_number.split('-')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkin.week_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                        {new Date(checkin.week_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkin.checkin_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {checkin.checkin_count}/7 days
                      </span>
                    )}
                    <Badge
                      variant={checkin.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {checkin.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Weekly Report?</DialogTitle>
            <DialogDescription>
              This will make the weekly report visible to {clientName} in their weekly summary.
              They will be able to see:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Weekly Summary</li>
                <li>Highlights & Wins</li>
                <li>Areas for Improvement</li>
                <li>Focus for Next Week</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Private coach notes will NOT be visible to the client.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyCheckinTab;
