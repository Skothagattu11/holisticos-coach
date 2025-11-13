import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIn } from "@/types";
import { MessageSquare, Weight, TrendingUp, Mail } from "lucide-react";
import { CheckInDialog } from "./CheckInDialog";

interface CheckInListProps {
  checkIns: CheckIn[];
  onSendMessage: (checkInId: string, message: string) => void;
}

export const CheckInList = ({ checkIns, onSendMessage }: CheckInListProps) => {
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenCheckIn = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {checkIns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No check-ins recorded yet</p>
            </CardContent>
          </Card>
        ) : (
          checkIns.map((checkIn) => (
            <Card 
              key={checkIn.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleOpenCheckIn(checkIn)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {new Date(checkIn.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {checkIn.hasUnreadMessages && (
                        <Badge variant="destructive" className="ml-2 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          New
                        </Badge>
                      )}
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {checkIn.progressNotes}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{checkIn.messages.length} message{checkIn.messages.length !== 1 ? 's' : ''}</span>
                  <span>Click to view conversation</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CheckInDialog
        checkIn={selectedCheckIn}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSendMessage={onSendMessage}
      />
    </>
  );
};
