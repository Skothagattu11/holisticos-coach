import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoutineBlock } from "@/types";
import { Pencil, Trash2, MapPin } from "lucide-react";

interface RoutineCardProps {
  routine: RoutineBlock;
  onEdit: (routine: RoutineBlock) => void;
  onDelete: (id: string) => void;
}

export const RoutineCard = ({ routine, onEdit, onDelete }: RoutineCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{routine.title}</h4>
              <Badge variant="outline" className="capitalize">
                {routine.type}
              </Badge>
              <Badge
                variant={
                  routine.effort === "high"
                    ? "destructive"
                    : routine.effort === "medium"
                    ? "default"
                    : "secondary"
                }
              >
                {routine.effort} effort
              </Badge>
              <Badge
                variant={
                  routine.status === "completed"
                    ? "default"
                    : routine.status === "skipped"
                    ? "destructive"
                    : "outline"
                }
                className="capitalize"
              >
                {routine.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {new Date(routine.start).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              -{" "}
              {new Date(routine.end).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
            {routine.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                {routine.location}
              </div>
            )}
            {routine.notes && (
              <div className="text-sm bg-muted/50 p-3 rounded mt-2">
                <div className="font-medium mb-1">Purpose:</div>
                {routine.notes}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(routine)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(routine.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
