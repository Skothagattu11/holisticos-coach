import { useParams, useNavigate } from "react-router-dom";
import { useQuestionnaireResponses } from "@/hooks/useQuestionnaires";
import { useCoachingRelationship } from "@/hooks/useClients";
import { usePlans } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  CalendarCheck,
  FileQuestion,
  Loader2,
  ClipboardList,
  Bot,
  MessageSquare,
  Send,
  Calendar,
  Zap,
  Heart,
  Activity,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  XCircle,
  SkipForward,
  StickyNote,
  Target,
  CalendarPlus,
  CalendarRange,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { PlanTab } from "@/components/clients/PlanTab";
import { CoachingRulesManager } from "@/components/clients/CoachingRulesManager";
import { PlanItemVariationsEditor } from "@/components/clients/PlanItemVariationsEditor";
import { HealthMetricsTab } from "@/components/clients/HealthMetricsTab";
import { CoachNotesTab } from "@/components/clients/CoachNotesTab";
import { ClientGoalsTab } from "@/components/clients/ClientGoalsTab";
import { SessionSchedulingTab } from "@/components/clients/SessionSchedulingTab";
import { WeeklyCheckinTab } from "@/components/clients/WeeklyCheckinTab";
import { useState, useEffect, useRef } from "react";
import { CoachingStatus, QuestionnaireResponse } from "@/types";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_CONFIG: Record<CoachingStatus, { label: string; color: string }> = {
  pending_questionnaire: { label: "Questionnaire Pending", color: "bg-warning/10 text-warning" },
  pending_schedule: { label: "Needs Scheduling", color: "bg-primary/10 text-primary" },
  scheduled_review: { label: "Review Scheduled", color: "bg-accent/10 text-accent" },
  active: { label: "Active", color: "bg-success/10 text-success" },
  paused: { label: "Paused", color: "bg-muted text-muted-foreground" },
  completed: { label: "Completed", color: "bg-secondary text-secondary-foreground" },
};

// Check-in type for display
interface ClientCheckIn {
  id: string;
  checkin_date: string;
  energy_rating: number | null;
  mood_level: number | null;
  stress_level: number | null;
  tasks_completed: number;
  tasks_total: number;
  completion_rate: number | null;
  notes: string | null;
  tasks_completed_details: any[] | null;
  created_at: string;
}

