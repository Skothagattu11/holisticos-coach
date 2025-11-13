import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityMetric } from "@/types";
import { Flame, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ActivityMetricsProps {
  metrics: ActivityMetric[];
}

export const ActivityMetrics = ({ metrics }: ActivityMetricsProps) => {
  const totalCompletions = metrics.reduce((sum, m) => sum + m.completionCount, 0);
  const avgCompletionRate = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length 
    : 0;
  const longestStreak = Math.max(...metrics.map(m => m.longestStreak), 0);
  const activeStreaks = metrics.filter(m => m.currentStreak > 0).length;

  const sortedByCompletion = [...metrics].sort((a, b) => b.completionCount - a.completionCount);
  const topPerformer = sortedByCompletion[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {totalCompletions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {avgCompletionRate.toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Longest Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              {longestStreak} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-2" />
              {activeStreaks}
            </div>
          </CardContent>
        </Card>
      </div>

      {topPerformer && (
        <Card className="bg-gradient-to-br from-primary/5 to-chart-1/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performed Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{topPerformer.taskName}</h3>
                <Badge variant="default">{topPerformer.completionCount} completions</Badge>
              </div>
              <Progress value={topPerformer.completionRate} className="h-2" />
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Rate: {topPerformer.completionRate}%</span>
                <span>Current Streak: {topPerformer.currentStreak} days</span>
                <span>Best: {topPerformer.longestStreak} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Task Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity data available yet</p>
            ) : (
              metrics.map((metric) => (
                <div key={metric.taskId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{metric.taskName}</div>
                      <div className="text-sm text-muted-foreground">
                        Last completed: {new Date(metric.lastCompletedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground">Completions</div>
                        <div className="font-semibold">{metric.completionCount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-semibold flex items-center gap-1">
                          {metric.currentStreak > 0 && <Flame className="h-3 w-3 text-warning" />}
                          {metric.currentStreak}d
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Best</div>
                        <div className="font-semibold">{metric.longestStreak}d</div>
                      </div>
                    </div>
                  </div>
                  <Progress value={metric.completionRate} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {metric.completionRate}% completion rate
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
