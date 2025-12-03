import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCoaches, useCreateCoach, useAddCertification, useUpdateSpecialties, useUpdateCoach, useExpertIdForUser } from "@/hooks/useCoaches";
import { useCoachClients } from "@/hooks/useClients";
import { useCoachQuestionnaires } from "@/hooks/useQuestionnaires";
import { Users, Star, TrendingUp, Clock, CheckCircle2, Plus, Award, Loader2, RefreshCw, Search, ChevronRight, FileQuestion, Image, Pencil, User, ShieldCheck, UserCheck, Power, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateQuestionnaire } from "@/hooks/useQuestionnaires";
import { coachService } from "@/lib/services/coachService";
import type { QuestionType } from "@/types";
import type { CoachProfile, ExpertSpecialty, ClientWithStatus, CoachingStatus, Questionnaire } from "@/types";
import { toast } from "sonner";

import type { UserRole } from "@/types";

const SPECIALTIES: { value: ExpertSpecialty; label: string }[] = [
  { value: "nutrition", label: "Nutrition" },
  { value: "fitness", label: "Fitness" },
  { value: "sleep", label: "Sleep" },
  { value: "stress", label: "Stress Management" },
  { value: "longevity", label: "Longevity" },
  { value: "hormones", label: "Hormones" },
  { value: "mental_health", label: "Mental Health" },
  { value: "recovery", label: "Recovery" },
];

// Predefined questionnaire templates
const QUESTIONNAIRE_TEMPLATES = [
  {
    id: "general-intake",
    title: "General Health Intake",
    description: "Comprehensive initial health assessment",
    specialty: "general",
    questions: [
      { id: "g1", question: "What are your primary health and wellness goals?", type: "text" as QuestionType, options: [], required: true },
      { id: "g2", question: "How would you rate your current overall health?", type: "scale" as QuestionType, options: [], required: true },
      { id: "g3", question: "Do you have any diagnosed medical conditions?", type: "text" as QuestionType, options: [], required: false },
      { id: "g4", question: "Are you currently taking any medications or supplements?", type: "text" as QuestionType, options: [], required: false },
      { id: "g5", question: "How many hours of sleep do you typically get per night?", type: "single_choice" as QuestionType, options: ["Less than 5", "5-6 hours", "6-7 hours", "7-8 hours", "More than 8"], required: true },
      { id: "g6", question: "What is your current stress level?", type: "scale" as QuestionType, options: [], required: true },
    ],
  },
  {
    id: "nutrition-assessment",
    title: "Nutrition Assessment",
    description: "Evaluate dietary habits and nutrition goals",
    specialty: "nutrition",
    questions: [
      { id: "n1", question: "How many meals do you typically eat per day?", type: "single_choice" as QuestionType, options: ["1-2 meals", "3 meals", "4-5 small meals", "Grazing throughout day"], required: true },
      { id: "n2", question: "Do you follow any specific diet?", type: "single_choice" as QuestionType, options: ["No specific diet", "Vegetarian", "Vegan", "Keto/Low-carb", "Paleo", "Mediterranean", "Other"], required: true },
      { id: "n3", question: "How many servings of vegetables do you eat daily?", type: "single_choice" as QuestionType, options: ["0-1 servings", "2-3 servings", "4-5 servings", "6+ servings"], required: true },
      { id: "n4", question: "How much water do you drink daily?", type: "single_choice" as QuestionType, options: ["Less than 4 cups", "4-6 cups", "6-8 cups", "8+ cups"], required: true },
      { id: "n5", question: "Do you have any food allergies or intolerances?", type: "text" as QuestionType, options: [], required: false },
    ],
  },
  {
    id: "fitness-assessment",
    title: "Fitness Assessment",
    description: "Evaluate current fitness level and exercise habits",
    specialty: "fitness",
    questions: [
      { id: "f1", question: "How many days per week do you currently exercise?", type: "single_choice" as QuestionType, options: ["0 days", "1-2 days", "3-4 days", "5-6 days", "Every day"], required: true },
      { id: "f2", question: "What types of exercise do you enjoy?", type: "multi_choice" as QuestionType, options: ["Walking/Running", "Strength training", "Yoga/Pilates", "Swimming", "Cycling", "Group fitness classes", "Sports"], required: true },
      { id: "f3", question: "How would you rate your current fitness level?", type: "scale" as QuestionType, options: [], required: true },
      { id: "f4", question: "Do you have any injuries or physical limitations?", type: "text" as QuestionType, options: [], required: false },
      { id: "f5", question: "What is your primary fitness goal?", type: "single_choice" as QuestionType, options: ["Lose weight", "Build muscle", "Improve endurance", "Increase flexibility", "General fitness", "Athletic performance"], required: true },
    ],
  },
  {
    id: "sleep-assessment",
    title: "Sleep Quality Assessment",
    description: "Evaluate sleep patterns and quality",
    specialty: "sleep",
    questions: [
      { id: "s1", question: "What time do you typically go to bed?", type: "single_choice" as QuestionType, options: ["Before 9 PM", "9-10 PM", "10-11 PM", "11 PM-12 AM", "After midnight"], required: true },
      { id: "s2", question: "What time do you typically wake up?", type: "single_choice" as QuestionType, options: ["Before 5 AM", "5-6 AM", "6-7 AM", "7-8 AM", "After 8 AM"], required: true },
      { id: "s3", question: "How would you rate your sleep quality?", type: "scale" as QuestionType, options: [], required: true },
      { id: "s4", question: "Do you have trouble falling asleep?", type: "single_choice" as QuestionType, options: ["Never", "Rarely", "Sometimes", "Often", "Always"], required: true },
      { id: "s5", question: "Do you wake up during the night?", type: "single_choice" as QuestionType, options: ["Never", "1-2 times", "3-4 times", "More than 4 times"], required: true },
    ],
  },
];

