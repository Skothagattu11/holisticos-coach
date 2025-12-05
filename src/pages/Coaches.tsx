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
import { Users, Star, TrendingUp, Clock, CheckCircle2, Plus, Award, Loader2, RefreshCw, Search, ChevronRight, FileQuestion, Image, Pencil, User, ShieldCheck, UserCheck, Power, Check, ChevronDown, ChevronUp, CalendarClock, Trash2, X, CalendarOff } from "lucide-react";
import { useCreateQuestionnaire } from "@/hooks/useQuestionnaires";
import { coachService } from "@/lib/services/coachService";
import { storageService } from "@/lib/services/storageService";
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

// Common languages for coaches
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
];

// Countries with major cities
const COUNTRIES_AND_CITIES: Record<string, string[]> = {
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "San Francisco", "Seattle", "Denver", "Boston", "Miami", "Atlanta", "Nashville"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Bristol", "Glasgow", "Edinburgh", "Sheffield", "Cardiff"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Bilbao"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
  "Portugal": ["Lisbon", "Porto", "Braga", "Funchal"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Cancún"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
  "China": ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Hangzhou"],
  "Singapore": ["Singapore"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton"],
  "Ireland": ["Dublin", "Cork", "Galway", "Limerick"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala"],
  "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense"],
  "Finland": ["Helsinki", "Espoo", "Tampere", "Turku"],
  "Austria": ["Vienna", "Graz", "Linz", "Salzburg"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Bruges"],
  "Poland": ["Warsaw", "Kraków", "Łódź", "Wrocław"],
  "Czech Republic": ["Prague", "Brno", "Ostrava"],
  "Greece": ["Athens", "Thessaloniki", "Patras"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
  "Chile": ["Santiago", "Valparaíso", "Concepción"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Bali"],
  "Philippines": ["Manila", "Cebu City", "Davao City"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
  "Israel": ["Tel Aviv", "Jerusalem", "Haifa"],
  "Egypt": ["Cairo", "Alexandria", "Giza"],
};

const COUNTRY_LIST = Object.keys(COUNTRIES_AND_CITIES).sort();

// Common timezones
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Toronto", label: "Eastern Time (Canada)" },
  { value: "America/Vancouver", label: "Pacific Time (Canada)" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Buenos_Aires", label: "Buenos Aires" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "Europe/Rome", label: "Rome (CET)" },
  { value: "Europe/Zurich", label: "Zurich (CET)" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
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
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [newCustomSpecialty, setNewCustomSpecialty] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Availability state
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday
  const [addBlockedDateDialogOpen, setAddBlockedDateDialogOpen] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("17:00");
  const [newBlockedDate, setNewBlockedDate] = useState({ date: "", reason: "" });
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Sessions state
  const [sessionRequests, setSessionRequests] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [confirmingSession, setConfirmingSession] = useState<string | null>(null);

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

  // Fetch availability when coach is selected
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      if (!selectedCoachId) return;

      setLoadingAvailability(true);
      try {
        const [slots, blocked] = await Promise.all([
          coachService.fetchAvailability(selectedCoachId),
          coachService.fetchBlockedDates(selectedCoachId),
        ]);
        setAvailabilitySlots(slots);
        setBlockedDates(blocked);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailabilityData();
  }, [selectedCoachId]);

  // Fetch session requests when coach is selected
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedCoachId) return;

      setLoadingSessions(true);
      try {
        const sessions = await coachService.fetchSessionRequests(selectedCoachId);
        setSessionRequests(sessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [selectedCoachId]);

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

      // Separate predefined and custom specialties
      const predefinedSpecialtyKeys = SPECIALTIES.map(s => s.value);
      const allSpecialties = selectedCoach.specialties || [];
      const predefined = allSpecialties.filter(s => predefinedSpecialtyKeys.includes(s as ExpertSpecialty));
      const custom = allSpecialties.filter(s => !predefinedSpecialtyKeys.includes(s as ExpertSpecialty));
      setEditSpecialties(predefined);
      setCustomSpecialties(custom as string[]);

      setEditHourlyRate(selectedCoach.hourlyRate || 0);
      setEditYearsExperience(selectedCoach.yearsExperience || 0);
      setEditTimezone(selectedCoach.timezone || "");

      // Parse location (format: "City, Country")
      const location = selectedCoach.location || "";
      const locationParts = location.split(", ");
      if (locationParts.length === 2) {
        setEditCity(locationParts[0]);
        setEditCountry(locationParts[1]);
      } else {
        setEditCity("");
        setEditCountry("");
      }

      setEditLanguages(selectedCoach.languages || []);
      setIsEditingAbout(true);
    }
  };

  const handleCancelEditAbout = () => {
    setIsEditingAbout(false);
    setEditBio("");
    setEditPhotoUrl("");
    setEditSpecialties([]);
    setCustomSpecialties([]);
    setNewCustomSpecialty("");
    setEditHourlyRate(0);
    setEditYearsExperience(0);
    setEditTimezone("");
    setEditCountry("");
    setEditCity("");
    setEditLanguages([]);
  };

  const toggleEditSpecialty = (specialty: ExpertSpecialty) => {
    setEditSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleEditLanguage = (language: string) => {
    setEditLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = newCustomSpecialty.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;

    // Check if it already exists (either predefined or custom)
    const predefinedKeys = SPECIALTIES.map(s => s.value);
    if (predefinedKeys.includes(trimmed as ExpertSpecialty) || customSpecialties.includes(trimmed)) {
      toast.error('This specialty already exists');
      return;
    }

    setCustomSpecialties(prev => [...prev, trimmed]);
    setNewCustomSpecialty('');
  };

  const handleRemoveCustomSpecialty = (specialty: string) => {
    setCustomSpecialties(prev => prev.filter(s => s !== specialty));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCoachId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await storageService.uploadProfileImage(file, selectedCoachId);
      setEditPhotoUrl(url);
      toast.success('Photo uploaded successfully');
    } catch (err) {
      console.error('Error uploading photo:', err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!selectedCoachId) return;

    try {
      // Combine city and country into location
      const location = editCity && editCountry ? `${editCity}, ${editCountry}` : "";

      // Update coach profile
      await updateCoachMutation.mutateAsync({
        coachId: selectedCoachId,
        updates: {
          bio: editBio,
          photoUrl: editPhotoUrl,
          hourlyRate: editHourlyRate,
          yearsExperience: editYearsExperience,
          timezone: editTimezone,
          location: location,
          languages: editLanguages,
        },
      });

      // Update specialties separately - combine predefined and custom specialties
      const allSpecialties = [...editSpecialties, ...customSpecialties];
      await updateSpecialtiesMutation.mutateAsync({
        coachId: selectedCoachId,
        specialties: allSpecialties,
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

  // Availability handlers
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleAddAvailabilitySlot = async () => {
    if (!selectedCoachId) return;

    // Validate times
    if (newSlotStart >= newSlotEnd) {
      toast.error("End time must be after start time");
      return;
    }

    // Check for overlapping slots on the same day
    const daySlots = availabilitySlots.filter(s => s.day_of_week === selectedDay);
    const hasOverlap = daySlots.some(slot => {
      const existingStart = slot.start_time;
      const existingEnd = slot.end_time;
      // Check if new slot overlaps with existing
      return (newSlotStart < existingEnd && newSlotEnd > existingStart);
    });

    if (hasOverlap) {
      toast.error("This time slot overlaps with an existing slot");
      return;
    }

    setSavingAvailability(true);
    try {
      const newSlotData = await coachService.addAvailabilitySlot(selectedCoachId, {
        dayOfWeek: selectedDay,
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
      setAvailabilitySlots(prev => [...prev, newSlotData].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      }));
      // Reset to default times for next slot
      setNewSlotStart("09:00");
      setNewSlotEnd("17:00");
      toast.success(`Slot added for ${DAY_NAMES_FULL[selectedDay]}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add availability slot");
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleDeleteAvailabilitySlot = async (slotId: string) => {
    try {
      await coachService.deleteAvailabilitySlot(slotId);
      setAvailabilitySlots(prev => prev.filter(s => s.id !== slotId));
      toast.success("Availability slot removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove availability slot");
    }
  };

  const handleAddBlockedDate = async () => {
    if (!selectedCoachId || !newBlockedDate.date) {
      toast.error("Please select a date");
      return;
    }

    setSavingAvailability(true);
    try {
      const newBlocked = await coachService.addBlockedDate(
        selectedCoachId,
        newBlockedDate.date,
        newBlockedDate.reason || undefined
      );
      setBlockedDates(prev => [...prev, newBlocked].sort((a, b) =>
        a.blocked_date.localeCompare(b.blocked_date)
      ));
      setAddBlockedDateDialogOpen(false);
      setNewBlockedDate({ date: "", reason: "" });
      toast.success("Blocked date added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add blocked date");
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleDeleteBlockedDate = async (blockedDateId: string) => {
    try {
      await coachService.deleteBlockedDate(blockedDateId);
      setBlockedDates(prev => prev.filter(b => b.id !== blockedDateId));
      toast.success("Blocked date removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove blocked date");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Session handlers
  const handleConfirmSession = async (sessionId: string, slotIndex: number, slotTime: string) => {
    setConfirmingSession(sessionId);
    try {
      await coachService.confirmSessionRequest(sessionId, slotIndex, slotTime);
      // Refresh sessions
      const sessions = await coachService.fetchSessionRequests(selectedCoachId!);
      setSessionRequests(sessions);
      toast.success("Session confirmed!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm session");
    } finally {
      setConfirmingSession(null);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await coachService.cancelSessionRequest(sessionId);
      setSessionRequests(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Session cancelled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel session");
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Group availability slots by day
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    availabilitySlots.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });
    return grouped;
  }, [availabilitySlots]);

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

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">
              Sessions
              {sessionRequests.filter(s => s.status === 'pending_coach_review').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {sessionRequests.filter(s => s.status === 'pending_coach_review').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clients">Clients ({coachClients.length})</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionnaires ({coachQuestionnaires.length})</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Session Requests
                </CardTitle>
                <CardDescription>Review and confirm session requests from clients</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sessionRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No session requests</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Session requests from clients will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Requests */}
                    {sessionRequests.filter(s => s.status === 'pending_coach_review').length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-orange-600 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Pending Your Review ({sessionRequests.filter(s => s.status === 'pending_coach_review').length})
                        </h4>
                        {sessionRequests.filter(s => s.status === 'pending_coach_review').map((session: any) => {
                          const clientName = session.coaching_relationships?.profiles?.full_name || 'Unknown Client';
                          const proposedSlots = session.proposed_slots || [];

                          return (
                            <div key={session.id} className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-foreground">{clientName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {session.session_type === 'initial_review' ? 'Initial Review' : 'Follow-up'} • 30 min
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                  Awaiting Confirmation
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Client's proposed times ({proposedSlots.length} options):
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {proposedSlots.map((slot: any, idx: number) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="justify-start h-auto py-2 px-3"
                                      onClick={() => handleConfirmSession(session.id, idx, slot.time)}
                                      disabled={confirmingSession === session.id}
                                    >
                                      {confirmingSession === session.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <Check className="h-4 w-4 mr-2 text-green-600" />
                                      )}
                                      <span className="text-sm">{formatDateTime(slot.time)}</span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleCancelSession(session.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Confirmed Sessions */}
                    {sessionRequests.filter(s => s.status === 'scheduled').length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Upcoming Sessions ({sessionRequests.filter(s => s.status === 'scheduled').length})
                        </h4>
                        {sessionRequests.filter(s => s.status === 'scheduled').map((session: any) => {
                          const clientName = session.coaching_relationships?.profiles?.full_name || 'Unknown Client';

                          return (
                            <div key={session.id} className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{clientName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {session.session_type === 'initial_review' ? 'Initial Review' : 'Follow-up'} • 30 min
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="default" className="bg-green-600">
                                    Confirmed
                                  </Badge>
                                  <p className="text-sm font-medium mt-1">
                                    {session.scheduled_at ? formatDateTime(session.scheduled_at) : 'Time TBD'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Weekly Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                  <CardDescription>Click a day to manage your available time slots</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingAvailability ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Day Selector Row */}
                      <div className="flex gap-1">
                        {DAY_NAMES.map((day, dayIndex) => {
                          const daySlots = slotsByDay[dayIndex] || [];
                          const hasSlots = daySlots.length > 0;
                          const isSelected = selectedDay === dayIndex;

                          return (
                            <button
                              key={dayIndex}
                              onClick={() => setSelectedDay(dayIndex)}
                              className={`
                                flex-1 py-3 px-2 rounded-lg text-center transition-all
                                ${isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : hasSlots
                                    ? 'bg-primary/10 hover:bg-primary/20 text-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }
                              `}
                            >
                              <div className="text-xs font-medium">{day}</div>
                              {hasSlots && (
                                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                  {daySlots.length} slot{daySlots.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Day Content */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-foreground">{DAY_NAMES_FULL[selectedDay]}</h4>
                          <Badge variant="outline">
                            {(slotsByDay[selectedDay] || []).length} slot{(slotsByDay[selectedDay] || []).length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {/* Existing Slots for Selected Day */}
                        <div className="space-y-2 mb-4">
                          {(slotsByDay[selectedDay] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No availability set for {DAY_NAMES_FULL[selectedDay]}
                            </p>
                          ) : (
                            (slotsByDay[selectedDay] || []).map((slot: any) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteAvailabilitySlot(slot.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add New Slot Form */}
                        <div className="border-t pt-4">
                          <Label className="text-sm text-muted-foreground mb-3 block">Add time slot</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={newSlotStart}
                              onChange={(e) => setNewSlotStart(e.target.value)}
                              className="w-[120px]"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={newSlotEnd}
                              onChange={(e) => setNewSlotEnd(e.target.value)}
                              className="w-[120px]"
                            />
                            <Button
                              onClick={handleAddAvailabilitySlot}
                              disabled={savingAvailability}
                              size="sm"
                            >
                              {savingAvailability ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Sessions will be available in 30-minute slots within this time range
                          </p>
                        </div>
                      </div>

                      {/* Quick Overview */}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Total:</span>{' '}
                        {availabilitySlots.length} time slot{availabilitySlots.length !== 1 ? 's' : ''} across{' '}
                        {Object.keys(slotsByDay).length} day{Object.keys(slotsByDay).length !== 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Blocked Dates */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarOff className="h-5 w-5" />
                      Blocked Dates
                    </CardTitle>
                    <CardDescription>Dates when you're unavailable (vacation, holidays, etc.)</CardDescription>
                  </div>
                  <Dialog open={addBlockedDateDialogOpen} onOpenChange={setAddBlockedDateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Block Date
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Block a Date</DialogTitle>
                        <DialogDescription>Mark a specific date as unavailable</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="blocked-date">Date</Label>
                          <Input
                            id="blocked-date"
                            type="date"
                            value={newBlockedDate.date}
                            onChange={(e) => setNewBlockedDate(prev => ({ ...prev, date: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="block-reason">Reason (optional)</Label>
                          <Input
                            id="block-reason"
                            value={newBlockedDate.reason}
                            onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="e.g., Vacation, Conference, etc."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddBlockedDateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddBlockedDate} disabled={savingAvailability}>
                          {savingAvailability && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Block Date
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingAvailability ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : blockedDates.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No blocked dates</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Block specific dates when you won't be available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockedDates.map((blocked: any) => (
                        <div
                          key={blocked.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <CalendarOff className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(blocked.blocked_date + 'T00:00:00').toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              {blocked.reason && (
                                <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteBlockedDate(blocked.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-2 border-border">
                            {editPhotoUrl && <AvatarImage src={editPhotoUrl} alt="Preview" />}
                            <AvatarFallback className="text-2xl bg-muted">
                              <User className="h-10 w-10 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          {uploadingPhoto && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="relative"
                              disabled={uploadingPhoto}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploadingPhoto}
                              />
                              {uploadingPhoto ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Image className="h-4 w-4 mr-2" />
                                  Upload Photo
                                </>
                              )}
                            </Button>
                            {editPhotoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditPhotoUrl("")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Upload a profile photo (max 5MB). Supported: JPG, PNG, GIF, WebP
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
                    <div className="space-y-3">
                      <Label>Specialties</Label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALTIES.map((specialty) => (
                          <Badge
                            key={specialty.value}
                            variant={editSpecialties.includes(specialty.value) ? "default" : "outline"}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => toggleEditSpecialty(specialty.value)}
                          >
                            {editSpecialties.includes(specialty.value) && <Check className="h-3 w-3 mr-1" />}
                            {specialty.label}
                          </Badge>
                        ))}
                      </div>

                      {/* Custom Specialties */}
                      {customSpecialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground w-full">Custom Specialties:</span>
                          {customSpecialties.map((specialty) => (
                            <Badge
                              key={specialty}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/20"
                              onClick={() => handleRemoveCustomSpecialty(specialty)}
                            >
                              {specialty.replace(/_/g, ' ')}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Add Custom Specialty */}
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Add custom specialty..."
                          value={newCustomSpecialty}
                          onChange={(e) => setNewCustomSpecialty(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSpecialty();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomSpecialty}
                          disabled={!newCustomSpecialty.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click predefined specialties to toggle, or add custom ones
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

                    {/* Location (Country/City), Timezone & Language */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                          value={editCountry}
                          onValueChange={(value) => {
                            setEditCountry(value);
                            setEditCity(""); // Reset city when country changes
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRY_LIST.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Select
                          value={editCity}
                          onValueChange={setEditCity}
                          disabled={!editCountry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={editCountry ? "Select city" : "Select country first"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {editCountry && COUNTRIES_AND_CITIES[editCountry]?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={editTimezone}
                          onValueChange={setEditTimezone}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Languages (click to select)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                          {LANGUAGES.map(lang => (
                            <Badge
                              key={lang}
                              variant={editLanguages.includes(lang) ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => toggleEditLanguage(lang)}
                            >
                              {editLanguages.includes(lang) && <Check className="h-3 w-3 mr-1" />}
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        {editLanguages.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Selected: {editLanguages.join(", ")}
                          </p>
                        )}
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
