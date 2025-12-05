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
  notes?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: "coach" | "client" | "admin";
  content: string;
  createdAt: string;
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
  comments: TicketComment[];
  updatedAt: string;
}

export interface CheckInMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "coach";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface CheckIn {
  id: string;
  clientId: string;
  date: string;
  type: "daily" | "weekly";
  weight?: number;
  mood?: number;
  energy?: number;
  progressNotes: string;
  messages: CheckInMessage[];
  hasUnreadMessages: boolean;
}

export interface ActivityMetric {
  taskId: string;
  taskName: string;
  completionCount: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string;
  completionRate: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export interface PlanRoutineItem {
  id: string;
  type: "workout" | "meal" | "recovery" | "deep-work" | "habit";
  title: string;
  time: string;
  duration: string;
  notes?: string;
}

export interface PlanNutritionItem {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface PlanWorkoutItem {
  id: string;
  exercise: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface PlanSupplementItem {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  notes?: string;
}

export interface Plan {
  id: string;
  name: string;
  clientIds: string[];
  routine: PlanRoutineItem[];
  nutrition: PlanNutritionItem[];
  workouts: PlanWorkoutItem[];
  supplements: PlanSupplementItem[];
  createdAt: string;
  updatedAt: string;
}

// Coaching Status Types
export type CoachingStatus =
  | "pending_questionnaire"
  | "pending_schedule"
  | "scheduled_review"
  | "active"
  | "paused"
  | "completed";

export interface CoachingRelationship {
  id: string;
  coachId: string;
  clientId: string;
  status: CoachingStatus;
  startedAt: string;
  nextSessionAt?: string;
  questionnaireCompletedAt?: string;
  client?: Client;
  coach?: Coach;
}

export interface CoachingSession {
  id: string;
  relationshipId: string;
  scheduledAt: string;
  sessionType: "initial_review" | "follow_up" | "check_in";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  notes?: string;
  durationMinutes: number;
}

// Questionnaire Types
export type QuestionType = "text" | "single_choice" | "multi_choice" | "scale" | "number";

export interface QuestionnaireQuestion {
  id: string;
  questionnaireId: string;
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  orderIndex: number;
}

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  specialty?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  relationshipId: string;
  clientId: string;
  answers: Record<string, any>;
  submittedAt: string;
  questionnaire?: Questionnaire;
}

// Coach Certification Types
export interface CoachCertification {
  id: string;
  coachId: string;
  name: string;
  issuer: string;
  issuedAt?: string;
  expiresAt?: string;
  verificationUrl?: string;
}

// Expert Specialty Types
export type ExpertSpecialty =
  | "nutrition"
  | "fitness"
  | "sleep"
  | "stress"
  | "longevity"
  | "hormones"
  | "mental_health"
  | "recovery";

// Extended Coach Profile for Dashboard
export interface CoachProfile extends Coach {
  specialties: ExpertSpecialty[];
  certificationsList: CoachCertification[];
  hourlyRate?: number;
  responseTimeHours?: number;
  rating?: number;
  reviewCount?: number;
  clientCount?: number;
  yearsExperience?: number;
  timezone?: string;
  location?: string;
  languages?: string[];  // Changed to plural array to match DB schema
  isVerified?: boolean;
  isAcceptingClients?: boolean;
}

// Client with Coaching Status for Dashboard
export interface ClientWithStatus extends Client {
  coachingStatus?: CoachingStatus;
  nextSessionAt?: string;
  questionnaireCompletedAt?: string;
  relationshipId?: string;
}

// Coaching Plan Types
export type PlanItemCategory =
  | "nutrition"
  | "fitness"
  | "recovery"
  | "mindfulness"
  | "habits"
  | "measurements";

export type PlanItemFrequency = "daily" | "weekly" | "weekdays";

export interface CoachingPlanItem {
  id: string;
  planId: string;
  title: string;
  description?: string;
  category: PlanItemCategory;
  frequency: PlanItemFrequency;
  scheduledTime?: string; // HH:MM format
  durationMinutes?: number;
  sortOrder: number;
  createdAt: string;
}

export interface CoachingPlan {
  id: string;
  relationshipId: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: CoachingPlanItem[];
}

// Weekly Check-in Types for Coach Dashboard
export type CheckinStatus = "draft" | "submitted" | "reviewed";

export interface WeeklyTaskRecord {
  id: string;
  checkinId: string;
  planItemId: string;
  scheduledDate: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  planItem?: CoachingPlanItem;
}

export interface WeeklyCheckin {
  id: string;
  relationshipId: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  weight?: number;
  wins?: string;
  issues?: string;
  coachFeedback?: string;
  isReviewed: boolean;
  status: CheckinStatus;
  createdAt: string;
  updatedAt: string;
  tasks?: WeeklyTaskRecord[];
  photos?: { id: string; photoUrl: string; uploadedAt: string }[];
}

// Chat Message Types for Coach Dashboard
export type MessageType = "text" | "image" | "file" | "system";
export type SenderType = "user" | "expert";

export interface ChatMessage {
  id: string;
  relationshipId: string;
  senderId: string;
  senderType: SenderType;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  checkinId?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string; // relationship_id
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  coachId: string;
  coachName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSender?: SenderType;
  unreadCount: number;
  status: CoachingStatus;
}

// ==================== COACHING RULES ====================

export type CoachingRuleType = "condition" | "preference" | "constraint";

export interface CoachingRule {
  id: string;
  relationshipId: string;
  ruleType: CoachingRuleType;
  title: string;
  description: string;
  priority: number; // 0-10, higher = more important
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingRuleCreate {
  relationshipId: string;
  ruleType: CoachingRuleType;
  title: string;
  description: string;
  priority?: number;
}

// ==================== PLAN ITEM VARIATIONS ====================

export interface PlanItemVariation {
  title: string;
  duration?: number;
  description?: string;
  intensity?: "low" | "medium" | "high";
}

export interface PlanItemVariations {
  intense?: PlanItemVariation;
  moderate?: PlanItemVariation;
  light?: PlanItemVariation;
  rest?: PlanItemVariation;
  [key: string]: PlanItemVariation | undefined;
}

export interface CoachingPlanItemWithVariations extends CoachingPlanItem {
  variations?: PlanItemVariations;
  defaultVariation?: string;
  aiAdjustable?: boolean;
}

// ==================== DAILY CHECK-INS ====================

export type MoodType = "great" | "good" | "okay" | "low" | "stressed";
export type ProtocolDifficulty = "too_easy" | "just_right" | "too_hard";

export interface DailyCheckin {
  id: string;
  userId: string;
  relationshipId?: string;
  checkinDate: string;
  dailyPlanId?: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksSkipped: number;
  completionRate?: number;
  energyRating?: number;
  mood?: MoodType;
  stressLevel?: number;
  wins?: string;
  challenges?: string;
  notes?: string;
  protocolDifficulty?: ProtocolDifficulty;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyCheckinStats {
  daysCheckedIn: number;
  avgCompletionRate: number;
  avgEnergy: number;
  commonMood?: MoodType;
  avgStress: number;
  totalTasksCompleted: number;
  difficultyFeedback: ProtocolDifficulty[];
  wins: string[];
  challenges: string[];
}
