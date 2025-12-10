import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expertAccessService, ExpertAccessRequest, ExpertAccessStatus } from "@/lib/services/expertAccessService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<ExpertAccessStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: {
    label: "Pending",
    color: "bg-warning/10 text-warning",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

const ExpertRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ExpertAccessRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch requests based on active tab
  const filterStatus = activeTab === "all" ? undefined : activeTab as ExpertAccessStatus;

  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ["expert-access-requests", filterStatus],
    queryFn: () => expertAccessService.getAllRequests(filterStatus),
  });

  const { data: counts } = useQuery({
    queryKey: ["expert-access-counts"],
    queryFn: () => expertAccessService.getStatusCounts(),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      await expertAccessService.approveRequest(requestId, user?.id || "unknown", notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["expert-access-counts"] });
      toast.success("Request approved successfully");
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve request");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      await expertAccessService.rejectRequest(requestId, user?.id || "unknown", notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["expert-access-counts"] });
      toast.success("Request rejected");
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await expertAccessService.deleteRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["expert-access-counts"] });
      toast.success("Request deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete request");
    },
  });

  const openReviewDialog = (request: ExpertAccessRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const closeDialog = () => {
    setReviewDialogOpen(false);
    setSelectedRequest(null);
    setReviewNotes("");
  };

  const handleReviewSubmit = () => {
    if (!selectedRequest) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({ requestId: selectedRequest.id, notes: reviewNotes || undefined });
    } else {
      rejectMutation.mutate({ requestId: selectedRequest.id, notes: reviewNotes || undefined });
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
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
        <p className="text-destructive">Failed to load requests</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Lock className="h-8 w-8 text-primary" />
            Expert Access Requests
          </h1>
          <p className="text-muted-foreground">
            Review and manage invite-only access requests for Expert features
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.total || 0}</div>
          </CardContent>
        </Card>

        {(Object.entries(STATUS_CONFIG) as [ExpertAccessStatus, typeof STATUS_CONFIG[ExpertAccessStatus]][]).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts?.[status] || 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Requests Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>
            Users who have requested access to Expert coaching features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {(counts?.pending || 0) > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5">
                    {counts?.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No {activeTab !== "all" ? activeTab : ""} requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => {
                        const statusConfig = STATUS_CONFIG[request.status];
                        const StatusIcon = statusConfig.icon;

                        return (
                          <TableRow key={request.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(request.user_name, request.user_email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold">
                                    {request.user_name || request.user_email?.split("@")[0] || "Unknown"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {request.user_email || request.user_id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1", statusConfig.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {getTimeAgo(request.requested_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {request.reviewed_at ? formatDate(request.reviewed_at) : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {request.review_notes || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {request.status === "pending" ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-success hover:text-success hover:bg-success/10"
                                    onClick={() => openReviewDialog(request, "approve")}
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => openReviewDialog(request, "reject")}
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {request.status === "rejected" && (
                                      <DropdownMenuItem
                                        onClick={() => openReviewDialog(request, "approve")}
                                        className="text-success"
                                      >
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                    )}
                                    {request.status === "approved" && (
                                      <DropdownMenuItem
                                        onClick={() => openReviewDialog(request, "reject")}
                                        className="text-destructive"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Revoke Access
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteMutation.mutate(request.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Access Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? `Grant Expert feature access to ${selectedRequest?.user_name || selectedRequest?.user_email}`
                : `Deny Expert feature access to ${selectedRequest?.user_name || selectedRequest?.user_email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(selectedRequest?.user_name, selectedRequest?.user_email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {selectedRequest?.user_name || selectedRequest?.user_email?.split("@")[0]}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedRequest?.user_email}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review Notes (optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === "approve"
                    ? "e.g., Approved - Premium member"
                    : "e.g., Not eligible at this time"
                }
                rows={3}
              />
            </div>

            {reviewAction === "approve" && (
              <div className="p-3 bg-success/10 rounded-lg text-sm border border-success/20">
                <p className="font-medium text-success">Granting Access</p>
                <p className="text-muted-foreground">
                  This user will be able to access Expert coaching features, including
                  connecting with coaches, messaging, and personalized plans.
                </p>
              </div>
            )}

            {reviewAction === "reject" && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm border border-destructive/20">
                <p className="font-medium text-destructive">Denying Access</p>
                <p className="text-muted-foreground">
                  This user will not be able to access Expert coaching features.
                  They can submit a new request in the future.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {reviewAction === "approve" ? "Approve Access" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertRequestsPage;