interface CoachesProps {
  currentRole?: UserRole;
  currentCoachId?: string; // ID of the currently logged-in coach (for coach role)
}

const Coaches = ({ currentRole = "admin", currentCoachId }: CoachesProps) => {
  const navigate = useNavigate();
  const isCoachView = currentRole === "coach";

  // For coaches, look up their expert ID (since user.id might != expert.id)
  const { data: expertId, isLoading: loadingExpertId } = useExpertIdForUser(
    isCoachView ? currentCoachId : undefined
  );

  // For coach view, pre-select their own profile to avoid showing the list
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [newCoach, setNewCoach] = useState({
    name: "",
    email: "",
    bio: "",
    hourlyRate: 150,
    yearsExperience: 5,
    specialties: [] as ExpertSpecialty[],
  });

  const [newCertification, setNewCertification] = useState({
    name: "",
    issuer: "",
    issuedAt: "",
    expiresAt: "",
  });

  // About edit state
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editSpecialties, setEditSpecialties] = useState<ExpertSpecialty[]>([]);
  const [editHourlyRate, setEditHourlyRate] = useState<number>(0);
  const [editYearsExperience, setEditYearsExperience] = useState<number>(0);
  const [editTimezone, setEditTimezone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editLanguage, setEditLanguage] = useState("");

  // Hooks
  const { data: coaches = [], isLoading, error, refetch: refetchCoaches } = useCoaches();
  const createCoachMutation = useCreateCoach();
  const addCertMutation = useAddCertification();
  const updateSpecialtiesMutation = useUpdateSpecialties();
  const updateCoachMutation = useUpdateCoach();
  const createQuestionnaireMutation = useCreateQuestionnaire();

  // Fetch clients for selected coach from database
  const { data: coachClients = [], isLoading: loadingClients, refetch: refetchClients } = useCoachClients(selectedCoachId || undefined);

  // Fetch questionnaires for selected coach
  const { data: coachQuestionnaires = [], isLoading: loadingQuestionnaires } = useCoachQuestionnaires(selectedCoachId || undefined);

  const selectedCoach = selectedCoachId
    ? coaches.find((c: CoachProfile) => c.id === selectedCoachId)
    : null;

  // Filter coaches based on search query - MUST be called before any conditional returns
  const filteredCoaches = useMemo(() => {
    let result = coaches;

    // For coach view, only show their own profile (use expertId from lookup)
    if (isCoachView && expertId) {
      result = coaches.filter((c: CoachProfile) => c.id === expertId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((coach: CoachProfile) =>
        coach.name.toLowerCase().includes(query) ||
        coach.email.toLowerCase().includes(query) ||
        coach.bio?.toLowerCase().includes(query) ||
        coach.specialties?.some(s => s.toLowerCase().includes(query)) ||
        coach.certifications?.some(c => c.toLowerCase().includes(query))
      );
    }

    return result;
  }, [coaches, searchQuery, isCoachView, expertId]);

  // Auto-select coach profile for coach role (use expertId from lookup)
  useEffect(() => {
    if (isCoachView && expertId && !selectedCoachId) {
      setSelectedCoachId(expertId);
    }
  }, [isCoachView, expertId, selectedCoachId]);

  const getCoachStats = (coachId: string, clients: ClientWithStatus[] = []) => {
    const activeClients = clients.filter(c => c.coachingStatus === "active");
    const completedClients = clients.filter(c => c.coachingStatus === "completed");
    const pendingQuestionnaire = clients.filter(c => c.coachingStatus === "pending_questionnaire");
    const pendingSchedule = clients.filter(c => c.coachingStatus === "pending_schedule");

    const avgAdherence = clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + (c.adherence30d || 0), 0) / clients.length)
      : 0;

    return {
      totalClients: clients.length,
      activeClients: activeClients.length,
      completedClients: completedClients.length,
      pendingQuestionnaire: pendingQuestionnaire.length,
      pendingSchedule: pendingSchedule.length,
      avgAdherence,
    };
  };

  const getStatusBadgeVariant = (status: CoachingStatus) => {
    switch (status) {
      case "active": return "default";
      case "pending_questionnaire": return "secondary";
      case "pending_schedule": return "outline";
      case "scheduled_review": return "default";
      case "completed": return "outline";
      case "paused": return "secondary";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: CoachingStatus) => {
    switch (status) {
      case "active": return "Active";
      case "pending_questionnaire": return "Questionnaire Pending";
      case "pending_schedule": return "Needs Scheduling";
      case "scheduled_review": return "Review Scheduled";
      case "completed": return "Completed";
      case "paused": return "Paused";
      default: return status;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

  const handleCreateCoach = async () => {
    if (!newCoach.name || !newCoach.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      await createCoachMutation.mutateAsync(newCoach);
      toast.success("Coach profile created successfully");
      setCreateDialogOpen(false);
      setNewCoach({
        name: "",
        email: "",
        bio: "",
        hourlyRate: 150,
        yearsExperience: 5,
        specialties: [],
      });
    } catch (err) {
      toast.error("Failed to create coach profile");
    }
  };

  const handleAddCertification = async () => {
    if (!selectedCoachId || !newCertification.name || !newCertification.issuer) {
      toast.error("Certification name and issuer are required");
      return;
    }

    try {
      await addCertMutation.mutateAsync({
        coachId: selectedCoachId,
        certification: newCertification,
      });
      toast.success("Certification added successfully");
      setCertDialogOpen(false);
      setNewCertification({ name: "", issuer: "", issuedAt: "", expiresAt: "" });
    } catch (err) {
      toast.error("Failed to add certification");
    }
  };

  const toggleSpecialty = (specialty: ExpertSpecialty) => {
    setNewCoach(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleStartEditAbout = () => {
    if (selectedCoach) {
      setEditBio(selectedCoach.bio || "");
      setEditPhotoUrl(selectedCoach.photo || "");
      setEditSpecialties(selectedCoach.specialties || []);
      setEditHourlyRate(selectedCoach.hourlyRate || 0);
      setEditYearsExperience(selectedCoach.yearsExperience || 0);
      setEditTimezone(selectedCoach.timezone || "");
      setEditLocation(selectedCoach.location || "");
      setEditLanguage(selectedCoach.language || "");
      setIsEditingAbout(true);
    }
  };

  const handleCancelEditAbout = () => {
    setIsEditingAbout(false);
    setEditBio("");
    setEditPhotoUrl("");
    setEditSpecialties([]);
    setEditHourlyRate(0);
    setEditYearsExperience(0);
    setEditTimezone("");
    setEditLocation("");
    setEditLanguage("");
  };

  const toggleEditSpecialty = (specialty: ExpertSpecialty) => {
    setEditSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleSaveAbout = async () => {
    if (!selectedCoachId) return;

    try {
      // Update coach profile
      await updateCoachMutation.mutateAsync({
        coachId: selectedCoachId,
        updates: {
          bio: editBio,
          photoUrl: editPhotoUrl,
          hourlyRate: editHourlyRate,
          yearsExperience: editYearsExperience,
          timezone: editTimezone,
          location: editLocation,
          language: editLanguage,
        },
      });

      // Update specialties separately
      await updateSpecialtiesMutation.mutateAsync({
        coachId: selectedCoachId,
        specialties: editSpecialties,
      });

      toast.success("Profile updated successfully");
      setIsEditingAbout(false);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  // Status toggle handlers
  const handleToggleVerified = async (coachId: string, isVerified: boolean) => {
    try {
      await updateCoachMutation.mutateAsync({
        coachId,
        updates: { isVerified },
      });
      toast.success(isVerified ? "Coach verified" : "Coach unverified");
    } catch (err) {
      toast.error("Failed to update verification status");
    }
  };

  const handleToggleAcceptingClients = async (coachId: string, isAcceptingClients: boolean) => {
    try {
      await updateCoachMutation.mutateAsync({
        coachId,
        updates: { isAcceptingClients },
      });
      toast.success(isAcceptingClients ? "Now accepting clients" : "Stopped accepting clients");
    } catch (err) {
      toast.error("Failed to update accepting clients status");
    }
  };

  const handleToggleActive = async (coachId: string, isActive: boolean) => {
    try {
      await updateCoachMutation.mutateAsync({
        coachId,
        updates: { isActive },
      });
      toast.success(isActive ? "Coach activated" : "Coach deactivated");
    } catch (err) {
      toast.error("Failed to update active status");
    }
  };

  // Use questionnaire template - creates it and sets as default
  const handleUseQuestionnaireTemplate = async (template: typeof QUESTIONNAIRE_TEMPLATES[0]) => {
    const coachId = selectedCoachId;
    if (!coachId) {
      toast.error("No coach selected");
      return;
    }

    try {
      // Create the questionnaire
      const newQuestionnaire = await createQuestionnaireMutation.mutateAsync({
        title: template.title,
        description: template.description,
        specialty: template.specialty,
        createdBy: coachId,
        questions: template.questions.map((q, idx) => ({
          id: `q_${idx}`,
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required,
        })),
      });

      // Set it as the default questionnaire for this coach
      await coachService.updateCoachSettings(coachId, {
        defaultQuestionnaireId: newQuestionnaire.id,
      });

      setQuestionnaireDialogOpen(false);
      toast.success(`"${template.title}" is now your default questionnaire!`);
    } catch (err: any) {
      console.error("Failed to use template:", err);
      toast.error(err?.message || "Failed to use template");
    }
  };

  if (isLoading || (isCoachView && loadingExpertId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Failed to load coaches</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (selectedCoach) {
    const stats = getCoachStats(selectedCoach.id, coachClients);
    const isOwnProfile = isCoachView && selectedCoach.id === expertId;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {/* Only show back button for admins viewing a coach, not for coaches viewing their own profile */}
            {!isOwnProfile && (
              <Button variant="ghost" onClick={() => setSelectedCoachId(null)} className="mb-2">
                ← Back to Coaches
              </Button>
            )}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {selectedCoach.photo && <AvatarImage src={selectedCoach.photo} alt={selectedCoach.name} />}
                <AvatarFallback className="text-2xl">{getInitials(selectedCoach.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isOwnProfile ? "My Profile" : selectedCoach.name}
                </h1>
                {!isOwnProfile && <p className="text-muted-foreground">{selectedCoach.email}</p>}
                {isOwnProfile && <p className="text-muted-foreground">{selectedCoach.name} • {selectedCoach.email}</p>}
                {selectedCoach.bio && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg line-clamp-2">{selectedCoach.bio}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {selectedCoach.rating && selectedCoach.rating > 0 && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                {selectedCoach.rating.toFixed(1)} ({selectedCoach.reviewCount || 0} reviews)
              </Badge>
            )}
            <div className="flex gap-2">
              {selectedCoach.specialties?.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="capitalize">
                  {specialty.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeClients} active, {stats.completedClients} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Questionnaire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingQuestionnaire}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting client response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Scheduling</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSchedule}</div>
              <p className="text-xs text-muted-foreground">
                Ready for initial review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(selectedCoach.rating || 0).toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {selectedCoach.reviewCount || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experience</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedCoach.yearsExperience || 0} years</div>
              <p className="text-xs text-muted-foreground">
                ${selectedCoach.hourlyRate || 0}/hr rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Management Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status Management</CardTitle>
            <CardDescription>Manage coach verification and availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Verified - Admin Only */}
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${selectedCoach.isVerified ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Verified</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCoach.isVerified ? 'Credentials verified' : 'Pending verification'}
                    </p>
                  </div>
                </div>
                {currentRole === "admin" && (
                  <Switch
                    checked={selectedCoach.isVerified || false}
                    onCheckedChange={(checked) => handleToggleVerified(selectedCoach.id, checked)}
                    disabled={updateCoachMutation.isPending}
                  />
                )}
                {currentRole !== "admin" && (
                  <Badge variant={selectedCoach.isVerified ? "default" : "secondary"}>
                    {selectedCoach.isVerified ? "Verified" : "Pending"}
                  </Badge>
                )}
              </div>

              {/* Accepting Clients - Admin & Coach */}
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${selectedCoach.isAcceptingClients ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Accepting Clients</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCoach.isAcceptingClients ? 'Open for new clients' : 'Not accepting new clients'}
                    </p>
                  </div>
                </div>
                {(currentRole === "admin" || isOwnProfile) && (
                  <Switch
                    checked={selectedCoach.isAcceptingClients || false}
                    onCheckedChange={(checked) => handleToggleAcceptingClients(selectedCoach.id, checked)}
                    disabled={updateCoachMutation.isPending}
                  />
                )}
              </div>

              {/* Active Status - Admin & Coach */}
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${selectedCoach.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Power className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Active Status</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCoach.status === 'active' ? 'Account is active' : 'Account is inactive'}
                    </p>
                  </div>
                </div>
                {(currentRole === "admin" || isOwnProfile) && (
                  <Switch
                    checked={selectedCoach.status === 'active'}
                    onCheckedChange={(checked) => handleToggleActive(selectedCoach.id, checked)}
                    disabled={updateCoachMutation.isPending}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clients ({coachClients.length})</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionnaires ({coachQuestionnaires.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Client Roster</CardTitle>
                  <CardDescription>All clients assigned to this coach</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchClients()} disabled={loadingClients}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingClients ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingClients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : coachClients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No clients assigned yet</p>
                ) : (
                  <div className="space-y-4">
                    {coachClients.map((client: ClientWithStatus) => (
                      <div
                        key={client.relationshipId || client.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/clients/${client.relationshipId || client.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {client.questionnaireCompletedAt && (
                              <div className="flex items-center gap-1 text-xs text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Questionnaire done</span>
                              </div>
                            )}
                            {client.nextSessionAt && (
                              <p className="text-xs text-muted-foreground">
                                Next: {new Date(client.nextSessionAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge variant={getStatusBadgeVariant(client.coachingStatus)}>
                            {getStatusLabel(client.coachingStatus)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaires" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Questionnaire Templates</CardTitle>
                  <CardDescription>Intake questionnaires for client onboarding</CardDescription>
                </div>
                <Dialog open={questionnaireDialogOpen} onOpenChange={setQuestionnaireDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Questionnaire
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Choose a Questionnaire Template</DialogTitle>
                      <DialogDescription>
                        Select a template to use as your default intake questionnaire for new clients
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      {QUESTIONNAIRE_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileQuestion className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{template.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {template.description} • {template.questions.length} questions
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUseQuestionnaireTemplate(template)}
                            disabled={createQuestionnaireMutation.isPending}
                          >
                            {createQuestionnaireMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Use Template
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setQuestionnaireDialogOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingQuestionnaires ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : coachQuestionnaires.length === 0 ? (
                  <div className="text-center py-8">
                    <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No questionnaires created yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Create Questionnaire" to choose a template for client onboarding
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coachQuestionnaires.map((questionnaire: Questionnaire) => (
                      <div
                        key={questionnaire.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileQuestion className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{questionnaire.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {questionnaire.questions?.length || 0} questions
                              {questionnaire.specialty && ` • ${questionnaire.specialty}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={questionnaire.isActive ? "default" : "secondary"}>
                            {questionnaire.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>About</CardTitle>
                  <CardDescription>Coach profile and bio information</CardDescription>
                </div>
                {!isEditingAbout && (
                  <Button variant="outline" size="sm" onClick={handleStartEditAbout}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditingAbout ? (
                  <div className="space-y-6">
                    {/* Photo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="photo-url">Photo URL</Label>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20">
                          {editPhotoUrl && <AvatarImage src={editPhotoUrl} alt="Preview" />}
                          <AvatarFallback className="text-2xl">
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="photo-url"
                            value={editPhotoUrl}
                            onChange={(e) => setEditPhotoUrl(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter a URL for the profile photo
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell clients about your experience, approach, and what makes you unique..."
                        rows={5}
                      />
                    </div>

                    {/* Specialties */}
                    <div className="space-y-2">
                      <Label>Specialties</Label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALTIES.map((specialty) => (
                          <Badge
                            key={specialty.value}
                            variant={editSpecialties.includes(specialty.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleEditSpecialty(specialty.value)}
                          >
                            {specialty.label}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click to toggle specialties
                      </p>
                    </div>

                    {/* Hourly Rate & Experience */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
                        <Input
                          id="hourly-rate"
                          type="number"
                          value={editHourlyRate}
                          onChange={(e) => setEditHourlyRate(parseInt(e.target.value) || 0)}
                          placeholder="150"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="years-exp">Years of Experience</Label>
                        <Input
                          id="years-exp"
                          type="number"
                          value={editYearsExperience}
                          onChange={(e) => setEditYearsExperience(parseInt(e.target.value) || 0)}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    {/* Location, Timezone & Language */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="New York, USA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={editTimezone}
                          onChange={(e) => setEditTimezone(e.target.value)}
                          placeholder="America/New_York"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Input
                          id="language"
                          value={editLanguage}
                          onChange={(e) => setEditLanguage(e.target.value)}
                          placeholder="English"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancelEditAbout}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveAbout} disabled={updateCoachMutation.isPending}>
                        {updateCoachMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Display Photo */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Photo</h3>
                      <Avatar className="h-24 w-24">
                        {selectedCoach.photo && <AvatarImage src={selectedCoach.photo} alt={selectedCoach.name} />}
                        <AvatarFallback className="text-3xl">{getInitials(selectedCoach.name)}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Display Bio */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                      <p className="text-foreground whitespace-pre-wrap">
                        {selectedCoach.bio || "No bio provided. Click 'Edit Profile' to add one."}
                      </p>
                    </div>

                    {/* Display Specialties */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCoach.specialties?.length > 0 ? (
                          selectedCoach.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="capitalize">
                              {specialty.replace("_", " ")}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No specialties set</p>
                        )}
                      </div>
                    </div>

                    {/* Display Experience and Rate */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Experience</h3>
                        <p className="text-foreground">{selectedCoach.yearsExperience || 0} years</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Hourly Rate</h3>
                        <p className="text-foreground">${selectedCoach.hourlyRate || 0}/hour</p>
                      </div>
                    </div>

                    {/* Display Location, Timezone & Language */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                        <p className="text-foreground">{selectedCoach.location || "Not set"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Timezone</h3>
                        <p className="text-foreground">{selectedCoach.timezone || "Not set"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Language</h3>
                        <p className="text-foreground">{selectedCoach.language || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>Professional certifications and credentials</CardDescription>
                </div>
                <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Certification</DialogTitle>
                      <DialogDescription>Add a new certification to this coach's profile</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cert-name">Certification Name</Label>
                        <Input
                          id="cert-name"
                          value={newCertification.name}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., NASM Certified Personal Trainer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cert-issuer">Issuing Organization</Label>
                        <Input
                          id="cert-issuer"
                          value={newCertification.issuer}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                          placeholder="e.g., National Academy of Sports Medicine"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cert-issued">Issued Date</Label>
                          <Input
                            id="cert-issued"
                            type="date"
                            value={newCertification.issuedAt}
                            onChange={(e) => setNewCertification(prev => ({ ...prev, issuedAt: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cert-expires">Expiry Date</Label>
                          <Input
                            id="cert-expires"
                            type="date"
                            value={newCertification.expiresAt}
                            onChange={(e) => setNewCertification(prev => ({ ...prev, expiresAt: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCertDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddCertification} disabled={addCertMutation.isPending}>
                        {addCertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Certification
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCoach.certificationsList?.length === 0 && selectedCoach.certifications?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No certifications added yet</p>
                  ) : (
                    <>
                      {selectedCoach.certificationsList?.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Award className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{cert.name}</p>
                              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {cert.issuedAt && <p>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>}
                            {cert.expiresAt && <p>Expires: {new Date(cert.expiresAt).toLocaleDateString()}</p>}
                          </div>
                        </div>
                      ))}
                      {selectedCoach.certifications?.filter(c => !selectedCoach.certificationsList?.some(cl => cl.name === c)).map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <p className="font-medium text-foreground">{cert}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isCoachView ? "My Profile" : "Coaches"}
          </h1>
          <p className="text-muted-foreground">
            {isCoachView
              ? "Manage your coach profile and view your clients"
              : `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} in your organization`
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchCoaches()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {currentRole === "admin" && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coach
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Coach Profile</DialogTitle>
                  <DialogDescription>Add a new coach to your organization</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newCoach.name}
                        onChange={(e) => setNewCoach(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCoach.email}
                        onChange={(e) => setNewCoach(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={newCoach.bio}
                      onChange={(e) => setNewCoach(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief description of experience and approach..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate ($)</Label>
                      <Input
                        id="rate"
                        type="number"
                        value={newCoach.hourlyRate}
                        onChange={(e) => setNewCoach(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={newCoach.yearsExperience}
                        onChange={(e) => setNewCoach(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Specialties</Label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTIES.map((specialty) => (
                        <Badge
                          key={specialty.value}
                          variant={newCoach.specialties.includes(specialty.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSpecialty(specialty.value)}
                        >
                          {specialty.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateCoach} disabled={createCoachMutation.isPending}>
                    {createCoachMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Coach
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search bar - only show for admin viewing all coaches */}
      {!isCoachView && coaches.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coaches by name, email, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Coaches List View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {searchQuery ? `Search Results (${filteredCoaches.length})` : "All Coaches"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCoaches.length === 0 ? (
            <div className="text-center py-12 px-6">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No coaches found</h3>
                  <p className="text-muted-foreground">
                    No coaches match "{searchQuery}". Try a different search term.
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isCoachView ? "Profile not found" : "No coaches yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isCoachView
                      ? "Your coach profile has not been set up yet."
                      : "Get started by adding your first coach profile."
                    }
                  </p>
                  {currentRole === "admin" && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Coach
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCoaches.map((coach: CoachProfile) => (
                <div
                  key={coach.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCoachId(coach.id)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{coach.name}</p>
                      {(coach.rating || 0) > 0 && (
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <Star className="h-3 w-3 fill-current" />
                          {(coach.rating || 0).toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{coach.email}</p>
                    {coach.specialties && coach.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {coach.specialties.slice(0, 3).map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs capitalize">
                            {specialty.replace("_", " ")}
                          </Badge>
                        ))}
                        {coach.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{coach.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{coach.clientCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Clients</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{coach.yearsExperience || 0}y</p>
                      <p className="text-xs text-muted-foreground">Experience</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">${coach.hourlyRate || 0}</p>
                      <p className="text-xs text-muted-foreground">/hour</p>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Coaches;
