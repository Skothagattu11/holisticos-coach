import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  Moon,
  Heart,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sun,
  TrendingUp,
  Brain,
  Watch,
  Flame,
  Clock,
  Wind,
  ThermometerSun,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import {
  whoopDataService,
  type WhoopRecoveryRecord,
  type WhoopSleepRecord,
  type WhoopCycleRecord,
  type WhoopWorkoutRecord,
} from "@/lib/services/healthDataService";
import { HealthTrendsChart } from "./HealthTrendsChart";

interface HealthMetricsTabProps {
  clientId: string;
  userId: string;
}

// Circular progress component for health scores
const CircularProgress = ({
  score,
  color,
  size = 90,
}: {
  score: number;
  color: string;
  size?: number;
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        className="transition-all duration-500"
      />
    </svg>
  );
};

// Get color based on score
const getScoreColor = (score: number) => {
  if (score >= 70) return "hsl(142, 76%, 36%)"; // Green
  if (score >= 40) return "hsl(48, 96%, 53%)"; // Yellow
  return "hsl(0, 84%, 60%)"; // Red
};

// Format milliseconds to hours and minutes
const formatDuration = (ms: number | null | undefined): string => {
  if (!ms) return "—";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Format date string
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const HealthMetricsTab = ({ clientId, userId }: HealthMetricsTabProps) => {
  const [activeMainTab, setActiveMainTab] = useState<"analysis" | "health-data">("analysis");
  const [activeHealthTab, setActiveHealthTab] = useState<"whoop" | "oura" | "trends">("whoop");

  // Shared date state for both tabs
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // AI Analysis state
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(true);
  const [takeawaysExpanded, setTakeawaysExpanded] = useState(true);
  const [approachExpanded, setApproachExpanded] = useState(true);
  const [availableAnalysisDates, setAvailableAnalysisDates] = useState<string[]>([]);

  // Whoop data state - stores all fetched data
  const [allWhoopRecovery, setAllWhoopRecovery] = useState<WhoopRecoveryRecord[]>([]);
  const [allWhoopSleep, setAllWhoopSleep] = useState<WhoopSleepRecord[]>([]);
  const [allWhoopCycle, setAllWhoopCycle] = useState<WhoopCycleRecord[]>([]);
  const [allWhoopWorkout, setAllWhoopWorkout] = useState<WhoopWorkoutRecord[]>([]);
  const [loadingWhoop, setLoadingWhoop] = useState(false);
  const [whoopError, setWhoopError] = useState<string | null>(null);
  const [availableWhoopDates, setAvailableWhoopDates] = useState<string[]>([]);

  // Fetch available dates on mount and set initial date
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!userId) return;

      try {
        console.log('[HealthMetricsTab] Fetching available dates for:', userId);
        const plans = await coachService.fetchRecentDailyPlans(userId, 30);
        const dates = plans.map((p: any) => p.date);
        console.log('[HealthMetricsTab] Available analysis dates:', dates);
        setAvailableAnalysisDates(dates);

        // Auto-select the most recent date with data
        if (dates.length > 0) {
          setSelectedDate(new Date(dates[0] + 'T00:00:00'));
        }
      } catch (error) {
        console.error('[HealthMetricsTab] Error fetching available dates:', error);
      }
    };

    fetchAvailableDates();
  }, [userId]);

  // Fetch daily plan when selected date changes
  useEffect(() => {
    const fetchDailyPlan = async () => {
      if (!userId) return;

      setLoadingPlan(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        console.log('[HealthMetricsTab] Fetching plan for date:', dateStr);
        const plan = await coachService.fetchDailyPlan(userId, dateStr);
        console.log('[HealthMetricsTab] Daily plan:', plan);
        setDailyPlan(plan);
      } catch (error) {
        console.error('[HealthMetricsTab] Error fetching daily plan:', error);
        setDailyPlan(null);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchDailyPlan();
  }, [userId, selectedDate]);

  // Fetch Whoop data when health-data tab is active
  useEffect(() => {
    if (activeMainTab !== "health-data" || activeHealthTab !== "whoop") return;

    const fetchWhoopData = async () => {
      if (!userId) return;

      setLoadingWhoop(true);
      setWhoopError(null);

      try {
        console.log('[HealthMetricsTab] Fetching Whoop data for:', userId);
        const data = await whoopDataService.fetchAll(userId, 5);
        console.log('[HealthMetricsTab] Whoop data:', data);

        setAllWhoopRecovery(data.recovery);
        setAllWhoopSleep(data.sleep);
        setAllWhoopCycle(data.cycle);
        setAllWhoopWorkout(data.workout);

        // Extract available dates from the data
        const dates = new Set<string>();
        data.recovery.forEach(r => dates.add(r.created_at.split('T')[0]));
        data.sleep.forEach(s => dates.add(s.start.split('T')[0]));
        data.cycle.forEach(c => dates.add(c.start.split('T')[0]));

        const sortedDates = Array.from(dates).sort().reverse();
        setAvailableWhoopDates(sortedDates);

        // Note: Date is controlled by the shared date navigator

        if (data.recovery.length === 0 && data.sleep.length === 0) {
          setWhoopError("No Whoop data found for this user");
        }
      } catch (error) {
        console.error('[HealthMetricsTab] Error fetching Whoop data:', error);
        setWhoopError("Failed to fetch Whoop data");
      } finally {
        setLoadingWhoop(false);
      }
    };

    fetchWhoopData();
  }, [userId, activeMainTab, activeHealthTab]);

  // Refresh Whoop data
  const refreshWhoopData = async () => {
    if (!userId) return;

    setLoadingWhoop(true);
    setWhoopError(null);

    try {
      const data = await whoopDataService.fetchAll(userId, 5);
      setAllWhoopRecovery(data.recovery);
      setAllWhoopSleep(data.sleep);
      setAllWhoopCycle(data.cycle);
      setAllWhoopWorkout(data.workout);

      // Extract available dates
      const dates = new Set<string>();
      data.recovery.forEach(r => dates.add(r.created_at.split('T')[0]));
      data.sleep.forEach(s => dates.add(s.start.split('T')[0]));
      data.cycle.forEach(c => dates.add(c.start.split('T')[0]));
      setAvailableWhoopDates(Array.from(dates).sort().reverse());
    } catch (error) {
      console.error('[HealthMetricsTab] Error refreshing Whoop data:', error);
      setWhoopError("Failed to refresh Whoop data");
    } finally {
      setLoadingWhoop(false);
    }
  };

  // Filter Whoop data by selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const filteredRecovery = allWhoopRecovery.find(
    r => r.created_at.split('T')[0] === selectedDateStr
  );
  const filteredSleep = allWhoopSleep.find(
    s => s.start.split('T')[0] === selectedDateStr
  );
  const filteredCycle = allWhoopCycle.find(
    c => c.start.split('T')[0] === selectedDateStr
  );
  const filteredWorkouts = allWhoopWorkout.filter(
    w => w.start.split('T')[0] === selectedDateStr
  );

  // Date navigation functions (shared for both tabs)
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const hasWhoopDataForDate = filteredRecovery || filteredSleep || filteredCycle;
  const hasAnalysisForDate = availableAnalysisDates.includes(selectedDateStr);

  // Get urgency color
  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    }
  };

  // Parse agent1 response
  const agent1Response = dailyPlan?.agent1_response;
  const healthAnalysis = agent1Response?.health_analysis || {};
  const healthInsights = agent1Response?.health_insights;
  const userGuidance = agent1Response?.user_guidance || {};

  return (
    <div className="space-y-6">
      {/* Shared Date Navigator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-xs"
                disabled={isToday}
              >
                Today
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {hasAnalysisForDate && (
                    <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/30">
                      <Brain className="h-3 w-3 mr-1" />
                      Analysis
                    </Badge>
                  )}
                  {hasWhoopDataForDate && (
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                      <Watch className="h-3 w-3 mr-1" />
                      WHOOP
                    </Badge>
                  )}
                  {!hasAnalysisForDate && !hasWhoopDataForDate && !loadingPlan && !loadingWhoop && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      No data
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              disabled={isToday}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as "analysis" | "health-data")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="health-data" className="gap-2">
            <Watch className="h-4 w-4" />
            Health Data
          </TabsTrigger>
        </TabsList>

        {/* ===== AI ANALYSIS TAB ===== */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          {loadingPlan ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !dailyPlan ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No AI Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  No daily plan analysis available for this date.
                </p>
                {availableAnalysisDates.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Available dates with analysis:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {availableAnalysisDates.slice(0, 5).map((date) => (
                        <Button
                          key={date}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date(date + 'T00:00:00'))}
                          className="text-xs"
                        >
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>

              {/* Health Analysis Section */}
              {healthAnalysis && Object.keys(healthAnalysis).length > 0 && (
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setAnalysisExpanded(!analysisExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Health Analysis</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {healthAnalysis.urgency_level && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "uppercase text-xs",
                              getUrgencyColor(healthAnalysis.urgency_level)
                            )}
                          >
                            {healthAnalysis.urgency_level}
                          </Badge>
                        )}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            analysisExpanded && "rotate-90"
                          )}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {analysisExpanded && (
                    <CardContent className="space-y-4">
                      {healthAnalysis.overall_assessment && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                          <p className="text-sm">
                            {healthAnalysis.overall_assessment
                              .replace(/User is/g, "Client is")
                              .replace(/User has/g, "Client has")
                              .replace(/User's/g, "Client's")
                              .replace(/user is/g, "client is")
                              .replace(/user has/g, "client has")
                              .replace(/user's/g, "client's")}
                          </p>
                        </div>
                      )}

                      {healthAnalysis.patterns_detected && healthAnalysis.patterns_detected.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Patterns Detected</p>
                          <ul className="space-y-1">
                            {healthAnalysis.patterns_detected.map((pattern: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-primary">•</span>
                                <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {healthAnalysis.red_flags && healthAnalysis.red_flags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-500 mb-2">Red Flags</p>
                          <ul className="space-y-1">
                            {healthAnalysis.red_flags.map((flag: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {healthAnalysis.positive_trends && healthAnalysis.positive_trends.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-500 mb-2">Positive Trends</p>
                          <ul className="space-y-1">
                            {healthAnalysis.positive_trends.map((trend: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{trend}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Key Takeaways Section */}
              {healthInsights && (
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setTakeawaysExpanded(!takeawaysExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Key Takeaways</CardTitle>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          takeawaysExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </CardHeader>
                  {takeawaysExpanded && (
                    <CardContent className="space-y-3">
                      {typeof healthInsights === "string" ? (
                        <p className="text-sm">{healthInsights}</p>
                      ) : (
                        <>
                          {healthInsights.what_improved && (
                            <p className="text-sm">{healthInsights.what_improved}</p>
                          )}
                          {healthInsights.what_concerns && (
                            <p className="text-sm">{healthInsights.what_concerns}</p>
                          )}
                          {healthInsights.notable_insights && (
                            <p className="text-sm">{healthInsights.notable_insights}</p>
                          )}
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Today's Approach Section */}
              {userGuidance && Object.keys(userGuidance).length > 0 && (
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setApproachExpanded(!approachExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-base">Today's Approach</CardTitle>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          approachExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </CardHeader>
                  {approachExpanded && (
                    <CardContent className="space-y-4">
                      {userGuidance.today_approach && (
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="text-sm">{userGuidance.today_approach}</p>
                        </div>
                      )}

                      {userGuidance.morning_message && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Morning Message</span>
                          </div>
                          <p className="text-sm">{userGuidance.morning_message}</p>
                        </div>
                      )}

                      {userGuidance.encouragement && (
                        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs font-medium text-muted-foreground">Encouragement</span>
                          </div>
                          <p className="text-sm">{userGuidance.encouragement}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Protocol Info */}
              {dailyPlan.protocol_name && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Protocol Selection</CardTitle>
                    <CardDescription>AI-selected protocol based on health data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Primary Protocol</p>
                        <Badge className="mt-1">{dailyPlan.protocol_name}</Badge>
                      </div>
                      {dailyPlan.protocol_secondary && (
                        <div>
                          <p className="text-sm text-muted-foreground">Secondary</p>
                          <Badge variant="outline" className="mt-1">{dailyPlan.protocol_secondary}</Badge>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="font-mono font-bold mt-1">
                          {Math.round((dailyPlan.confidence_score || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                    {dailyPlan.reasoning && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Reasoning</p>
                        <p className="text-sm">{dailyPlan.reasoning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Energy Zone */}
              {dailyPlan.energy_zone && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            dailyPlan.energy_zone === "green" && "bg-green-500",
                            dailyPlan.energy_zone === "yellow" && "bg-yellow-500",
                            dailyPlan.energy_zone === "red" && "bg-red-500"
                          )}
                        />
                        <div>
                          <p className="font-medium capitalize">{dailyPlan.energy_zone} Energy Zone</p>
                          <p className="text-sm text-muted-foreground">
                            {dailyPlan.energy_zone === "green"
                              ? "High energy - optimal for challenging tasks"
                              : dailyPlan.energy_zone === "yellow"
                              ? "Moderate energy - balanced activity recommended"
                              : "Low energy - focus on recovery"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          dailyPlan.energy_zone === "green" && "bg-green-500/10 text-green-500 border-green-500/30",
                          dailyPlan.energy_zone === "yellow" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
                          dailyPlan.energy_zone === "red" && "bg-red-500/10 text-red-500 border-red-500/30"
                        )}
                        variant="outline"
                      >
                        {dailyPlan.total_duration_minutes
                          ? `${dailyPlan.total_duration_minutes} min planned`
                          : "Duration varies"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ===== HEALTH DATA TAB ===== */}
        <TabsContent value="health-data" className="space-y-4 mt-4">
          {/* Health Data Sub-tabs */}
          <Tabs value={activeHealthTab} onValueChange={(v) => setActiveHealthTab(v as "whoop" | "oura" | "trends")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="whoop" className="gap-2">
                <Watch className="h-4 w-4" />
                WHOOP
              </TabsTrigger>
              <TabsTrigger value="oura" className="gap-2">
                <Activity className="h-4 w-4" />
                Oura
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trends
              </TabsTrigger>
            </TabsList>

            {/* ===== WHOOP TAB ===== */}
            <TabsContent value="whoop" className="space-y-4 mt-4">
              {loadingWhoop ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : whoopError ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No WHOOP Data</h3>
                    <p className="text-muted-foreground text-sm">{whoopError}</p>
                    <p className="text-xs text-muted-foreground mt-2">User ID: {userId}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Score Cards */}
                  <div className="grid gap-4 grid-cols-3">
                    {/* Recovery Score */}
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <div className="relative inline-flex items-center justify-center">
                          <CircularProgress
                            score={filteredRecovery?.score?.recovery_score || 0}
                            color={getScoreColor(filteredRecovery?.score?.recovery_score || 0)}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Heart className="h-5 w-5 mb-1" style={{ color: getScoreColor(filteredRecovery?.score?.recovery_score || 0) }} />
                            <span className="text-xl font-bold font-mono" style={{ color: getScoreColor(filteredRecovery?.score?.recovery_score || 0) }}>
                              {filteredRecovery?.score?.recovery_score || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recovery</p>
                          {filteredRecovery && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(filteredRecovery.created_at)}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sleep Score */}
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <div className="relative inline-flex items-center justify-center">
                          <CircularProgress
                            score={filteredSleep?.score?.sleep_performance_percentage || 0}
                            color={getScoreColor(filteredSleep?.score?.sleep_performance_percentage || 0)}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Moon className="h-5 w-5 mb-1" style={{ color: getScoreColor(filteredSleep?.score?.sleep_performance_percentage || 0) }} />
                            <span className="text-xl font-bold font-mono" style={{ color: getScoreColor(filteredSleep?.score?.sleep_performance_percentage || 0) }}>
                              {filteredSleep?.score?.sleep_performance_percentage || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sleep</p>
                          {filteredSleep && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDuration(filteredSleep.score?.stage_summary?.total_in_bed_time_milli)}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Strain Score */}
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <div className="relative inline-flex items-center justify-center">
                          <CircularProgress
                            score={Math.min(100, (filteredCycle?.score?.strain || 0) * 4.76)}
                            color={getScoreColor(Math.min(100, (filteredCycle?.score?.strain || 0) * 4.76))}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Flame className="h-5 w-5 mb-1" style={{ color: getScoreColor(Math.min(100, (filteredCycle?.score?.strain || 0) * 4.76)) }} />
                            <span className="text-xl font-bold font-mono" style={{ color: getScoreColor(Math.min(100, (filteredCycle?.score?.strain || 0) * 4.76)) }}>
                              {filteredCycle?.score?.strain?.toFixed(1) || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Strain</p>
                          {filteredCycle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(filteredCycle.start)}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recovery Details */}
                  {filteredRecovery && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          Recovery Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <Activity className="h-5 w-5 mx-auto mb-1 text-green-500" />
                            <p className="text-xl font-bold font-mono">
                              {filteredRecovery.score?.hrv_rmssd_milli?.toFixed(0) || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">HRV (ms)</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                            <p className="text-xl font-bold font-mono">
                              {filteredRecovery.score?.resting_heart_rate || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">RHR (bpm)</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <Wind className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                            <p className="text-xl font-bold font-mono">
                              {filteredRecovery.score?.spo2_percentage || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">SpO2 (%)</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <ThermometerSun className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                            <p className="text-xl font-bold font-mono">
                              {filteredRecovery.score?.skin_temp_celsius?.toFixed(1) || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Skin Temp (°C)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Sleep Details */}
                  {filteredSleep && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Moon className="h-5 w-5 text-blue-500" />
                          Sleep Details
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(filteredSleep.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {' → '}
                            {new Date(filteredSleep.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {filteredSleep.nap && <Badge variant="outline" className="text-xs">Nap</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Sleep Stages */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sleep Stages</p>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_in_bed_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">Total In Bed</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Moon className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_slow_wave_sleep_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">Deep (SWS)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_rem_sleep_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">REM</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Moon className="h-4 w-4 mx-auto mb-1 text-sky-400" />
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_light_sleep_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">Light</p>
                            </div>
                          </div>
                        </div>

                        {/* Sleep Quality */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sleep Quality</p>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono" style={{ color: getScoreColor(filteredSleep.score?.sleep_performance_percentage || 0) }}>
                                {filteredSleep.score?.sleep_performance_percentage || "—"}%
                              </p>
                              <p className="text-xs text-muted-foreground">Performance</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono">
                                {filteredSleep.score?.sleep_efficiency_percentage || "—"}%
                              </p>
                              <p className="text-xs text-muted-foreground">Efficiency</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono">
                                {filteredSleep.score?.sleep_consistency_percentage || "—"}%
                              </p>
                              <p className="text-xs text-muted-foreground">Consistency</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Wind className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                              <p className="text-xl font-bold font-mono">
                                {filteredSleep.score?.respiratory_rate?.toFixed(1) || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Resp Rate</p>
                            </div>
                          </div>
                        </div>

                        {/* Sleep Disruptions */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Disruptions & Cycles</p>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono">
                                {filteredSleep.score?.stage_summary?.sleep_cycle_count || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Sleep Cycles</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono">
                                {filteredSleep.score?.stage_summary?.disturbance_count || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Disturbances</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_awake_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">Awake Time</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.stage_summary?.total_no_data_time_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">No Data</p>
                            </div>
                          </div>
                        </div>

                        {/* Sleep Need */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sleep Need Analysis</p>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.sleep_needed?.baseline_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">Baseline Need</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.sleep_needed?.need_from_sleep_debt_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">From Sleep Debt</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.sleep_needed?.need_from_recent_strain_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">From Strain</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-lg font-bold font-mono">
                                {formatDuration(filteredSleep.score?.sleep_needed?.need_from_recent_nap_milli)}
                              </p>
                              <p className="text-xs text-muted-foreground">From Naps</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Strain Details */}
                  {filteredCycle && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          Strain & Activity Details
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(filteredCycle.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {filteredCycle.end && (
                              <>
                                {' → '}
                                {new Date(filteredCycle.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </>
                            )}
                          </span>
                          {!filteredCycle.end && <Badge variant="outline" className="text-xs text-green-500">Active</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Strain Metrics */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Strain Metrics</p>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                              <p className="text-2xl font-bold font-mono" style={{ color: getScoreColor(Math.min(100, (filteredCycle.score?.strain || 0) * 4.76)) }}>
                                {filteredCycle.score?.strain?.toFixed(1) || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Day Strain (0-21)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                              <p className="text-xl font-bold font-mono">
                                {filteredCycle.score?.kilojoule ? Math.round(filteredCycle.score.kilojoule * 0.239).toLocaleString() : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Calories Burned</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <p className="text-xl font-bold font-mono">
                                {filteredCycle.score?.kilojoule ? Math.round(filteredCycle.score.kilojoule).toLocaleString() : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Kilojoules</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                              <p className="text-lg font-bold font-mono">
                                {filteredCycle.end ? formatDuration(new Date(filteredCycle.end).getTime() - new Date(filteredCycle.start).getTime()) : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Cycle Duration</p>
                            </div>
                          </div>
                        </div>

                        {/* Heart Rate */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Heart Rate</p>
                          <div className="grid gap-3 grid-cols-2">
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                              <p className="text-2xl font-bold font-mono">
                                {filteredCycle.score?.average_heart_rate || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Average HR (bpm)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-center">
                              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-red-600" />
                              <p className="text-2xl font-bold font-mono">
                                {filteredCycle.score?.max_heart_rate || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">Max HR (bpm)</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Workouts for this date */}
                  {filteredWorkouts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Dumbbell className="h-5 w-5 text-purple-500" />
                          Workouts ({filteredWorkouts.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {filteredWorkouts.map((workout, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-muted/20 space-y-3">
                            {/* Workout Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {new Date(workout.start).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                  {' → '}
                                  {new Date(workout.end).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Duration: {formatDuration(new Date(workout.end).getTime() - new Date(workout.start).getTime())}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold font-mono" style={{ color: getScoreColor(Math.min(100, (workout.score?.strain || 0) * 4.76)) }}>
                                  {workout.score?.strain?.toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">strain</p>
                              </div>
                            </div>

                            {/* Workout Metrics */}
                            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                              <div className="p-2 rounded bg-muted/30 text-center">
                                <p className="text-lg font-bold font-mono">
                                  {workout.score?.kilojoule ? Math.round(workout.score.kilojoule * 0.239) : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Calories</p>
                              </div>
                              <div className="p-2 rounded bg-muted/30 text-center">
                                <p className="text-lg font-bold font-mono">
                                  {workout.score?.average_heart_rate || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Avg HR</p>
                              </div>
                              <div className="p-2 rounded bg-muted/30 text-center">
                                <p className="text-lg font-bold font-mono">
                                  {workout.score?.max_heart_rate || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Max HR</p>
                              </div>
                              <div className="p-2 rounded bg-muted/30 text-center">
                                <p className="text-lg font-bold font-mono">
                                  {workout.score?.percent_recorded ? `${Math.round(workout.score.percent_recorded)}%` : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Recorded</p>
                              </div>
                            </div>

                            {/* Distance if available */}
                            {(workout.score?.distance_meter || workout.score?.altitude_gain_meter) && (
                              <div className="grid gap-2 grid-cols-3">
                                {workout.score?.distance_meter && (
                                  <div className="p-2 rounded bg-muted/30 text-center">
                                    <p className="text-lg font-bold font-mono">
                                      {(workout.score.distance_meter / 1000).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Distance (km)</p>
                                  </div>
                                )}
                                {workout.score?.altitude_gain_meter && (
                                  <div className="p-2 rounded bg-muted/30 text-center">
                                    <p className="text-lg font-bold font-mono">
                                      {Math.round(workout.score.altitude_gain_meter)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Elevation (m)</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Heart Rate Zones */}
                            {workout.score?.zone_duration && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">HR Zones</p>
                                <div className="grid gap-1 grid-cols-6">
                                  <div className="p-1 rounded bg-gray-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_zero_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z0</p>
                                  </div>
                                  <div className="p-1 rounded bg-blue-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_one_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z1</p>
                                  </div>
                                  <div className="p-1 rounded bg-green-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_two_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z2</p>
                                  </div>
                                  <div className="p-1 rounded bg-yellow-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_three_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z3</p>
                                  </div>
                                  <div className="p-1 rounded bg-orange-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_four_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z4</p>
                                  </div>
                                  <div className="p-1 rounded bg-red-500/20 text-center">
                                    <p className="text-xs font-mono font-bold">
                                      {formatDuration(workout.score.zone_duration.zone_five_milli)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Z5</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* No data for selected date */}
                  {!hasWhoopDataForDate && !loadingWhoop && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Watch className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground text-sm">
                          No WHOOP data for this date
                        </p>
                        {availableWhoopDates.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2">
                              Available dates:
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {availableWhoopDates.slice(0, 5).map((date) => (
                                <Button
                                  key={date}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedDate(new Date(date + 'T00:00:00'))}
                                  className="text-xs"
                                >
                                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ===== OURA TAB ===== */}
            <TabsContent value="oura" className="space-y-4 mt-4">
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Oura Data</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Oura Ring data requires direct authentication from the client.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The Oura API identifies users by their JWT token, so coach access requires
                    a service-level integration. Check if the client has connected their Oura Ring
                    in the mobile app.
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    User ID: {userId}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== TRENDS TAB ===== */}
            <TabsContent value="trends" className="space-y-4 mt-4">
              <HealthTrendsChart userId={userId} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};
