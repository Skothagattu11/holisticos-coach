import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Clock,
  Plus,
  Video,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  CalendarCheck,
  CalendarX,
  CalendarClock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

interface Session {
  id: string;
  relationship_id: string;
  session_type: 'initial_review' | 'review' | 'follow_up' | 'check_in';
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  meeting_url?: string;
  meeting_provider?: string;
  expert_notes?: string;
  user_notes?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
}

interface SessionSchedulingTabProps {
  relationshipId: string;
  clientName: string;
}

const SESSION_TYPES = {
  initial_review: { label: "Initial Review", color: "bg-primary/10 text-primary" },
  review: { label: "Review", color: "bg-blue-500/10 text-blue-500" },
  follow_up: { label: "Follow-up", color: "bg-green-500/10 text-green-500" },
  check_in: { label: "Check-in", color: "bg-purple-500/10 text-purple-500" },
};

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "bg-blue-500/10 text-blue-500", icon: CalendarClock },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-500", icon: CalendarCheck },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-500", icon: CalendarX },
  no_show: { label: "No Show", color: "bg-orange-500/10 text-orange-500", icon: UserX },
  rescheduled: { label: "Rescheduled", color: "bg-yellow-500/10 text-yellow-500", icon: RefreshCw },
};

const MEETING_PROVIDERS = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "other", label: "Other" },
];

