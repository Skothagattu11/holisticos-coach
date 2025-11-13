import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { RoutineBlock } from "@/types";
import { cn } from "@/lib/utils";
import { DayContentProps } from "react-day-picker";

interface RoutineCalendarProps {
  routines: RoutineBlock[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const RoutineCalendar = ({ routines, selectedDate, onDateSelect }: RoutineCalendarProps) => {
  // Get dates that have routines
  const datesWithRoutines = new Map<string, number>();
  routines.forEach(routine => {
    const dateKey = new Date(routine.start).toDateString();
    datesWithRoutines.set(dateKey, (datesWithRoutines.get(dateKey) || 0) + 1);
  });

  // Custom day content with dots for dates with routines
  const DayContent = (props: DayContentProps) => {
    const dateKey = props.date.toDateString();
    const count = datesWithRoutines.get(dateKey) || 0;
    const hasRoutines = count > 0;

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{props.date.getDate()}</span>
        {hasRoutines && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-primary" />
            {count > 1 && <div className="w-1 h-1 rounded-full bg-primary" />}
            {count > 2 && <div className="w-1 h-1 rounded-full bg-primary" />}
          </div>
        )}
      </div>
    );
  };

  // Get routines for selected date
  const selectedDateRoutines = routines
    .filter(routine => new Date(routine.start).toDateString() === selectedDate.toDateString())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            className="rounded-md border w-full p-3 pointer-events-auto"
            components={{
              DayContent
            }}
            modifiers={{
              hasRoutines: (date) => datesWithRoutines.has(date.toDateString())
            }}
            modifiersClassNames={{
              hasRoutines: "font-semibold"
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDateRoutines.length} {selectedDateRoutines.length === 1 ? 'routine' : 'routines'} scheduled
              </p>
            </div>

            {selectedDateRoutines.length > 0 ? (
              <div className="space-y-3">
                {selectedDateRoutines.map((routine) => (
                  <div 
                    key={routine.id} 
                    className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{routine.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(routine.start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                          {' - '}
                          {new Date(routine.end).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {routine.type}
                        </Badge>
                        <Badge 
                          variant={
                            routine.effort === "high" ? "destructive" : 
                            routine.effort === "medium" ? "default" : 
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {routine.effort}
                        </Badge>
                      </div>
                    </div>
                    {routine.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {routine.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No routines scheduled
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Legend</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                </div>
                <span className="text-muted-foreground">Has routines</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
