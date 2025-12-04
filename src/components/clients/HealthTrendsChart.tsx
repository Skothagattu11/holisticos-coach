/**
 * HealthTrendsChart Component
 * Visualizes health metrics over time with line/area charts
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus, Heart, Moon, Flame, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  whoopDataService,
  type WhoopRecoveryRecord,
  type WhoopSleepRecord,
  type WhoopCycleRecord,
} from "@/lib/services/healthDataService";

interface HealthTrendsChartProps {
  userId: string;
}

interface TrendData {
  date: string;
  displayDate: string;
  recovery?: number;
  hrv?: number;
  rhr?: number;
  sleepDuration?: number;
  sleepPerformance?: number;
  strain?: number;
}

// Calculate trend direction and percentage
const calculateTrend = (data: number[]): { direction: "up" | "down" | "neutral"; percentage: number } => {
  if (data.length < 2) return { direction: "neutral", percentage: 0 };

  const recent = data.slice(-3);
  const earlier = data.slice(0, 3);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  if (earlierAvg === 0) return { direction: "neutral", percentage: 0 };

  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

  return {
    direction: change > 2 ? "up" : change < -2 ? "down" : "neutral",
    percentage: Math.abs(Math.round(change)),
  };
};

// Format milliseconds to hours
const msToHours = (ms: number): number => {
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
};

export const HealthTrendsChart = ({ userId }: HealthTrendsChartProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<"recovery" | "sleep" | "strain" | "hrv">("recovery");

  useEffect(() => {
    const fetchTrendData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch all available data (max 5 records per type from API)
        const data = await whoopDataService.fetchAll(userId, 5);

        if (data.recovery.length === 0 && data.sleep.length === 0 && data.cycle.length === 0) {
          setError("No health data available for trends");
          setLoading(false);
          return;
        }

        // Combine data by date
        const dateMap = new Map<string, TrendData>();

        // Process recovery data
        data.recovery.forEach((r: WhoopRecoveryRecord) => {
          const date = r.created_at.split("T")[0];
          const existing = dateMap.get(date) || { date, displayDate: "" };
          dateMap.set(date, {
            ...existing,
            date,
            displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            recovery: r.score?.recovery_score,
            hrv: r.score?.hrv_rmssd_milli,
            rhr: r.score?.resting_heart_rate,
          });
        });

        // Process sleep data
        data.sleep.forEach((s: WhoopSleepRecord) => {
          if (s.nap) return; // Skip naps
          const date = s.start.split("T")[0];
          const existing = dateMap.get(date) || { date, displayDate: "" };
          dateMap.set(date, {
            ...existing,
            date,
            displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            sleepDuration: msToHours(s.score?.stage_summary?.total_in_bed_time_milli || 0),
            sleepPerformance: s.score?.sleep_performance_percentage,
          });
        });

        // Process cycle (strain) data
        data.cycle.forEach((c: WhoopCycleRecord) => {
          const date = c.start.split("T")[0];
          const existing = dateMap.get(date) || { date, displayDate: "" };
          dateMap.set(date, {
            ...existing,
            date,
            displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            strain: c.score?.strain,
          });
        });

        // Sort by date ascending
        const sortedData = Array.from(dateMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setTrendData(sortedData);
      } catch (err) {
        console.error("[HealthTrendsChart] Error fetching data:", err);
        setError("Failed to load health trends");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Trend Data</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">User ID: {userId}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trends for summary cards
  const recoveryTrend = calculateTrend(trendData.map((d) => d.recovery || 0).filter(Boolean));
  const sleepTrend = calculateTrend(trendData.map((d) => d.sleepPerformance || 0).filter(Boolean));
  const strainTrend = calculateTrend(trendData.map((d) => d.strain || 0).filter(Boolean));
  const hrvTrend = calculateTrend(trendData.map((d) => d.hrv || 0).filter(Boolean));

  // Get averages
  const avgRecovery = trendData.filter((d) => d.recovery).length > 0
    ? Math.round(trendData.reduce((sum, d) => sum + (d.recovery || 0), 0) / trendData.filter((d) => d.recovery).length)
    : null;
  const avgSleep = trendData.filter((d) => d.sleepDuration).length > 0
    ? (trendData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / trendData.filter((d) => d.sleepDuration).length).toFixed(1)
    : null;
  const avgStrain = trendData.filter((d) => d.strain).length > 0
    ? (trendData.reduce((sum, d) => sum + (d.strain || 0), 0) / trendData.filter((d) => d.strain).length).toFixed(1)
    : null;
  const avgHrv = trendData.filter((d) => d.hrv).length > 0
    ? Math.round(trendData.reduce((sum, d) => sum + (d.hrv || 0), 0) / trendData.filter((d) => d.hrv).length)
    : null;

  const TrendIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
    if (direction === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Trend Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card
          className={cn(
            "cursor-pointer transition-all",
            selectedMetric === "recovery" && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric("recovery")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div className="flex items-center gap-1">
                <TrendIcon direction={recoveryTrend.direction} />
                <span className="text-xs text-muted-foreground">{recoveryTrend.percentage}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{avgRecovery ?? "—"}%</p>
            <p className="text-xs text-muted-foreground">Avg Recovery</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            selectedMetric === "sleep" && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric("sleep")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Moon className="h-5 w-5 text-blue-500" />
              <div className="flex items-center gap-1">
                <TrendIcon direction={sleepTrend.direction} />
                <span className="text-xs text-muted-foreground">{sleepTrend.percentage}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{avgSleep ?? "—"}h</p>
            <p className="text-xs text-muted-foreground">Avg Sleep</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            selectedMetric === "strain" && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric("strain")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div className="flex items-center gap-1">
                <TrendIcon direction={strainTrend.direction} />
                <span className="text-xs text-muted-foreground">{strainTrend.percentage}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{avgStrain ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Avg Strain</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            selectedMetric === "hrv" && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric("hrv")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div className="flex items-center gap-1">
                <TrendIcon direction={hrvTrend.direction} />
                <span className="text-xs text-muted-foreground">{hrvTrend.percentage}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{avgHrv ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Avg HRV (ms)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedMetric === "recovery" && "Recovery Trend"}
                {selectedMetric === "sleep" && "Sleep Trend"}
                {selectedMetric === "strain" && "Strain Trend"}
                {selectedMetric === "hrv" && "HRV Trend"}
              </CardTitle>
              <CardDescription>Last {trendData.length} days of data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === "recovery" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("recovery")}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedMetric === "sleep" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("sleep")}
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedMetric === "strain" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("strain")}
              >
                <Flame className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedMetric === "hrv" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("hrv")}
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === "recovery" ? (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="recovery"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    fill="url(#recoveryGradient)"
                    dot={{ fill: "hsl(0, 84%, 60%)", strokeWidth: 0 }}
                    name="Recovery %"
                  />
                </AreaChart>
              ) : selectedMetric === "sleep" ? (
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="left" domain={[0, 12]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sleepDuration" fill="hsl(221, 83%, 53%)" opacity={0.5} name="Duration (hrs)" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sleepPerformance"
                    stroke="hsl(262, 83%, 58%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(262, 83%, 58%)", strokeWidth: 0 }}
                    name="Performance %"
                  />
                </ComposedChart>
              ) : selectedMetric === "strain" ? (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 21]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="strain"
                    stroke="hsl(25, 95%, 53%)"
                    strokeWidth={2}
                    fill="url(#strainGradient)"
                    dot={{ fill: "hsl(25, 95%, 53%)", strokeWidth: 0 }}
                    name="Strain"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="hrvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hrv"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    fill="url(#hrvGradient)"
                    dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 0 }}
                    name="HRV (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="rhr"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="RHR (bpm)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Data</CardTitle>
          <CardDescription>Raw metrics by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Date</th>
                  <th className="text-center py-2 px-3 font-medium">Recovery</th>
                  <th className="text-center py-2 px-3 font-medium">HRV</th>
                  <th className="text-center py-2 px-3 font-medium">RHR</th>
                  <th className="text-center py-2 px-3 font-medium">Sleep</th>
                  <th className="text-center py-2 px-3 font-medium">Strain</th>
                </tr>
              </thead>
              <tbody>
                {trendData.slice().reverse().map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3">{day.displayDate}</td>
                    <td className="text-center py-2 px-3">
                      {day.recovery ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            day.recovery >= 70 && "text-green-500 border-green-500/30",
                            day.recovery >= 40 && day.recovery < 70 && "text-yellow-500 border-yellow-500/30",
                            day.recovery < 40 && "text-red-500 border-red-500/30"
                          )}
                        >
                          {day.recovery}%
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-center py-2 px-3 font-mono">{day.hrv?.toFixed(0) ?? "—"}</td>
                    <td className="text-center py-2 px-3 font-mono">{day.rhr ?? "—"}</td>
                    <td className="text-center py-2 px-3 font-mono">{day.sleepDuration ? `${day.sleepDuration}h` : "—"}</td>
                    <td className="text-center py-2 px-3 font-mono">{day.strain?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
