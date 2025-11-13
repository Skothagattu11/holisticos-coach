import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardWidget } from "@/types";

interface MetricCardProps {
  widget: DashboardWidget;
}

export const MetricCard = ({ widget }: MetricCardProps) => {
  const getTrendIcon = () => {
    if (!widget.trend) return null;
    
    switch (widget.trend) {
      case "up":
        return <ArrowUp className="h-4 w-4" />;
      case "down":
        return <ArrowDown className="h-4 w-4" />;
      case "neutral":
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!widget.trend) return "";
    
    switch (widget.trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      case "neutral":
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {widget.title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {widget.value}
            </p>
            {widget.subtitle && (
              <p className="text-xs text-muted-foreground">
                {widget.subtitle}
              </p>
            )}
          </div>
          
          {widget.change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(widget.change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
