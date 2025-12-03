import { useParams, useNavigate } from "react-router-dom";
import { useQuestionnaireResponses } from "@/hooks/useQuestionnaires";
import { useCoachingRelationship } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, TrendingDown, CheckCircle2, Clock, CalendarCheck, FileQuestion, Loader2, ClipboardList, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { CheckInList } from "@/components/clients/CheckInList";
import { PlanTab } from "@/components/clients/PlanTab";
import { useState } from "react";
import { CoachingStatus, QuestionnaireResponse } from "@/types";

const STATUS_CONFIG: Record<CoachingStatus, { label: string; color: string }> = {
  pending_questionnaire: { label: "Questionnaire Pending", color: "bg-warning/10 text-warning" },
  pending_schedule: { label: "Needs Scheduling", color: "bg-primary/10 text-primary" },
  scheduled_review: { label: "Review Scheduled", color: "bg-accent/10 text-accent" },
  active: { label: "Active", color: "bg-success/10 text-success" },
  paused: { label: "Paused", color: "bg-muted text-muted-foreground" },
  completed: { label: "Completed", color: "bg-secondary text-secondary-foreground" },
};

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  // Fetch data from database
  const { data: questionnaireResponses = [], isLoading: loadingResponses } = useQuestionnaireResponses(clientId);
  const { data: relationship, isLoading: loadingRelationship } = useCoachingRelationship(clientId);

  // Modal state for questionnaire
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

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

  const clientCheckIns: Array<{
    id: string;
    date: string;
    mood: number;
    energy: number;
    notes: string;
    responded: boolean;
  }> = [];

  const handleCheckInMessage = (checkInId: string, message: string) => {
    console.log("Message sent to client", checkInId, message);
  };

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
    adherence7d: 0,
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
                <p className="text-sm text-muted-foreground">Next Session</p>
                {relationship.nextSessionAt ? (
                  <p className="text-sm font-medium mt-1">
                    {formatDateTime(relationship.nextSessionAt)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Not scheduled</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Initial Assessment</p>
                {relationship.questionnaireCompletedAt || questionnaireResponses.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 gap-2"
                    onClick={() => setShowQuestionnaire(true)}
                  >
                    <Eye className="h-3 w-3" />
                    View Assessment
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 mt-1 text-warning">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Adherence 7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClient.adherence7d}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>vs 30d: {displayClient.adherence30d}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sleep Avg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClient.sleep7dAvg.toFixed(1)}h</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Target: 7.5h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">HRV 7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClient.hrv7dAvg}</div>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+4 vs baseline</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">RHR 7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClient.rhr7dAvg}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Baseline: {displayClient.rhr7dAvg - 2}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="checkin">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {clientId && <PlanTab relationshipId={clientId} />}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>14-Day Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="HRV" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Sleep" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="RHR" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          <CheckInList checkIns={clientCheckIns} onSendMessage={handleCheckInMessage} />
        </TabsContent>
      </Tabs>

      {/* Initial Assessment Dialog */}
      <Dialog open={showQuestionnaire} onOpenChange={setShowQuestionnaire}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Initial Assessment
            </DialogTitle>
          </DialogHeader>
          {loadingResponses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questionnaireResponses.length === 0 ? (
            <div className="py-12 text-center">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessment Completed</h3>
              <p className="text-muted-foreground">
                The client has not completed their initial assessment yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questionnaireResponses.map((response: QuestionnaireResponse) => (
                <div key={response.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{response.questionnaire?.title || "Assessment"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDateTime(response.submittedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </Badge>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
