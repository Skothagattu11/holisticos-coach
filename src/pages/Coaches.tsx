import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockCoaches, mockClients, mockFeedback } from "@/lib/mock-data";
import { Users, Star, TrendingUp, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";

const Coaches = () => {
  const navigate = useNavigate();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  const selectedCoach = selectedCoachId 
    ? mockCoaches.find(c => c.id === selectedCoachId) 
    : null;

  const getCoachStats = (coachId: string) => {
    const clients = mockClients.filter(c => c.assignedCoachId === coachId);
    const activeClients = clients.filter(c => c.status === "active");
    const feedback = mockFeedback.filter(f => 
      clients.some(c => c.id === f.targetId && f.targetType === "client")
    );
    
    const avgAdherence = clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.adherence30d, 0) / clients.length)
      : 0;
    
    const recentTickets = feedback.filter(f => {
      const createdDate = new Date(f.createdAt);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdDate > sevenDaysAgo;
    });

    return {
      totalClients: clients.length,
      activeClients: activeClients.length,
      pastClients: clients.length - activeClients.length,
      avgAdherence,
      rating: 4.7 + Math.random() * 0.3,
      totalFeedback: feedback.length,
      recentTickets: recentTickets.length,
      resolvedTickets: feedback.filter(f => f.status === "applied").length,
    };
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

  if (selectedCoach) {
    const stats = getCoachStats(selectedCoach.id);
    const coachClients = mockClients.filter(c => c.assignedCoachId === selectedCoach.id);
    const coachFeedback = mockFeedback.filter(f => 
      coachClients.some(c => c.id === f.targetId && f.targetType === "client")
    ).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedCoachId(null)} className="mb-2">
              ← Back to Coaches
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{selectedCoach.name}</h1>
            <p className="text-muted-foreground">{selectedCoach.email}</p>
          </div>
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">{getInitials(selectedCoach.name)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeClients} active, {stats.pastClients} past
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Adherence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgAdherence}%</div>
              <p className="text-xs text-muted-foreground">
                30-day average across clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {stats.totalFeedback} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentTickets}</div>
              <p className="text-xs text-muted-foreground">
                {stats.resolvedTickets} resolved this month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Roster</CardTitle>
                <CardDescription>All clients assigned to this coach</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{client.adherence30d}% adherence</p>
                          <p className="text-xs text-muted-foreground">{client.archetypes[0]}</p>
                        </div>
                        <Badge variant={client.riskLevel === "low" ? "outline" : client.riskLevel === "medium" ? "secondary" : "destructive"}>
                          {client.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest tickets and feedback related to this coach's clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachFeedback.map((feedback) => (
                    <div key={feedback.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            feedback.severity === "high" ? "destructive" :
                            feedback.severity === "medium" ? "secondary" : "outline"
                          }>
                            {feedback.severity}
                          </Badge>
                          <span className="text-sm font-medium">{feedback.category}</span>
                        </div>
                        <Badge variant={
                          feedback.status === "applied" ? "outline" :
                          feedback.status === "triaged" ? "secondary" : "default"
                        }>
                          {feedback.status === "applied" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {feedback.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {feedback.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">{feedback.evidence}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{feedback.targetName || "Client"}</span>
                        <span>•</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{feedback.comments.length} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Updated training plan", client: "Sarah Chen", time: "2 hours ago" },
                    { action: "Responded to check-in", client: "Marcus Johnson", time: "5 hours ago" },
                    { action: "Created new routine", client: "Priya Sharma", time: "1 day ago" },
                    { action: "Adjusted nutrition goals", client: "Sarah Chen", time: "2 days ago" },
                    { action: "Reviewed progress metrics", client: "Marcus Johnson", time: "3 days ago" },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.client} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm text-foreground">{selectedCoach.bio}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCoach.certifications?.map((cert, idx) => (
                  <Badge key={idx} variant="secondary">{cert}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Coaches</h1>
        <p className="text-muted-foreground">
          Overview of all coaches and their performance metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {mockCoaches.map((coach) => {
          const stats = getCoachStats(coach.id);
          return (
            <Card 
              key={coach.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedCoachId(coach.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{getInitials(coach.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle>{coach.name}</CardTitle>
                    <CardDescription>{coach.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {stats.rating.toFixed(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{coach.bio}</p>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalClients}</p>
                    <p className="text-xs text-muted-foreground">Total Clients</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.activeClients}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgAdherence}%</p>
                    <p className="text-xs text-muted-foreground">Adherence</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {coach.certifications?.slice(0, 3).map((cert, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Coaches;
