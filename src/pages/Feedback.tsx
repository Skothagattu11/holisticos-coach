import { useState } from "react";
import { mockFeedback } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Feedback as FeedbackType, TicketComment } from "@/types";
import { toast } from "sonner";

const Feedback = () => {
  const [tickets, setTickets] = useState<FeedbackType[]>(mockFeedback);
  const [selectedTicket, setSelectedTicket] = useState<FeedbackType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const [newTicketForm, setNewTicketForm] = useState({
    category: "other" as FeedbackType["category"],
    severity: "medium" as FeedbackType["severity"],
    targetType: "client" as FeedbackType["targetType"],
    targetName: "",
    evidence: "",
    proposedFix: "",
  });

  const filteredTickets = statusFilter === "all" 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { icon: AlertCircle, className: "bg-chart-2/10 text-chart-2" },
      triaged: { icon: Clock, className: "bg-warning/10 text-warning" },
      applied: { icon: CheckCircle2, className: "bg-success/10 text-success" },
      rejected: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
    };
    const config = variants[status as keyof typeof variants] || variants.new;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: "bg-success/10 text-success",
      medium: "bg-warning/10 text-warning",
      high: "bg-destructive/10 text-destructive",
    };
    return <Badge className={colors[severity as keyof typeof colors] || colors.low}>{severity}</Badge>;
  };

  const handleCreateTicket = () => {
    if (!newTicketForm.evidence || !newTicketForm.proposedFix) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newTicket: FeedbackType = {
      id: `f${tickets.length + 1}`,
      authorId: "coach1",
      authorName: "Current User",
      targetType: newTicketForm.targetType,
      targetId: "target-id",
      targetName: newTicketForm.targetName,
      category: newTicketForm.category,
      severity: newTicketForm.severity,
      evidence: newTicketForm.evidence,
      proposedFix: newTicketForm.proposedFix,
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };

    setTickets([newTicket, ...tickets]);
    setCreateDialogOpen(false);
    setNewTicketForm({
      category: "other",
      severity: "medium",
      targetType: "client",
      targetName: "",
      evidence: "",
      proposedFix: "",
    });
    toast.success("Ticket created successfully!");
  };

  const handleAddComment = () => {
    if (!selectedTicket || !newComment.trim()) return;

    const comment: TicketComment = {
      id: `tc${Date.now()}`,
      ticketId: selectedTicket.id,
      authorId: "coach1",
      authorName: "Current User",
      authorRole: "coach",
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString() }
        : t
    );

    setTickets(updatedTickets);
    setSelectedTicket({ ...selectedTicket, comments: [...selectedTicket.comments, comment] });
    setNewComment("");
    toast.success("Comment added");
  };

  const handleUpdateStatus = (status: FeedbackType["status"]) => {
    if (!selectedTicket) return;

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, status, updatedAt: new Date().toISOString() }
        : t
    );

    setTickets(updatedTickets);
    setSelectedTicket({ ...selectedTicket, status });
    toast.success(`Ticket status updated to ${status}`);
  };

  const openTicketDetail = (ticket: FeedbackType) => {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Support Tickets</h1>
          <p className="text-muted-foreground">
            Track and manage client feedback and issues
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>Submit feedback or report an issue</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={newTicketForm.category} 
                    onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-issue">Data Issue</SelectItem>
                      <SelectItem value="plan-mismatch">Plan Mismatch</SelectItem>
                      <SelectItem value="effort-misset">Effort Misset</SelectItem>
                      <SelectItem value="calendar-conflict">Calendar Conflict</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select 
                    value={newTicketForm.severity} 
                    onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Type</Label>
                  <Select 
                    value={newTicketForm.targetType} 
                    onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, targetType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="rule">Rule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Name</Label>
                  <Input
                    value={newTicketForm.targetName}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, targetName: e.target.value })}
                    placeholder="e.g., Client name"
                  />
                </div>
              </div>
              <div>
                <Label>Issue Description</Label>
                <Textarea
                  value={newTicketForm.evidence}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, evidence: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Proposed Solution</Label>
                <Textarea
                  value={newTicketForm.proposedFix}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, proposedFix: e.target.value })}
                  placeholder="Suggest how to resolve this issue..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket}>Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tickets</CardTitle>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="triaged">In Progress</TabsTrigger>
                <TabsTrigger value="applied">Resolved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                    <TableCell>
                      <span className="capitalize">{ticket.category.replace("-", " ")}</span>
                    </TableCell>
                    <TableCell>{ticket.targetName || ticket.targetId}</TableCell>
                    <TableCell>{getSeverityBadge(ticket.severity)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ticket.comments.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openTicketDetail(ticket)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tickets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="font-mono text-sm">#{selectedTicket.id}</span>
                      <span className="capitalize">{selectedTicket.category.replace("-", " ")}</span>
                    </DialogTitle>
                    <DialogDescription>
                      Created by {selectedTicket.authorName} on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {getSeverityBadge(selectedTicket.severity)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Target</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.targetType}: {selectedTicket.targetName || selectedTicket.targetId}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Issue Description</h4>
                  <p className="text-sm">{selectedTicket.evidence}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Proposed Solution</h4>
                  <p className="text-sm">{selectedTicket.proposedFix}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Comments ({selectedTicket.comments.length})</h4>
                    <Select 
                      value={selectedTicket.status} 
                      onValueChange={(value: any) => handleUpdateStatus(value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="triaged">In Progress</SelectItem>
                        <SelectItem value="applied">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 mb-4">
                    {selectedTicket.comments.map((comment) => (
                      <Card key={comment.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{comment.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline">{comment.authorRole}</Badge>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="flex-1"
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feedback;