export const SessionSchedulingTab = ({ relationshipId, clientName }: SessionSchedulingTabProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0, cancelled: 0, noShow: 0 });

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for new/edit session
  const [formData, setFormData] = useState({
    sessionType: "review" as 'initial_review' | 'review' | 'follow_up' | 'check_in',
    scheduledDate: "",
    scheduledTime: "",
    durationMinutes: 30,
    meetingUrl: "",
    meetingProvider: "",
    expertNotes: "",
  });

  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: "",
    scheduledTime: "",
  });

  // Complete session form state
  const [completeNotes, setCompleteNotes] = useState("");

  // Cancel reason state
  const [cancelReason, setCancelReason] = useState("");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        coachService.fetchClientSessions(relationshipId),
        coachService.getSessionStats(relationshipId),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [relationshipId]);

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      sessionType: "review",
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: "10:00",
      durationMinutes: 30,
      meetingUrl: "",
      meetingProvider: "",
      expertNotes: "",
    });
  };

  const handleCreateSession = async () => {
    if (!formData.scheduledDate || !formData.scheduledTime) return;

    setSaving(true);
    try {
      const scheduledAt = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
      await coachService.createSession({
        relationshipId,
        sessionType: formData.sessionType,
        scheduledAt,
        durationMinutes: formData.durationMinutes,
        meetingUrl: formData.meetingUrl || undefined,
        meetingProvider: formData.meetingProvider || undefined,
        expertNotes: formData.expertNotes || undefined,
      });
      setShowNewDialog(false);
      resetForm();
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession || !formData.scheduledDate || !formData.scheduledTime) return;

    setSaving(true);
    try {
      const scheduledAt = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
      await coachService.updateSession(selectedSession.id, {
        scheduledAt,
        durationMinutes: formData.durationMinutes,
        meetingUrl: formData.meetingUrl || undefined,
        meetingProvider: formData.meetingProvider || undefined,
        expertNotes: formData.expertNotes || undefined,
      });
      setShowEditDialog(false);
      setSelectedSession(null);
      loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRescheduleSession = async () => {
    if (!selectedSession || !rescheduleData.scheduledDate || !rescheduleData.scheduledTime) return;

    setSaving(true);
    try {
      const newScheduledAt = `${rescheduleData.scheduledDate}T${rescheduleData.scheduledTime}:00`;
      await coachService.rescheduleSession(selectedSession.id, newScheduledAt);
      setShowRescheduleDialog(false);
      setSelectedSession(null);
      setRescheduleData({ scheduledDate: "", scheduledTime: "" });
      loadSessions();
    } catch (error) {
      console.error("Error rescheduling session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;

    setSaving(true);
    try {
      await coachService.completeSession(selectedSession.id, completeNotes || undefined);
      setShowCompleteDialog(false);
      setSelectedSession(null);
      setCompleteNotes("");
      loadSessions();
    } catch (error) {
      console.error("Error completing session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSession = async (session: Session) => {
    try {
      await coachService.cancelSession(session.id, cancelReason || undefined);
      setCancelReason("");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
    }
  };

  const handleMarkNoShow = async (session: Session) => {
    try {
      await coachService.updateSession(session.id, { status: 'no_show' });
      loadSessions();
    } catch (error) {
      console.error("Error marking no show:", error);
    }
  };

  const handleDeleteSession = async (session: Session) => {
    try {
      await coachService.deleteSession(session.id);
      loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const openEditDialog = (session: Session) => {
    const dateTime = new Date(session.scheduled_at);
    setFormData({
      sessionType: session.session_type,
      scheduledDate: dateTime.toISOString().split('T')[0],
      scheduledTime: dateTime.toTimeString().slice(0, 5),
      durationMinutes: session.duration_minutes,
      meetingUrl: session.meeting_url || "",
      meetingProvider: session.meeting_provider || "",
      expertNotes: session.expert_notes || "",
    });
    setSelectedSession(session);
    setShowEditDialog(true);
  };

  const openRescheduleDialog = (session: Session) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleData({
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: "10:00",
    });
    setSelectedSession(session);
    setShowRescheduleDialog(true);
  };

  const openCompleteDialog = (session: Session) => {
    setSelectedSession(session);
    setCompleteNotes(session.expert_notes || "");
    setShowCompleteDialog(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUpcoming = (session: Session) => {
    return session.status === 'scheduled' && new Date(session.scheduled_at) > new Date();
  };

  const isPast = (session: Session) => {
    return new Date(session.scheduled_at) < new Date();
  };

  const filteredSessions = sessions.filter(s => {
    if (statusFilter === "all") return true;
    if (statusFilter === "upcoming") return isUpcoming(s);
    return s.status === statusFilter;
  });

  // Separate upcoming and past sessions
  const upcomingSessions = filteredSessions.filter(isUpcoming).sort((a, b) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
  const pastSessions = filteredSessions.filter(s => !isUpcoming(s)).sort((a, b) =>
    new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{stats.noShow}</div>
            <p className="text-xs text-muted-foreground">No Shows</p>
          </CardContent>
        </Card>
      </div>

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Filter:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showNewDialog} onOpenChange={(open) => {
          setShowNewDialog(open);
          if (open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Session</DialogTitle>
              <DialogDescription>
                Schedule a coaching session with {clientName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(v) => setFormData({ ...formData, sessionType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_TYPES).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select
                  value={formData.durationMinutes.toString()}
                  onValueChange={(v) => setFormData({ ...formData, durationMinutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meeting Provider</Label>
                <Select
                  value={formData.meetingProvider}
                  onValueChange={(v) => setFormData({ ...formData, meetingProvider: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_PROVIDERS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meeting URL (optional)</Label>
                <Input
                  placeholder="https://zoom.us/j/..."
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes for this session..."
                  value={formData.expertNotes}
                  onChange={(e) => setFormData({ ...formData, expertNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession} disabled={saving || !formData.scheduledDate || !formData.scheduledTime}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Schedule Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-500" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => openEditDialog(session)}
                onReschedule={() => openRescheduleDialog(session)}
                onComplete={() => openCompleteDialog(session)}
                onCancel={() => handleCancelSession(session)}
                onNoShow={() => handleMarkNoShow(session)}
                onDelete={() => handleDeleteSession(session)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {statusFilter === "all" || statusFilter === "upcoming" ? "Past Sessions" : "Sessions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => openEditDialog(session)}
                onReschedule={() => openRescheduleDialog(session)}
                onComplete={() => openCompleteDialog(session)}
                onCancel={() => handleCancelSession(session)}
                onNoShow={() => handleMarkNoShow(session)}
                onDelete={() => handleDeleteSession(session)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sessions Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first coaching session with {clientName}
            </p>
            <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update session details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select
                value={formData.durationMinutes.toString()}
                onValueChange={(v) => setFormData({ ...formData, durationMinutes: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <Input
                placeholder="https://zoom.us/j/..."
                value={formData.meetingUrl}
                onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes for this session..."
                value={formData.expertNotes}
                onChange={(e) => setFormData({ ...formData, expertNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input
                type="date"
                value={rescheduleData.scheduledDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>New Time</Label>
              <Input
                type="time"
                value={rescheduleData.scheduledTime}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledTime: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleSession} disabled={saving || !rescheduleData.scheduledDate || !rescheduleData.scheduledTime}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Session Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Session</DialogTitle>
            <DialogDescription>
              Mark this session as completed and add any notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <Textarea
                placeholder="Add notes about this session, key discussion points, action items..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteSession} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Session Card Component
interface SessionCardProps {
  session: Session;
  onEdit: () => void;
  onReschedule: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
  onDelete: () => void;
}

const SessionCard = ({
  session,
  onEdit,
  onReschedule,
  onComplete,
  onCancel,
  onNoShow,
  onDelete,
}: SessionCardProps) => {
  const typeConfig = SESSION_TYPES[session.session_type];
  const statusConfig = STATUS_CONFIG[session.status];
  const StatusIcon = statusConfig.icon;
  const isUpcoming = session.status === 'scheduled' && new Date(session.scheduled_at) > new Date();
  const isPastScheduled = session.status === 'scheduled' && new Date(session.scheduled_at) < new Date();

  return (
    <div className={cn(
      "flex items-start justify-between p-4 rounded-lg border",
      isUpcoming && "border-blue-500/30 bg-blue-500/5",
      session.status === 'completed' && "border-green-500/30 bg-green-500/5",
      session.status === 'cancelled' && "opacity-60",
    )}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-muted">
          <span className="text-xs text-muted-foreground">
            {new Date(session.scheduled_at).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-xl font-bold">
            {new Date(session.scheduled_at).getDate()}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(session.scheduled_at).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={cn(typeConfig.color)}>{typeConfig.label}</Badge>
            <Badge variant="outline" className={cn(statusConfig.color, "gap-1")}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(session.scheduled_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <span>{session.duration_minutes} min</span>
            {session.meeting_provider && (
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {MEETING_PROVIDERS.find(p => p.value === session.meeting_provider)?.label || session.meeting_provider}
              </span>
            )}
          </div>

          {session.meeting_url && (
            <a
              href={session.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Join Meeting
            </a>
          )}

          {session.expert_notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {session.expert_notes}
            </p>
          )}

          {session.cancellation_reason && (
            <p className="text-sm text-red-500">
              Cancelled: {session.cancellation_reason}
            </p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {session.status === 'scheduled' && (
            <>
              <DropdownMenuItem onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReschedule}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reschedule
              </DropdownMenuItem>
              {isPastScheduled && (
                <DropdownMenuItem onClick={onNoShow}>
                  <UserX className="h-4 w-4 mr-2" />
                  Mark as No Show
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCancel} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Session
              </DropdownMenuItem>
            </>
          )}
          {session.status !== 'scheduled' && (
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SessionSchedulingTab;
