import { useParams, useNavigate } from "react-router-dom";
import { mockClients, generateMetricsHistory, mockFeedback, mockCheckIns, mockActivityMetrics, mockRoutines } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { RoutineForm } from "@/components/clients/RoutineForm";
import { RoutineCard } from "@/components/clients/RoutineCard";
import { CheckInList } from "@/components/clients/CheckInList";
import { ActivityMetrics } from "@/components/clients/ActivityMetrics";
import { DateNavigator } from "@/components/clients/DateNavigator";
import { useState } from "react";
import { RoutineBlock } from "@/types";
import { toast } from "sonner";

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const client = mockClients.find(c => c.id === clientId);
  const metrics = generateMetricsHistory(clientId || "c1", 30);
  const clientFeedback = mockFeedback.filter(f => f.targetId === clientId);
  const clientCheckIns = mockCheckIns.filter(ci => ci.clientId === clientId);
  const clientActivity = mockActivityMetrics;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [routines, setRoutines] = useState<RoutineBlock[]>(mockRoutines.filter(r => r.clientId === clientId));
  const [editingRoutine, setEditingRoutine] = useState<RoutineBlock | null>(null);

  const handleAddRoutine = (routine: Omit<RoutineBlock, "id">) => {
    const newRoutine: RoutineBlock = {
      ...routine,
      id: `r${Date.now()}`,
    };
    setRoutines([...routines, newRoutine]);
  };

  const handleUpdateRoutine = (updatedRoutine: RoutineBlock) => {
    setRoutines(routines.map(r => r.id === updatedRoutine.id ? updatedRoutine : r));
    setEditingRoutine(null);
    toast.success("Routine updated successfully");
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
    toast.success("Routine deleted successfully");
  };

  const handleCheckInMessage = (checkInId: string, message: string) => {
    toast.success("Message sent to client");
  };

  if (!client) {
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

  const chartData = metrics.slice(-14).map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    HRV: m.hrv || null,
    Sleep: m.sleep || null,
    RHR: m.rhr || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        <Badge className={cn("capitalize", getRiskBadge(client.riskLevel))}>
          {client.riskLevel} Risk
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Adherence 7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.adherence7d}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>vs 30d: {client.adherence30d}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sleep Avg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.sleep7dAvg.toFixed(1)}h</div>
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
            <div className="text-2xl font-bold">{client.hrv7dAvg}</div>
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
            <div className="text-2xl font-bold">{client.rhr7dAvg}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Baseline: {client.rhr7dAvg - 2}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="routine">Routine</TabsTrigger>
            <TabsTrigger value="checkin">Check-ins</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
          </TabsList>
          <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />
        </div>

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
                    {client.archetypes.map(arch => (
                      <Badge key={arch} variant="outline">{arch}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Assigned Coach</div>
                  <div className="font-medium mt-1">{client.assignedCoachName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Goals</div>
                  <div className="mt-1">
                    {client.goals.map(goal => (
                      <div key={goal} className="text-sm">{goal}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Connected Devices</div>
                  <div className="flex gap-2 mt-1">
                    {client.devices.map(device => (
                      <Badge key={device} variant="secondary" className="text-xs">{device}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Average Duration</span>
                  <span className="font-semibold">{client.sleep7dAvg.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Sleep Efficiency</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Deep Sleep</span>
                  <span className="font-semibold">1.8h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">REM Sleep</span>
                  <span className="font-semibold">1.5h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Heart Rate Variability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">7-Day Average</span>
                  <span className="font-semibold">{client.hrv7dAvg} ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Baseline</span>
                  <span className="font-semibold">{client.hrv7dAvg - 4} ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Trend</span>
                  <span className="font-semibold text-success">↑ Improving</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Recovery Status</span>
                  <Badge variant="secondary" className="text-xs">Good</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Resting Heart Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">7-Day Average</span>
                  <span className="font-semibold">{client.rhr7dAvg} bpm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Baseline</span>
                  <span className="font-semibold">{client.rhr7dAvg - 2} bpm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Min (7d)</span>
                  <span className="font-semibold">{client.rhr7dAvg - 3} bpm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Max (7d)</span>
                  <span className="font-semibold">{client.rhr7dAvg + 4} bpm</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Activity & Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Daily Average</span>
                  <span className="font-semibold">8,450 steps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Target</span>
                  <span className="font-semibold">10,000 steps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Minutes</span>
                  <span className="font-semibold">45 min/day</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Calories Burned</span>
                  <span className="font-semibold">2,340 kcal</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Training Load</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Weekly Load</span>
                  <span className="font-semibold">285</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Load Status</span>
                  <Badge variant="secondary" className="text-xs">Optimal</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Strain</span>
                  <span className="font-semibold">13.2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">vs Last Week</span>
                  <span className="font-semibold text-success">+8%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Stress & Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Stress Level</span>
                  <span className="font-semibold">Medium</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Recovery Score</span>
                  <span className="font-semibold">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Readiness</span>
                  <Badge className="text-xs bg-success/10 text-success">High</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Respiratory Rate</span>
                  <span className="font-semibold">14.5 brpm</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routine" className="space-y-4">
          <RoutineForm 
            clientId={clientId || ""} 
            editingRoutine={editingRoutine}
            onAdd={handleAddRoutine}
            onUpdate={handleUpdateRoutine}
            onCancel={() => setEditingRoutine(null)}
          />
          
          {routines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Routines for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routines
                    .filter(routine => {
                      const routineDate = new Date(routine.start);
                      return routineDate.toDateString() === selectedDate.toDateString();
                    })
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        onEdit={setEditingRoutine}
                        onDelete={handleDeleteRoutine}
                      />
                    ))}
                  {routines.filter(r => new Date(r.start).toDateString() === selectedDate.toDateString()).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No routines scheduled for this date
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          <CheckInList checkIns={clientCheckIns} onSendMessage={handleCheckInMessage} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityMetrics metrics={clientActivity} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {clientFeedback.length > 0 ? (
            clientFeedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{feedback.category.replace("-", " ")}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {feedback.authorName} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      feedback.status === "applied" ? "default" : 
                      feedback.status === "triaged" ? "secondary" : 
                      "outline"
                    }>
                      {feedback.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Evidence:</div>
                    <p className="text-sm text-muted-foreground">{feedback.evidence}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Proposed Fix:</div>
                    <p className="text-sm text-muted-foreground">{feedback.proposedFix}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No feedback recorded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetail;
