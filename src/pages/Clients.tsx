import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllClients, useCoachClients } from "@/hooks/useClients";
import { useExpertIdForUser } from "@/hooks/useCoaches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Filter,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  CalendarCheck,
  AlertCircle,
  FileQuestion,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientWithStatus, CoachingStatus, UserRole } from "@/types";

interface ClientsProps {
  currentRole?: UserRole;
  currentCoachId?: string;
}

const STATUS_CONFIG: Record<CoachingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending_questionnaire: {
    label: "Questionnaire Pending",
    color: "bg-warning/10 text-warning",
    icon: FileQuestion,
  },
  pending_schedule: {
    label: "Needs Scheduling",
    color: "bg-primary/10 text-primary",
    icon: Clock,
  },
  scheduled_review: {
    label: "Review Scheduled",
    color: "bg-accent/10 text-accent",
    icon: CalendarCheck,
  },
  active: {
    label: "Active",
    color: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  paused: {
    label: "Paused",
    color: "bg-muted text-muted-foreground",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-secondary text-secondary-foreground",
    icon: CheckCircle2,
  },
};

const Clients = ({ currentRole = "admin", currentCoachId }: ClientsProps) => {
  const navigate = useNavigate();
  const isCoachView = currentRole === "coach";

  // Debug logging
  console.log('[Clients] Props:', { currentRole, currentCoachId, isCoachView });

  // For coaches, look up their expert ID (since user.id might != expert.id)
  const { data: expertId, isLoading: loadingExpertId } = useExpertIdForUser(
    isCoachView ? currentCoachId : undefined
  );

  console.log('[Clients] Expert ID lookup:', { expertId, loadingExpertId });

  // Use the expertId if available, otherwise fall back to currentCoachId
  const effectiveCoachId = expertId || currentCoachId;

  console.log('[Clients] Effective coach ID:', effectiveCoachId);

  // Use appropriate hook based on role
  const allClientsQuery = useAllClients();
  const coachClientsQuery = useCoachClients(isCoachView ? effectiveCoachId : undefined);

  // Select the appropriate data based on role
  const clientsQuery = isCoachView ? coachClientsQuery : allClientsQuery;
  const { data: clients = [], isLoading: loadingClients, error } = clientsQuery;

  console.log('[Clients] Query result:', { clients, loadingClients, error });

  // Combined loading state
  const isLoading = loadingClients || (isCoachView && loadingExpertId && !effectiveCoachId);

  const [statusFilter, setStatusFilter] = useState<CoachingStatus | "all">("all");

  const filteredClients = statusFilter === "all"
    ? clients
    : clients.filter((c: ClientWithStatus) => c.coachingStatus === statusFilter);

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: clients.length };
    clients.forEach((client: ClientWithStatus) => {
      const status = client.coachingStatus || "active";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: "bg-success/10 text-success hover:bg-success/20",
      medium: "bg-warning/10 text-warning hover:bg-warning/20",
      high: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Failed to load clients</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isCoachView ? "My Clients" : "Clients"}
          </h1>
          <p className="text-muted-foreground">
            {isCoachView
              ? `${clients.length} client${clients.length !== 1 ? 's' : ''} in your coaching roster`
              : "Manage and monitor all clients across your organization"
            }
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            statusFilter === "all" && "border-primary"
          )}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all || 0}</div>
          </CardContent>
        </Card>

        {(Object.entries(STATUS_CONFIG) as [CoachingStatus, typeof STATUS_CONFIG[CoachingStatus]][])
          .filter(([status]) => status !== "completed" && status !== "paused")
          .map(([status, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={status}
                className={cn(
                  "cursor-pointer transition-colors",
                  statusFilter === status && "border-primary"
                )}
                onClick={() => setStatusFilter(status)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {statusFilter === "all"
              ? "All clients with their coaching status"
              : `Clients with status: ${STATUS_CONFIG[statusFilter]?.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questionnaire</TableHead>
                  <TableHead>Next Session</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Adherence</TableHead>
                  {!isCoachView && <TableHead>Coach</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isCoachView ? 7 : 8} className="text-center py-8 text-muted-foreground">
                      {isCoachView ? "No clients have hired you yet" : "No clients found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client: ClientWithStatus) => {
                    const status = client.coachingStatus || "active";
                    const statusConfig = STATUS_CONFIG[status];
                    const StatusIcon = statusConfig?.icon || CheckCircle2;

                    return (
                      <TableRow key={client.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{client.name}</div>
                              <div className="text-xs text-muted-foreground">{client.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", statusConfig?.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig?.label || status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.questionnaireCompletedAt ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">
                                {formatDate(client.questionnaireCompletedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not completed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.nextSessionAt ? (
                            <div className="flex items-center gap-2">
                              <CalendarCheck className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                {formatDate(client.nextSessionAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getRiskBadge(client.riskLevel))}>
                            {client.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-semibold",
                            client.adherence30d >= 80 ? "text-success" :
                              client.adherence30d >= 60 ? "text-warning" : "text-destructive"
                          )}>
                            {client.adherence30d}%
                          </span>
                        </TableCell>
                        {!isCoachView && (
                          <TableCell>
                            <div className="text-sm">{client.assignedCoachName || "—"}</div>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/clients/${client.relationshipId || client.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Items Section */}
      {(statusCounts.pending_questionnaire > 0 || statusCounts.pending_schedule > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Action Required
            </CardTitle>
            <CardDescription>
              Clients that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients
                .filter((c: ClientWithStatus) =>
                  c.coachingStatus === "pending_questionnaire" ||
                  c.coachingStatus === "pending_schedule"
                )
                .map((client: ClientWithStatus) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.coachingStatus === "pending_questionnaire"
                            ? "Waiting for questionnaire completion"
                            : "Needs to schedule first session"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/clients/${client.relationshipId || client.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;
