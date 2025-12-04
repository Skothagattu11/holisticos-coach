import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Heart,
  Moon,
  Flame,
  Activity,
  Calendar,
  MoreVertical,
  Check,
  X,
  Eye,
  MessageSquare,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  relationship_id: string;
  expert_id: string;
  user_id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  metric_data: any;
  is_read: boolean;
  is_dismissed: boolean;
  is_actioned: boolean;
  actioned_at: string | null;
  action_notes: string | null;
  triggered_at: string;
  read_at: string | null;
  created_at: string;
}

interface CoachAlertsPanelProps {
  onAlertCountChange?: (count: number) => void;
}

const ALERT_TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  recovery_low: { icon: Heart, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  sleep_poor: { icon: Moon, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  strain_high: { icon: Flame, color: "text-red-500", bgColor: "bg-red-500/10" },
  hrv_drop: { icon: Activity, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  consistency_drop: { icon: Calendar, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  no_checkin: { icon: BellOff, color: "text-gray-500", bgColor: "bg-gray-500/10" },
  default: { icon: AlertTriangle, color: "text-orange-500", bgColor: "bg-orange-500/10" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/30" },
  medium: { label: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-500/10 border-yellow-500/30" },
  high: { label: "High", color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/30" },
  critical: { label: "Critical", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/30" },
};

export const CoachAlertsPanel = ({ onAlertCountChange }: CoachAlertsPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expertId, setExpertId] = useState<string | null>(null);

  // Action dialog state
  const [actionAlertId, setActionAlertId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isActioning, setIsActioning] = useState(false);

  // Fetch expert ID on mount
  useEffect(() => {
    const fetchExpertId = async () => {
      if (!user?.id) return;

      const id = await coachService.getExpertIdForUser(user.id);
      setExpertId(id);
    };

    fetchExpertId();
  }, [user?.id]);

  // Fetch alerts when expert ID is available
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!expertId) return;

      setIsLoading(true);
      try {
        const data = await coachService.fetchAlerts(expertId, { limit: 50 });
        setAlerts(data);
        onAlertCountChange?.(data.filter((a: Alert) => !a.is_read).length);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [expertId, onAlertCountChange]);

  // Mark alert as read
  const handleMarkRead = async (alertId: string) => {
    try {
      await coachService.markAlertRead(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      onAlertCountChange?.(alerts.filter(a => !a.is_read && a.id !== alertId).length);
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;

    try {
      await coachService.markAlertsRead(unreadIds);
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
      onAlertCountChange?.(0);
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  // Dismiss alert
  const handleDismiss = async (alertId: string) => {
    try {
      await coachService.dismissAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      onAlertCountChange?.(alerts.filter(a => !a.is_read && a.id !== alertId).length);
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  // Action alert (with notes)
  const handleAction = async () => {
    if (!actionAlertId) return;

    setIsActioning(true);
    try {
      await coachService.actionAlert(actionAlertId, actionNotes);
      setAlerts(alerts.map(a =>
        a.id === actionAlertId
          ? { ...a, is_actioned: true, is_read: true, action_notes: actionNotes }
          : a
      ));
      onAlertCountChange?.(alerts.filter(a => !a.is_read && a.id !== actionAlertId).length);
      setActionAlertId(null);
      setActionNotes("");
    } catch (error) {
      console.error("Error actioning alert:", error);
    } finally {
      setIsActioning(false);
    }
  };

  // Navigate to client
  const handleViewClient = (relationshipId: string) => {
    navigate(`/clients/${relationshipId}`);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-base">Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <CardDescription>
          Health alerts and notifications for your clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">No alerts</p>
            <p className="text-muted-foreground text-xs mt-1">
              You'll be notified when clients need attention
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.default;
                const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      !alert.is_read && "bg-primary/5 border-primary/20",
                      alert.is_read && "bg-muted/30",
                      alert.is_actioned && "opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn("p-2 rounded-full shrink-0", typeConfig.bgColor)}>
                        <Icon className={cn("h-4 w-4", typeConfig.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0", severityConfig.bgColor)}
                              >
                                {severityConfig.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(alert.triggered_at)}
                              </span>
                              {!alert.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className={cn(
                              "text-sm",
                              !alert.is_read && "font-medium"
                            )}>
                              {alert.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {alert.message}
                            </p>

                            {/* Metric data */}
                            {alert.metric_data && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {alert.metric_data.recovery !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recovery: {alert.metric_data.recovery}%
                                  </Badge>
                                )}
                                {alert.metric_data.sleep !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    Sleep: {alert.metric_data.sleep}%
                                  </Badge>
                                )}
                                {alert.metric_data.strain !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    Strain: {alert.metric_data.strain}
                                  </Badge>
                                )}
                                {alert.metric_data.hrv !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    HRV: {alert.metric_data.hrv}ms
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Action notes */}
                            {alert.is_actioned && alert.action_notes && (
                              <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                                <span className="text-muted-foreground">Action taken: </span>
                                {alert.action_notes}
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
                              <DropdownMenuItem onClick={() => handleViewClient(alert.relationship_id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Client
                              </DropdownMenuItem>
                              {!alert.is_read && (
                                <DropdownMenuItem onClick={() => handleMarkRead(alert.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              {!alert.is_actioned && (
                                <DropdownMenuItem onClick={() => setActionAlertId(alert.id)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Take Action
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDismiss(alert.id)}
                                className="text-muted-foreground"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Dismiss
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Action Dialog */}
      <AlertDialog open={!!actionAlertId} onOpenChange={() => setActionAlertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take Action on Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Record what action you're taking for this alert. This helps track your response and follow-up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Describe the action you're taking (e.g., 'Sent message to check in', 'Scheduled a call')..."
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionNotes("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={isActioning}>
              {isActioning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark as Actioned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
