import { useParams, useNavigate } from "react-router-dom";
import { mockClients, generateMetricsHistory, mockFeedback } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const client = mockClients.find(c => c.id === clientId);
  const metrics = generateMetricsHistory(clientId || "c1", 30);
  const clientFeedback = mockFeedback.filter(f => f.targetId === clientId);

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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback History</TabsTrigger>
          <TabsTrigger value="routine">Routine</TabsTrigger>
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

        <TabsContent value="routine">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Routine calendar and schedule coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetail;
