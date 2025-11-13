export type UserRole = "admin" | "coach" | "client";

export type RiskLevel = "low" | "medium" | "high";

export type Archetype = 
  | "Peak Performer"
  | "Resilience Rebuilder"
  | "Foundation Builder"
  | "Transformation Seeker"
  | "Systemic Improver"
  | "Connected Explorer";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  photo?: string;
  status: "active" | "inactive";
}

export interface Coach extends User {
  bio?: string;
  certifications?: string[];
  rosterIds: string[];
}

export interface Client extends User {
  archetypes: Archetype[];
  goals: string[];
  riskLevel: RiskLevel;
  assignedCoachId?: string;
  assignedCoachName?: string;
  adherence7d: number;
  adherence30d: number;
  sleep7dAvg: number;
  hrv7dAvg: number;
  rhr7dAvg: number;
  lastSyncTime: string;
  devices: string[];
}

export interface MetricsSnapshot {
  clientId: string;
  date: string;
  sleep: number;
  sleepEfficiency: number;
  hrv: number;
  rhr: number;
  steps: number;
  trainingLoad: number;
  stress: number;
  notes?: string;
}

export interface RoutineBlock {
  id: string;
  clientId: string;
  type: "workout" | "meal" | "recovery" | "deep-work" | "habit";
  title: string;
  start: string;
  end: string;
  effort: "low" | "medium" | "high";
  location?: string;
  status: "scheduled" | "completed" | "skipped" | "modified";
  origin: "template" | "rule" | "manual";
}

export interface Feedback {
  id: string;
  authorId: string;
  authorName: string;
  targetType: "client" | "plan" | "block" | "rule";
  targetId: string;
  targetName?: string;
  category: "data-issue" | "plan-mismatch" | "effort-misset" | "calendar-conflict" | "safety" | "other";
  severity: "low" | "medium" | "high";
  evidence: string;
  proposedFix: string;
  status: "new" | "triaged" | "applied" | "rejected";
  appliedRuleId?: string;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}
