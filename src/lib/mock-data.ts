import type { Client, Coach, MetricsSnapshot, Feedback, CheckIn, ActivityMetric, DashboardWidget } from "@/types";

export const mockClients: Client[] = [
  {
    id: "c1",
    role: "client",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    status: "active",
    archetypes: ["Peak Performer"],
    goals: ["Increase VO₂max", "Maintain performance"],
    riskLevel: "low",
    assignedCoachId: "coach1",
    assignedCoachName: "Dr. Alex Rivera",
    adherence7d: 94,
    adherence30d: 89,
    sleep7dAvg: 7.8,
    hrv7dAvg: 68,
    rhr7dAvg: 52,
    lastSyncTime: "2 hours ago",
    devices: ["Apple Watch", "Oura Ring"],
  },
  {
    id: "c2",
    role: "client",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    status: "active",
    archetypes: ["Resilience Rebuilder"],
    goals: ["Reduce stress", "Improve sleep"],
    riskLevel: "high",
    assignedCoachId: "coach1",
    assignedCoachName: "Dr. Alex Rivera",
    adherence7d: 56,
    adherence30d: 62,
    sleep7dAvg: 5.9,
    hrv7dAvg: 42,
    rhr7dAvg: 68,
    lastSyncTime: "15 minutes ago",
    devices: ["WHOOP"],
  },
  {
    id: "c3",
    role: "client",
    name: "Emily Torres",
    email: "emily.torres@email.com",
    status: "active",
    archetypes: ["Foundation Builder"],
    goals: ["Build consistency", "Establish habits"],
    riskLevel: "medium",
    assignedCoachId: "coach2",
    assignedCoachName: "Jamie Foster",
    adherence7d: 71,
    adherence30d: 73,
    sleep7dAvg: 6.8,
    hrv7dAvg: 55,
    rhr7dAvg: 59,
    lastSyncTime: "1 hour ago",
    devices: ["Garmin"],
  },
  {
    id: "c4",
    role: "client",
    name: "David Park",
    email: "david.park@email.com",
    status: "active",
    archetypes: ["Transformation Seeker"],
    goals: ["Fat loss", "Strength building"],
    riskLevel: "low",
    assignedCoachId: "coach2",
    assignedCoachName: "Jamie Foster",
    adherence7d: 88,
    adherence30d: 85,
    sleep7dAvg: 7.2,
    hrv7dAvg: 61,
    rhr7dAvg: 56,
    lastSyncTime: "30 minutes ago",
    devices: ["Apple Watch"],
  },
  {
    id: "c5",
    role: "client",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    status: "active",
    archetypes: ["Systemic Improver"],
    goals: ["Optimize recovery", "Balance training"],
    riskLevel: "medium",
    assignedCoachId: "coach1",
    assignedCoachName: "Dr. Alex Rivera",
    adherence7d: 67,
    adherence30d: 71,
    sleep7dAvg: 6.5,
    hrv7dAvg: 48,
    rhr7dAvg: 62,
    lastSyncTime: "45 minutes ago",
    devices: ["Oura Ring", "Garmin"],
  },
];

export const mockCoaches: Coach[] = [
  {
    id: "coach1",
    role: "coach",
    name: "Dr. Alex Rivera",
    email: "alex.rivera@holisticos.com",
    status: "active",
    bio: "Sports medicine specialist with 12+ years experience in performance optimization",
    certifications: ["MD", "CSCS", "USA Triathlon Level II"],
    rosterIds: ["c1", "c2", "c5"],
  },
  {
    id: "coach2",
    role: "coach",
    name: "Jamie Foster",
    email: "jamie.foster@holisticos.com",
    status: "active",
    bio: "Certified strength and conditioning coach specializing in habit formation",
    certifications: ["MS Exercise Science", "CSCS", "Precision Nutrition L2"],
    rosterIds: ["c3", "c4"],
  },
];

