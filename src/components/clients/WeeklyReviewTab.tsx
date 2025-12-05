import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Zap,
  Heart,
  Activity,
  ListChecks,
  CalendarDays,
  Clock,
  XCircle,
  SkipForward,
  MessageSquare,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

interface WeeklyReviewTabProps {
  relationshipId: string;
  userId: string;
  clientName: string;
}

export const WeeklyReviewTab = ({ relationshipId, userId, clientName }: WeeklyReviewTabProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [currentReview, setCurrentReview] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Week's check-in data
  const [weekData, setWeekData] = useState<{
    checkins: any[];
    summary: {
      totalDays: number;
      checkinDays: number;
      avgEnergy: number | null;
      avgMood: number | null;
      avgStress: number | null;
      totalTasks: number;
      completedTasks: number;
      avgCompletionRate: number | null;
    };
  } | null>(null);

  // Form state for coach feedback
  const [formData, setFormData] = useState({
    summary: "",
    highlights: "",
    areasToImprove: "",
    focusNextWeek: "",
    privateNotes: "",
  });

  // Week calculations
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
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const [allReviews, existingReview, checkinsData] = await Promise.all([
        coachService.fetchWeeklyReviews(relationshipId),
        coachService.fetchWeeklyReview(relationshipId, weekNumber),
        coachService.fetchWeeklyCheckinsData(relationshipId, userId, weekStartStr, weekEndStr),
      ]);

      setReviews(allReviews);
      setCurrentReview(existingReview);
      setWeekData(checkinsData);

      // Populate form with existing review data
      if (existingReview) {
        setFormData({
          summary: existingReview.summary || "",
          highlights: existingReview.highlights || "",
          areasToImprove: existingReview.areas_to_improve || "",
          focusNextWeek: existingReview.focus_next_week || "",
          privateNotes: existingReview.private_notes || "",
        });
      } else {
        setFormData({
          summary: "",
          highlights: "",
          areasToImprove: "",
          focusNextWeek: "",
          privateNotes: "",
        });
      }
    } catch (error) {
      console.error("Error loading weekly review:", error);
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
        console.error("Could not find expert ID");
        return;
      }

      await coachService.upsertWeeklyReview({
        relationshipId,
        expertId,
        weekNumber,
        weekStartDate: weekStart.toISOString().split('T')[0],
        weekEndDate: weekEnd.toISOString().split('T')[0],
        summary: formData.summary || undefined,
        highlights: formData.highlights || undefined,
        areasToImprove: formData.areasToImprove || undefined,
        focusNextWeek: formData.focusNextWeek || undefined,
        privateNotes: formData.privateNotes || undefined,
        status: publish ? 'published' : 'draft',
      });

      setShowPublishDialog(false);
      loadData();
    } catch (error) {
      console.error("Error saving weekly review:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentReview?.id) return;

    try {
      await coachService.deleteWeeklyReview(currentReview.id);
      loadData();
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const isFutureWeek = weekStart > new Date();

  // Generate all 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = weekData?.summary;

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
              <Button variant="ghost" size="sm" onClick={() => setSelectedWeek(new Date())} className="text-xs">
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
              {currentReview && (
                <Badge variant={currentReview.is_published ? 'default' : 'secondary'} className="gap-1">
                  {currentReview.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {currentReview.is_published ? 'Published' : 'Draft'}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)} disabled={isFutureWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: Week's Data Overview (from daily check-ins) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Week Overview - {clientName}'s Daily Check-ins
          </CardTitle>
          <CardDescription>
            Data from user's daily check-ins this week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Check-ins</span>
              </div>
              <div className="text-2xl font-bold">{summary?.checkinDays || 0}/7</div>
              <div className="text-xs text-muted-foreground">days checked in</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Tasks</span>
              </div>
              <div className="text-2xl font-bold">
                {summary?.completedTasks || 0}/{summary?.totalTasks || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary?.avgCompletionRate != null ? `${summary.avgCompletionRate}% avg` : 'no data'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Avg Energy</span>
              </div>
              <div className="text-2xl font-bold">{summary?.avgEnergy ?? '—'}</div>
              <div className="text-xs text-muted-foreground">out of 10</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm text-muted-foreground">Avg Mood</span>
              </div>
              <div className="text-2xl font-bold">{summary?.avgMood ?? '—'}</div>
              <div className="text-xs text-muted-foreground">out of 10</div>
            </div>
          </div>

          {/* Task Completion Progress */}
          {summary?.totalTasks && summary.totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Task Completion Rate</span>
                <span className="font-medium">{summary.avgCompletionRate ?? 0}%</span>
              </div>
              <Progress value={summary.avgCompletionRate ?? 0} className="h-2" />
            </div>
          )}

          {/* Daily Breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-3">Daily Breakdown <span className="text-muted-foreground font-normal">(click a day for details)</span></h4>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0];
                const checkin = weekData?.checkins.find(c => c.checkin_date === dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const isFuture = day > new Date();
                const isSelected = selectedDayIndex === i;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDayIndex(isSelected ? null : i)}
                    disabled={isFuture}
                    className={cn(
                      "p-2 rounded-lg border text-center text-xs transition-all",
                      checkin ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" : isFuture ? "bg-muted/30 opacity-50 cursor-not-allowed" : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
                      isToday && "ring-2 ring-primary",
                      isSelected && "ring-2 ring-offset-2 ring-primary"
                    )}
                  >
                    <div className="font-medium">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-muted-foreground">
                      {day.getDate()}
                    </div>
                    {checkin ? (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                        <div className="text-[10px]">
                          {checkin.tasks_completed}/{checkin.tasks_total}
                        </div>
                        {checkin.energy_rating && (
                          <div className="text-[10px] text-yellow-600">
                            E:{checkin.energy_rating}
                          </div>
                        )}
                      </div>
                    ) : !isFuture ? (
                      <div className="mt-1 text-red-500">
                        <span className="text-[10px]">missed</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Expanded Day Details */}
            {selectedDayIndex !== null && (() => {
              const selectedDay = weekDays[selectedDayIndex];
              const dateStr = selectedDay.toISOString().split('T')[0];
              const checkin = weekData?.checkins.find(c => c.checkin_date === dateStr);
              const isFuture = selectedDay > new Date();

              return (
                <div className="mt-4 p-4 rounded-lg border bg-muted/30 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h5>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDayIndex(null)}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>

                  {isFuture ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Future date - no data yet</p>
                  ) : checkin ? (
                    <div className="space-y-4">
                      {/* Wellness Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-lg bg-background">
                          <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                          <div className="text-xl font-bold">{checkin.energy_rating ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">Energy</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background">
                          <Heart className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                          <div className="text-xl font-bold">{checkin.mood_level ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">Mood</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background">
                          <Activity className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-xl font-bold">{checkin.stress_level ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">Stress</div>
                        </div>
                      </div>

                      {/* Task Summary */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Tasks Completed</span>
                        </div>
                        <Badge variant={checkin.completion_rate >= 80 ? "default" : "secondary"}>
                          {checkin.tasks_completed}/{checkin.tasks_total} ({Math.round(checkin.completion_rate || 0)}%)
                        </Badge>
                      </div>

                      {/* Task Details */}
                      {checkin.tasks_completed_details && checkin.tasks_completed_details.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Task Details</p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {checkin.tasks_completed_details.map((task: any, idx: number) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded text-sm",
                                  task.completed ? "bg-green-500/10" : task.skipped ? "bg-yellow-500/10" : "bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {task.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : task.skipped ? (
                                    <SkipForward className="h-4 w-4 text-yellow-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={cn(!task.completed && !task.skipped && "text-muted-foreground")}>
                                    {task.task_name}
                                  </span>
                                </div>
                                {task.scheduled_time && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.scheduled_time}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {checkin.notes && (
                        <div className="p-3 rounded-lg bg-background">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Client Notes</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{checkin.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <XCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
                      <p className="font-medium">No Check-in</p>
                      <p className="text-sm text-muted-foreground">Client did not submit a check-in for this day</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Stress indicator if high */}
          {summary?.avgStress != null && summary.avgStress >= 7 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                <strong>High stress week:</strong> Average stress level {summary.avgStress}/10
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: Coach's Feedback (to write based on above data) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Coach's Weekly Feedback
          </CardTitle>
          <CardDescription>
            Write feedback for {clientName} based on the week's data above. This will be visible to them when published.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Weekly Summary
            </Label>
            <Textarea
              placeholder="How did this week go overall? Brief summary of their progress..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              Highlights & Wins
            </Label>
            <Textarea
              placeholder="What went well? What did they do great this week?"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Areas to Improve
            </Label>
            <Textarea
              placeholder="What could be better? Any patterns or challenges you noticed?"
              value={formData.areasToImprove}
              onChange={(e) => setFormData({ ...formData, areasToImprove: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              Focus for Next Week
            </Label>
            <Textarea
              placeholder="What should they focus on next week? Any specific recommendations?"
              value={formData.focusNextWeek}
              onChange={(e) => setFormData({ ...formData, focusNextWeek: e.target.value })}
              rows={2}
            />
          </div>

          {/* Private Notes */}
          <div className="space-y-2 pt-4 border-t">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <EyeOff className="h-4 w-4" />
              Private Notes (NOT visible to client)
            </Label>
            <Textarea
              placeholder="Internal notes for yourself..."
              value={formData.privateNotes}
              onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
              rows={2}
              className="bg-muted/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {currentReview && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Draft
              </Button>
              {currentReview?.is_published ? (
                <Button variant="secondary" disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Published
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

      {/* Previous Weeks History */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Weekly Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviews.slice(0, 8).map((review) => (
                <div
                  key={review.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    review.week_number === weekNumber && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedWeek(new Date(review.week_start_date))}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Week {review.week_number.split('-')[1]}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.week_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={review.is_published ? 'default' : 'secondary'} className="text-xs">
                    {review.is_published ? 'Published' : 'Draft'}
                  </Badge>
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
            <DialogTitle>Publish Weekly Review?</DialogTitle>
            <DialogDescription>
              {clientName} will see your summary, highlights, areas to improve, and focus for next week.
              Private notes will NOT be shared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyReviewTab;
