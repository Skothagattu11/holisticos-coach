import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckIn } from "@/types";
import { MessageSquare, Weight, TrendingUp, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CheckInDialogProps {
  checkIn: CheckIn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (checkInId: string, message: string) => void;
}

export const CheckInDialog = ({ checkIn, open, onOpenChange, onSendMessage }: CheckInDialogProps) => {
  const [message, setMessage] = useState("");

  if (!checkIn) return null;

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    onSendMessage(checkIn.id, message);
    setMessage("");
    toast.success("Message sent");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {new Date(checkIn.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </DialogTitle>
            </div>
            <Badge variant={checkIn.type === "daily" ? "default" : "secondary"}>
              {checkIn.type}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
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

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {checkIn.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1",
                  msg.senderRole === "coach" ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 whitespace-pre-wrap",
                    msg.senderRole === "coach"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your response..."
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