export const generateMetricsHistory = (clientId: string, days: number = 30): MetricsSnapshot[] => {
  const baseMetrics = {
    c1: { sleep: 7.8, hrv: 68, rhr: 52, steps: 11000, stress: 35 },
    c2: { sleep: 5.9, hrv: 42, rhr: 68, steps: 7200, stress: 72 },
    c3: { sleep: 6.8, hrv: 55, rhr: 59, steps: 8500, stress: 52 },
    c4: { sleep: 7.2, hrv: 61, rhr: 56, steps: 10200, stress: 41 },
    c5: { sleep: 6.5, hrv: 48, rhr: 62, steps: 9100, stress: 58 },
  }[clientId] || { sleep: 7, hrv: 60, rhr: 60, steps: 9000, stress: 50 };

  const snapshots: MetricsSnapshot[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const variance = () => (Math.random() - 0.5) * 0.15;
    const missing = Math.random() > 0.9; // 10% data gaps

    snapshots.push({
      clientId,
      date: date.toISOString().split('T')[0],
      sleep: missing ? 0 : Math.max(4, baseMetrics.sleep * (1 + variance())),
      sleepEfficiency: missing ? 0 : Math.max(70, Math.min(95, 85 + variance() * 20)),
      hrv: missing ? 0 : Math.max(30, baseMetrics.hrv * (1 + variance())),
      rhr: missing ? 0 : Math.max(45, baseMetrics.rhr * (1 + variance() * 0.1)),
      steps: missing ? 0 : Math.max(0, baseMetrics.steps * (1 + variance())),
      trainingLoad: missing ? 0 : Math.max(0, Math.min(100, 50 + variance() * 40)),
      stress: missing ? 0 : Math.max(0, Math.min(100, baseMetrics.stress * (1 + variance()))),
    });
  }

  return snapshots.reverse();
};