// Message type for chat
interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch data from database
  const { data: questionnaireResponses = [], isLoading: loadingResponses } = useQuestionnaireResponses(clientId);
  const { data: relationship, isLoading: loadingRelationship } = useCoachingRelationship(clientId);
  const { activePlan, refetchPlans } = usePlans(clientId);

  // Check-ins state
  const [checkIns, setCheckIns] = useState<ClientCheckIn[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Next event state
  const [nextEvent, setNextEvent] = useState<any>(null);

  // Date navigator state for check-ins tab
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch check-ins
  useEffect(() => {
    const fetchCheckIns = async () => {
      if (!clientId || !relationship) return;

      setLoadingCheckIns(true);
      try {
        // Try by relationship first, then by user_id
        let data = await coachService.fetchClientCheckIns(clientId);

        // If no check-ins found by relationship_id, try by user_id
        if (data.length === 0 && relationship.clientId) {
          data = await coachService.fetchCheckInsByUserId(relationship.clientId);
        }
        setCheckIns(data);
      } catch (error) {
        console.error("Error fetching check-ins:", error);
      } finally {
        setLoadingCheckIns(false);
      }
    };

    fetchCheckIns();
  }, [clientId, relationship]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!clientId) return;

      setLoadingMessages(true);
      try {
        const data = await coachService.fetchMessages(clientId);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [clientId]);

  // Fetch next event
  useEffect(() => {
    const fetchNextEvent = async () => {
      if (!clientId) return;

      try {
        const event = await coachService.getNextScheduledEvent(clientId);
        setNextEvent(event);
      } catch (error) {
        console.error("Error fetching next event:", error);
      }
    };

    fetchNextEvent();
  }, [clientId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !clientId || !user?.id) return;

    setSendingMessage(true);
    try {
      const sent = await coachService.sendMessage(clientId, user.id, newMessage.trim());
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Mock data for charts - to be replaced with real data later
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      HRV: Math.floor(Math.random() * 30) + 40,
      Sleep: Math.floor(Math.random() * 2) + 6,
      RHR: Math.floor(Math.random() * 10) + 55,
    };
  });

  if (loadingRelationship) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!relationship) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Client not found</h2>
        <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const getRiskBadge = (level: string) => {
    const colors = {
      low: "bg-success/10 text-success",
      medium: "bg-warning/10 text-warning",
      high: "bg-destructive/10 text-destructive",
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Render questionnaire response answers
  const renderAnswer = (question: any, answer: any) => {
    if (Array.isArray(answer)) {
      return (
        <div className="flex flex-wrap gap-1">
          {answer.map((a, i) => (
            <Badge key={i} variant="secondary">{a}</Badge>
          ))}
        </div>
      );
    }
    return <span className="text-foreground">{String(answer)}</span>;
  };

  // Get client info from relationship
  const clientInfo = (relationship as any)?.client || {};
  const displayClient = {
    name: clientInfo.name || clientInfo.email?.split("@")[0] || "Client",
    email: clientInfo.email || "",
    riskLevel: "low" as const,
    adherence7d: checkIns.length > 0
      ? Math.round(checkIns.slice(0, 7).reduce((acc, c) => acc + (c.completion_rate || 0), 0) / Math.min(7, checkIns.length))
      : 0,
    adherence30d: 0,
    sleep7dAvg: 0,
    hrv7dAvg: 0,
    rhr7dAvg: 0,
    archetypes: [] as string[],
    goals: [] as string[],
    devices: [] as string[],
    assignedCoachName: (relationship as any)?.coach?.name || "",
  };

  const coachingStatus = relationship?.status as CoachingStatus || "active";
  const statusConfig = STATUS_CONFIG[coachingStatus];

  // Calculate average stats from check-ins
  const recentCheckIns = checkIns.slice(0, 7);
  const avgEnergy = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((acc, c) => acc + (c.energy_rating || 0), 0) / recentCheckIns.filter(c => c.energy_rating).length).toFixed(1)
    : "—";
  const avgMood = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((acc, c) => acc + (c.mood_level || 0), 0) / recentCheckIns.filter(c => c.mood_level).length).toFixed(1)
    : "—";
  const avgStress = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((acc, c) => acc + (c.stress_level || 0), 0) / recentCheckIns.filter(c => c.stress_level).length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{displayClient.name}</h1>
          <p className="text-muted-foreground">{displayClient.email}</p>
        </div>
        <Badge className={cn("capitalize", statusConfig?.color || getRiskBadge(displayClient.riskLevel))}>
          {statusConfig?.label || `${displayClient.riskLevel} Risk`}
        </Badge>
      </div>

      {/* Coaching Status Card */}
      {relationship && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Coaching Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={cn("mt-1", statusConfig?.color)}>
                  {statusConfig?.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="text-sm font-medium mt-1">
                  {relationship.hiredAt ? new Date(relationship.hiredAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Check-in</p>
                {nextEvent ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">
                      {formatDate(nextEvent.scheduled_at)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {nextEvent.type === 'meeting' ? 'Meeting' : 'Check-in'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Not scheduled</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins This Week</p>
                <p className="text-sm font-medium mt-1">
                  {recentCheckIns.length} / 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClient.adherence7d}%</div>
            <div className="text-xs text-muted-foreground mt-1">7-day average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Avg Energy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEnergy}/10</div>
            <div className="text-xs text-muted-foreground mt-1">7-day average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Avg Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMood}/10</div>
            <div className="text-xs text-muted-foreground mt-1">7-day average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Stress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStress}/10</div>
            <div className="text-xs text-muted-foreground mt-1">7-day average</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" id="client-detail-tabs">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1">
            <Bot className="h-3 w-3" />
            AI Rules
          </TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="questionnaire">
            <ClipboardList className="h-3 w-3 mr-1" />
            Questionnaire
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="h-3 w-3 mr-1" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-3 w-3 mr-1" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <CalendarPlus className="h-3 w-3 mr-1" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <CalendarRange className="h-3 w-3 mr-1" />
            Weekly
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Archetypes</div>
                    <div className="flex gap-2 mt-1">
                      {displayClient.archetypes.length > 0 ? (
                        displayClient.archetypes.map(arch => (
                          <Badge key={arch} variant="outline">{arch}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned Coach</div>
                    <div className="font-medium mt-1">{displayClient.assignedCoachName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Goals</div>
                    <div className="mt-1">
                      {displayClient.goals.length > 0 ? (
                        displayClient.goals.map(goal => (
                          <div key={goal} className="text-sm">{goal}</div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No goals set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Connected Devices</div>
                    <div className="flex gap-2 mt-1">
                      {displayClient.devices.length > 0 ? (
                        displayClient.devices.map(device => (
                          <Badge key={device} variant="secondary" className="text-xs">{device}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No devices</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Check-ins Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last 7 days of check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCheckIns ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentCheckIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No check-ins recorded yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentCheckIns.slice(0, 5).map((checkIn) => (
                      <div key={checkIn.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(checkIn.checkin_date)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {checkIn.tasks_completed}/{checkIn.tasks_total} tasks
                          </Badge>
                          {checkIn.energy_rating && (
                            <span className="text-muted-foreground">
                              Energy: {checkIn.energy_rating}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          {clientId && (
            <PlanTab
              relationshipId={clientId}
              onNavigateToAIRules={() => {
                const rulesTab = document.querySelector('[value="rules"]') as HTMLElement;
                if (rulesTab) rulesTab.click();
              }}
            />
          )}
        </TabsContent>

        {/* AI Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {clientId && (
            <>
              <CoachingRulesManager relationshipId={clientId} />
              {activePlan && (
                <PlanItemVariationsEditor
                  planId={activePlan.id}
                  onUpdate={refetchPlans}
                />
              )}
              {!activePlan && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Create a plan first to configure activity variations.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        const tabElement = document.querySelector('[data-state="inactive"][value="plan"]') as HTMLElement;
                        if (tabElement) tabElement.click();
                      }}
                    >
                      Go to Plan tab
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-4">
          {/* Date Navigator */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="text-xs"
                  >
                    Today
                  </Button>
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {(() => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      const hasCheckIn = checkIns.some(c => c.checkin_date === dateStr);
                      return hasCheckIn ? (
                        <Badge variant="outline" className="text-xs text-success border-success mt-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Check-in recorded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground mt-1">
                          No check-in
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    if (newDate <= new Date()) {
                      setSelectedDate(newDate);
                    }
                  }}
                  disabled={selectedDate.toDateString() === new Date().toDateString()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {loadingCheckIns ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            (() => {
              const dateStr = selectedDate.toISOString().split('T')[0];
              const selectedCheckIn = checkIns.find(c => c.checkin_date === dateStr);
              const selectedDateQuestionnaireResponses = questionnaireResponses.filter((r: QuestionnaireResponse) => {
                const responseDate = new Date(r.submittedAt || '').toISOString().split('T')[0];
                return responseDate === dateStr;
              });

              return (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Daily Check-in Card */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ClipboardList className="h-5 w-5" />
                          Daily Check-in
                        </CardTitle>
                        {selectedCheckIn && (
                          <Badge variant={selectedCheckIn.completion_rate && selectedCheckIn.completion_rate >= 80 ? "default" : "secondary"}>
                            {selectedCheckIn.tasks_completed}/{selectedCheckIn.tasks_total} tasks ({Math.round(selectedCheckIn.completion_rate || 0)}%)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedCheckIn ? (
                        <>
                          {/* Wellness Metrics */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-lg bg-muted/30">
                              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                              <div className="text-2xl font-bold">{selectedCheckIn.energy_rating || "—"}</div>
                              <div className="text-sm text-muted-foreground">Energy</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/30">
                              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
                              <div className="text-2xl font-bold">{selectedCheckIn.mood_level || "—"}</div>
                              <div className="text-sm text-muted-foreground">Mood</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/30">
                              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                              <div className="text-2xl font-bold">{selectedCheckIn.stress_level || "—"}</div>
                              <div className="text-sm text-muted-foreground">Stress</div>
                            </div>
                          </div>

                          {/* Notes */}
                          {selectedCheckIn.notes && (
                            <div className="p-4 rounded-lg bg-muted/30 mb-6">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Client Notes</p>
                              <p className="text-sm">{selectedCheckIn.notes}</p>
                            </div>
                          )}

                          {/* Tasks Detail */}
                          {selectedCheckIn.tasks_completed_details && selectedCheckIn.tasks_completed_details.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-3">Task Completion Details</p>
                              <div className="space-y-2">
                                {selectedCheckIn.tasks_completed_details.map((task: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border",
                                      task.completed ? "bg-success/5 border-success/20" : task.skipped ? "bg-warning/5 border-warning/20" : "bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      {task.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                      ) : task.skipped ? (
                                        <SkipForward className="h-5 w-5 text-warning" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">{task.task_name}</p>
                                        {task.category && (
                                          <Badge variant="outline" className="text-xs mt-1">{task.category}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                      {task.scheduled_time && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {task.scheduled_time}
                                        </div>
                                      )}
                                      {task.completed_at && (
                                        <div className="text-success">
                                          Done at {new Date(task.completed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                        </div>
                                      )}
                                      {task.skipped && task.skip_reason && (
                                        <div className="text-warning">{task.skip_reason}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Check-in</h3>
                          <p className="text-muted-foreground text-sm">
                            The client did not submit a check-in for this date.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Questionnaire Responses for this date */}
                  {selectedDateQuestionnaireResponses.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileQuestion className="h-5 w-5" />
                          Questionnaire Submitted
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedDateQuestionnaireResponses.map((response: QuestionnaireResponse) => (
                          <div key={response.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{response.questionnaire?.title || "Assessment"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Submitted at {new Date(response.submittedAt || '').toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </p>
                              </div>
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              {response.questionnaire?.questions.slice(0, 5).map((question, idx) => {
                                const answer = response.answers[question.id];
                                return (
                                  <div key={question.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                                    <p className="text-sm font-medium mb-1">{idx + 1}. {question.question}</p>
                                    <div className="bg-muted/50 rounded-md p-2">
                                      {answer !== undefined ? (
                                        renderAnswer(question, answer)
                                      ) : (
                                        <span className="text-muted-foreground italic text-sm">No answer</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {response.questionnaire?.questions && response.questionnaire.questions.length > 5 && (
                                <Button
                                  variant="link"
                                  className="text-sm p-0 h-auto"
                                  onClick={() => {
                                    const tabElement = document.querySelector('[value="questionnaire"]') as HTMLElement;
                                    if (tabElement) tabElement.click();
                                  }}
                                >
                                  View all {response.questionnaire.questions.length} questions →
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()
          )}

          {/* Recent Check-ins Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Check-in History</CardTitle>
              <CardDescription>Click a date to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No check-ins recorded yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const checkIn = checkIns.find(c => c.checkin_date === dateStr);
                    const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;

                    return (
                      <Button
                        key={dateStr}
                        variant={isSelected ? "default" : checkIn ? "outline" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-12 w-12 flex flex-col p-1",
                          checkIn && !isSelected && "border-success/50 bg-success/5 hover:bg-success/10",
                          !checkIn && !isSelected && "opacity-50"
                        )}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="text-[10px] uppercase">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-sm font-bold">{date.getDate()}</span>
                        {checkIn && (
                          <span className="text-[8px]">
                            {Math.round(checkIn.completion_rate || 0)}%
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questionnaire Tab */}
        <TabsContent value="questionnaire" className="space-y-4">
          {loadingResponses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questionnaireResponses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assessment Completed</h3>
                <p className="text-muted-foreground">
                  The client has not completed their initial assessment yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {questionnaireResponses.map((response: QuestionnaireResponse) => (
                <Card key={response.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{response.questionnaire?.title || "Assessment"}</CardTitle>
                        <CardDescription>
                          Submitted {formatDateTime(response.submittedAt)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {response.questionnaire?.questions.map((question, idx) => {
                        const answer = response.answers[question.id];
                        return (
                          <div key={question.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <span className="text-sm font-medium text-muted-foreground min-w-[24px]">{idx + 1}.</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-2">{question.question}</p>
                                <div className="bg-muted/50 rounded-md p-3">
                                  {answer !== undefined ? (
                                    renderAnswer(question, answer)
                                  ) : (
                                    <span className="text-muted-foreground italic">No answer provided</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages with {displayClient.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {messages.map((msg) => {
                      const isCoach = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isCoach ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              isCoach
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              isCoach ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                />
                <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {(() => {
            console.log('[ClientDetail] Metrics Tab - clientId:', clientId, 'relationship?.clientId:', relationship?.clientId);
            return null;
          })()}
          {clientId && relationship?.clientId ? (
            <HealthMetricsTab
              clientId={clientId}
              userId={relationship.clientId}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading client data... (clientId: {clientId}, userId: {relationship?.clientId || 'undefined'})</p>
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {clientId && relationship?.clientId ? (
            <ClientGoalsTab
              relationshipId={clientId}
              userId={relationship.clientId}
              clientName={displayClient.name}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading client data...</p>
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          {clientId && relationship?.clientId ? (
            <CoachNotesTab
              relationshipId={clientId}
              userId={relationship.clientId}
              clientName={displayClient.name}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading client data...</p>
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {clientId ? (
            <SessionSchedulingTab
              relationshipId={clientId}
              clientName={displayClient.name}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading client data...</p>
            </div>
          )}
        </TabsContent>

        {/* Weekly Check-in Tab */}
        <TabsContent value="weekly" className="space-y-4">
          {clientId && relationship?.clientId ? (
            <WeeklyCheckinTab
              relationshipId={clientId}
              userId={relationship.clientId}
              clientName={displayClient.name}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading client data...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetail;
