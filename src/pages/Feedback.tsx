import { mockFeedback } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Feedback = () => {
  const groupedFeedback = {
    new: mockFeedback.filter(f => f.status === "new"),
    triaged: mockFeedback.filter(f => f.status === "triaged"),
    applied: mockFeedback.filter(f => f.status === "applied"),
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: "bg-success/10 text-success",
      medium: "bg-warning/10 text-warning",
      high: "bg-destructive/10 text-destructive",
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Feedback & Rules</h1>
          <p className="text-muted-foreground">
            Review coach feedback and manage automation rules
          </p>
        </div>
        
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Submit Feedback
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* New Feedback */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New</h2>
            <Badge variant="secondary">{groupedFeedback.new.length}</Badge>
          </div>
          {groupedFeedback.new.length > 0 ? (
            groupedFeedback.new.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm capitalize">
                      {feedback.category.replace("-", " ")}
                    </CardTitle>
                    <Badge className={getSeverityBadge(feedback.severity)}>
                      {feedback.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {feedback.targetName || feedback.targetId}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {feedback.evidence}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{feedback.authorName}</span>
                    <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No new feedback
              </CardContent>
            </Card>
          )}
        </div>

        {/* Triaged */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Triaged</h2>
            <Badge variant="secondary">{groupedFeedback.triaged.length}</Badge>
          </div>
          {groupedFeedback.triaged.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm capitalize">
                    {feedback.category.replace("-", " ")}
                  </CardTitle>
                  <Badge className={getSeverityBadge(feedback.severity)}>
                    {feedback.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedback.targetName || feedback.targetId}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {feedback.proposedFix}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{feedback.authorName}</span>
                  <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applied */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Applied</h2>
            <Badge variant="secondary">{groupedFeedback.applied.length}</Badge>
          </div>
          {groupedFeedback.applied.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow cursor-pointer border-success/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm capitalize">
                    {feedback.category.replace("-", " ")}
                  </CardTitle>
                  <Badge className="bg-success/10 text-success">
                    Applied
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedback.targetName || feedback.targetId}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {feedback.proposedFix}
                </p>
                {feedback.appliedRuleId && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Rule: {feedback.appliedRuleId}
                    </Badge>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{feedback.authorName}</span>
                  <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
