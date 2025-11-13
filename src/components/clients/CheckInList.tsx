import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckIn } from "@/types";
import { MessageSquare, TrendingUp, Weight } from "lucide-react";
import { toast } from "sonner";

interface CheckInListProps {
  checkIns: CheckIn[];
  onReply: (checkInId: string, response: string) => void;
}

export const CheckInList = ({ checkIns, onReply }: CheckInListProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReply = (checkInId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    onReply(checkInId, replyText);
    setReplyText("");
    setReplyingTo(null);
    toast.success("Response sent");
  };

  return (
    <div className="space-y-4">
      {checkIns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No check-ins recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        checkIns.map((checkIn) => (
          <Card key={checkIn.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {new Date(checkIn.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </div>
                <Badge variant={checkIn.type === "daily" ? "default" : "secondary"}>
                  {checkIn.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {checkIn.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Weight</div>
                      <div className="font-semibold">{checkIn.weight} kg</div>
                    </div>
                  </div>
                )}
                {checkIn.mood && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Mood</div>
                      <div className="font-semibold">{checkIn.mood}/10</div>
                    </div>
                  </div>
                )}
                {checkIn.energy && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Energy</div>
                      <div className="font-semibold">{checkIn.energy}/10</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Progress Notes:</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {checkIn.progressNotes}
                </p>
              </div>

              {checkIn.coachResponse && (
                <div className="border-l-2 border-primary pl-4 bg-muted/50 p-3 rounded">
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">
                    Coach Response
                    {checkIn.coachRespondedAt && (
                      <span className="text-xs text-muted-foreground font-normal">
                        • {new Date(checkIn.coachRespondedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {checkIn.coachResponse}
                  </p>
                </div>
              )}

              {!checkIn.coachResponse && (
                <div>
                  {replyingTo === checkIn.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(checkIn.id)}>
                          Send Response
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setReplyingTo(checkIn.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Reply
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
