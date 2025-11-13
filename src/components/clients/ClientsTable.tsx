import { Client } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";

interface ClientsTableProps {
  clients: Client[];
  onViewClient: (clientId: string) => void;
}

export const ClientsTable = ({ clients, onViewClient }: ClientsTableProps) => {
  const getRiskBadge = (level: string) => {
    const colors = {
      low: "bg-success/10 text-success hover:bg-success/20",
      medium: "bg-warning/10 text-warning hover:bg-warning/20",
      high: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Archetype</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Adherence 7d</TableHead>
            <TableHead className="text-right">Sleep 7d</TableHead>
            <TableHead className="text-right">HRV 7d</TableHead>
            <TableHead className="text-right">RHR 7d</TableHead>
            <TableHead>Coach</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {client.archetypes[0]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("capitalize", getRiskBadge(client.riskLevel))}>
                  {client.riskLevel}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "font-semibold",
                  client.adherence7d >= 80 ? "text-success" : 
                  client.adherence7d >= 60 ? "text-warning" : "text-destructive"
                )}>
                  {client.adherence7d}%
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "font-medium",
                  client.sleep7dAvg >= 7 ? "text-success" : 
                  client.sleep7dAvg >= 6 ? "text-warning" : "text-destructive"
                )}>
                  {client.sleep7dAvg.toFixed(1)}h
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">{client.hrv7dAvg}</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">{client.rhr7dAvg}</span>
              </TableCell>
              <TableCell>
                <div className="text-sm">{client.assignedCoachName || "—"}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground">{client.lastSyncTime}</div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onViewClient(client.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