export const mockFeedback: Feedback[] = [
  {
    id: "f1",
    authorId: "coach1",
    authorName: "Dr. Alex Rivera",
    targetType: "client",
    targetId: "c2",
    targetName: "Marcus Johnson",
    category: "plan-mismatch",
    severity: "high",
    evidence: "HRV dropped 18% over 3 days (54→42). Sleep avg 5.9h vs target 7.5h. High stress score (72/100).",
    proposedFix: "Lower next 2 workouts to 'low' effort. Insert 20min recovery session. Trigger sleep hygiene nudge.",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "f2",
    authorId: "coach2",
    authorName: "Jamie Foster",
    targetType: "block",
    targetId: "b123",
    targetName: "Morning HIIT Workout",
    category: "effort-misset",
    severity: "medium",
    evidence: "Client skipped 3/4 HIIT sessions. Check-in notes: 'Too intense for morning, low energy.'",
    proposedFix: "Swap HIIT to evening slot. Replace morning with 15min mobility flow (low effort).",
    status: "triaged",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "f3",
    authorId: "coach1",
    authorName: "Dr. Alex Rivera",
    targetType: "client",
    targetId: "c5",
    targetName: "Priya Sharma",
    category: "calendar-conflict",
    severity: "medium",
    evidence: "Recurring work meetings conflict with lunch meal prep block (12:00-12:30 M/W/F).",
    proposedFix: "Move meal prep to 11:30 or 13:00. Add 'busy day' meal options (grab-and-go).",
    status: "applied",
    appliedRuleId: "r42",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "f4",
    authorId: "coach2",
    authorName: "Jamie Foster",
    targetType: "client",
    targetId: "c3",
    targetName: "Emily Torres",
    category: "data-issue",
    severity: "low",
    evidence: "Garmin sync missing sleep data for last 2 nights. Other metrics present.",
    proposedFix: "Client to re-authenticate Garmin. Backfill sleep from manual check-in if available.",
    status: "applied",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockCheckIns: CheckIn[] = [
  {
    id: "ci1",
    clientId: "c1",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    type: "daily",
    weight: 72.5,
    mood: 8,
    energy: 7,
    progressNotes: "Feeling strong today! Completed all workouts this week. Sleep has been great.",
    coachResponse: "Excellent work, Sarah! Your consistency is paying off. Keep up the great sleep routine.",
    coachRespondedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ci2",
    clientId: "c1",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: "daily",
    weight: 72.8,
    mood: 7,
    energy: 8,
    progressNotes: "Good energy levels. Hit a new PR on my 5K run - 22:45!",
    coachResponse: "That's a fantastic PR! Your training is clearly working. Let's maintain this momentum.",
    coachRespondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ci3",
    clientId: "c1",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: "weekly",
    weight: 73.2,
    mood: 8,
    energy: 7,
    progressNotes: "Great week overall! All workouts completed. Nutrition has been on point. Feeling ready for next week's challenges.",
  },
  {
    id: "ci4",
    clientId: "c2",
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    type: "daily",
    weight: 89.1,
    mood: 4,
    energy: 3,
    progressNotes: "Struggled with sleep again last night. Only got 5 hours. Feeling exhausted and stressed from work deadlines.",
  },
  {
    id: "ci5",
    clientId: "c2",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: "daily",
    weight: 89.5,
    mood: 5,
    energy: 4,
    progressNotes: "Tried the breathing exercises you recommended. Helped a bit with stress. Still having trouble winding down at night.",
    coachResponse: "I'm glad the breathing exercises are helping. Let's adjust your evening routine - I'll send you a modified plan that includes more recovery time before bed.",
    coachRespondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockActivityMetrics: ActivityMetric[] = [
  {
    taskId: "t1",
    taskName: "Morning Workout",
    completionCount: 42,
    currentStreak: 7,
    longestStreak: 14,
    lastCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 93,
  },
  {
    taskId: "t2",
    taskName: "Evening Meditation",
    completionCount: 38,
    currentStreak: 5,
    longestStreak: 12,
    lastCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 84,
  },
  {
    taskId: "t3",
    taskName: "Meal Prep",
    completionCount: 28,
    currentStreak: 3,
    longestStreak: 8,
    lastCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 78,
  },
  {
    taskId: "t4",
    taskName: "Hydration Tracking",
    completionCount: 51,
    currentStreak: 12,
    longestStreak: 21,
    lastCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 97,
  },
  {
    taskId: "t5",
    taskName: "Sleep Routine",
    completionCount: 34,
    currentStreak: 4,
    longestStreak: 10,
    lastCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 81,
  },
  {
    taskId: "t6",
    taskName: "Recovery Session",
    completionCount: 19,
    currentStreak: 0,
    longestStreak: 6,
    lastCompletedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completionRate: 68,
  },
];

export const getAdminWidgets = (): DashboardWidget[] => [
  { id: "w1", title: "Active Users", value: 847, change: 12, trend: "up", subtitle: "This month" },
  { id: "w2", title: "Weekly Active", value: 623, change: 8, trend: "up", subtitle: "Last 7 days" },
  { id: "w3", title: "Avg Adherence", value: "76%", change: -3, trend: "down", subtitle: "30-day rolling" },
  { id: "w4", title: "Avg HRV", value: 58, change: 4, trend: "up", subtitle: "7-day avg" },
  { id: "w5", title: "Avg Sleep", value: "7.1h", change: 0, trend: "neutral", subtitle: "7-day avg" },
  { id: "w6", title: "High Risk Clients", value: 14, change: -2, trend: "up", subtitle: "Needs attention" },
];

export const getCoachWidgets = (coachId: string): DashboardWidget[] => {
  const roster = mockCoaches.find(c => c.id === coachId)?.rosterIds || [];
  const clients = mockClients.filter(c => roster.includes(c.id));
  const highRisk = clients.filter(c => c.riskLevel === "high").length;
  const avgAdherence = Math.round(clients.reduce((sum, c) => sum + c.adherence7d, 0) / clients.length);

  return [
    { id: "w1", title: "Your Clients", value: clients.length, subtitle: "Active roster" },
    { id: "w2", title: "Need Review", value: highRisk + 2, subtitle: "Today's priorities" },
    { id: "w3", title: "Avg Adherence", value: `${avgAdherence}%`, change: -2, trend: "down", subtitle: "Your roster, 7d" },
    { id: "w4", title: "New Check-ins", value: 8, subtitle: "Since yesterday" },
    { id: "w5", title: "Pending Feedback", value: 3, subtitle: "Awaiting action" },
    { id: "w6", title: "Streak at Risk", value: 2, subtitle: "Clients <3d adherence" },
  ];
};
