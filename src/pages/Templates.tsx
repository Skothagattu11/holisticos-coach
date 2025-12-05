import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useQuestionnaires,
  useCreateQuestionnaire,
  useUpdateQuestionnaire,
  useDeleteQuestionnaire,
} from "@/hooks/useQuestionnaires";
import { planService } from "@/lib/services/planService";
import { coachService } from "@/lib/services/coachService";
import {
  Plus,
  Loader2,
  FileQuestion,
  Trash2,
  XCircle,
  ListChecks,
  MoreVertical,
  Pencil,
  Copy,
  Check,
  Utensils,
  Dumbbell,
  Moon,
  Brain,
  Target,
  Scale,
  Clock,
  FileText,
  LayoutTemplate,
  Lock,
  ChevronDown,
  ChevronRight,
  Library,
  User,
  Eye,
} from "lucide-react";
import type { Questionnaire, QuestionType, PlanItemCategory, PlanItemFrequency } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Text (Free Response)" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multi_choice", label: "Multiple Choice" },
  { value: "scale", label: "Scale (1-10)" },
  { value: "number", label: "Number" },
];

const SPECIALTIES = [
  { value: "general", label: "General" },
  { value: "nutrition", label: "Nutrition" },
  { value: "fitness", label: "Fitness" },
  { value: "sleep", label: "Sleep" },
  { value: "stress", label: "Stress Management" },
  { value: "longevity", label: "Longevity" },
];

// Predefined system questionnaire templates
const PREDEFINED_QUESTIONNAIRES: Array<{
  id: string;
  title: string;
  description: string;
  specialty: string;
  questions: Array<{
    id: string;
    question: string;
    type: QuestionType;
    options: string[];
    required: boolean;
  }>;
}> = [
  {
    id: "system-general-intake",
    title: "General Health Intake",
    description: "Comprehensive initial health assessment for new clients",
    specialty: "general",
    questions: [
      { id: "g1", question: "What are your primary health and wellness goals?", type: "text", options: [], required: true },
      { id: "g2", question: "How would you rate your current overall health?", type: "scale", options: [], required: true },
      { id: "g3", question: "Do you have any diagnosed medical conditions?", type: "text", options: [], required: false },
      { id: "g4", question: "Are you currently taking any medications or supplements?", type: "text", options: [], required: false },
      { id: "g5", question: "How many hours of sleep do you typically get per night?", type: "single_choice", options: ["Less than 5", "5-6 hours", "6-7 hours", "7-8 hours", "More than 8"], required: true },
      { id: "g6", question: "What is your current stress level?", type: "scale", options: [], required: true },
    ],
  },
  {
    id: "system-nutrition-assessment",
    title: "Nutrition Assessment",
    description: "Evaluate dietary habits and nutrition goals",
    specialty: "nutrition",
    questions: [
      { id: "n1", question: "How many meals do you typically eat per day?", type: "single_choice", options: ["1-2 meals", "3 meals", "4-5 small meals", "Grazing throughout day"], required: true },
      { id: "n2", question: "Do you follow any specific diet?", type: "single_choice", options: ["No specific diet", "Vegetarian", "Vegan", "Keto/Low-carb", "Paleo", "Mediterranean", "Other"], required: true },
      { id: "n3", question: "How many servings of vegetables do you eat daily?", type: "single_choice", options: ["0-1 servings", "2-3 servings", "4-5 servings", "6+ servings"], required: true },
      { id: "n4", question: "How much water do you drink daily?", type: "single_choice", options: ["Less than 4 cups", "4-6 cups", "6-8 cups", "8+ cups"], required: true },
      { id: "n5", question: "Do you have any food allergies or intolerances?", type: "text", options: [], required: false },
      { id: "n6", question: "What are your biggest nutrition challenges?", type: "multi_choice", options: ["Meal planning", "Portion control", "Emotional eating", "Late-night snacking", "Eating out frequently", "Lack of time to cook"], required: true },
    ],
  },
  {
    id: "system-fitness-assessment",
    title: "Fitness Assessment",
    description: "Evaluate current fitness level and exercise habits",
    specialty: "fitness",
    questions: [
      { id: "f1", question: "How many days per week do you currently exercise?", type: "single_choice", options: ["0 days", "1-2 days", "3-4 days", "5-6 days", "Every day"], required: true },
      { id: "f2", question: "What types of exercise do you enjoy?", type: "multi_choice", options: ["Walking/Running", "Strength training", "Yoga/Pilates", "Swimming", "Cycling", "Group fitness classes", "Sports"], required: true },
      { id: "f3", question: "How would you rate your current fitness level?", type: "scale", options: [], required: true },
      { id: "f4", question: "Do you have any injuries or physical limitations?", type: "text", options: [], required: false },
      { id: "f5", question: "What is your primary fitness goal?", type: "single_choice", options: ["Lose weight", "Build muscle", "Improve endurance", "Increase flexibility", "General fitness", "Athletic performance"], required: true },
      { id: "f6", question: "Do you have access to a gym or exercise equipment?", type: "single_choice", options: ["Full gym access", "Home gym", "Basic equipment", "No equipment"], required: true },
    ],
  },
  {
    id: "system-sleep-assessment",
    title: "Sleep Quality Assessment",
    description: "Evaluate sleep patterns and quality",
    specialty: "sleep",
    questions: [
      { id: "s1", question: "What time do you typically go to bed?", type: "single_choice", options: ["Before 9 PM", "9-10 PM", "10-11 PM", "11 PM-12 AM", "After midnight"], required: true },
      { id: "s2", question: "What time do you typically wake up?", type: "single_choice", options: ["Before 5 AM", "5-6 AM", "6-7 AM", "7-8 AM", "After 8 AM"], required: true },
      { id: "s3", question: "How would you rate your sleep quality?", type: "scale", options: [], required: true },
      { id: "s4", question: "Do you have trouble falling asleep?", type: "single_choice", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], required: true },
      { id: "s5", question: "Do you wake up during the night?", type: "single_choice", options: ["Never", "1-2 times", "3-4 times", "More than 4 times"], required: true },
      { id: "s6", question: "What factors affect your sleep?", type: "multi_choice", options: ["Stress/anxiety", "Screen time before bed", "Caffeine", "Noise", "Light", "Temperature", "Partner/children"], required: false },
    ],
  },
  {
    id: "system-stress-assessment",
    title: "Stress & Mental Wellness Assessment",
    description: "Evaluate stress levels and mental well-being",
    specialty: "stress",
    questions: [
      { id: "st1", question: "How would you rate your current stress level?", type: "scale", options: [], required: true },
      { id: "st2", question: "What are your main sources of stress?", type: "multi_choice", options: ["Work", "Family", "Finances", "Health", "Relationships", "Time management", "Other"], required: true },
      { id: "st3", question: "How do you currently manage stress?", type: "multi_choice", options: ["Exercise", "Meditation", "Talking to friends/family", "Hobbies", "Therapy", "I don't have strategies"], required: true },
      { id: "st4", question: "How often do you feel overwhelmed?", type: "single_choice", options: ["Rarely", "Sometimes", "Often", "Almost always"], required: true },
      { id: "st5", question: "Do you practice any mindfulness or relaxation techniques?", type: "single_choice", options: ["Daily", "A few times a week", "Occasionally", "Never"], required: true },
      { id: "st6", question: "What mental wellness support would be most helpful?", type: "text", options: [], required: false },
    ],
  },
  {
    id: "system-longevity-assessment",
    title: "Longevity & Preventive Health Assessment",
    description: "Evaluate habits related to long-term health and longevity",
    specialty: "longevity",
    questions: [
      { id: "l1", question: "What is your family health history? (Any chronic conditions)", type: "text", options: [], required: false },
      { id: "l2", question: "How often do you get health check-ups?", type: "single_choice", options: ["Annual", "Every 2-3 years", "Only when sick", "Rarely/Never"], required: true },
      { id: "l3", question: "Do you engage in any longevity practices?", type: "multi_choice", options: ["Intermittent fasting", "Cold exposure", "Sauna/heat therapy", "Supplements", "Meditation", "None"], required: false },
      { id: "l4", question: "How important is preventive health to you?", type: "scale", options: [], required: true },
      { id: "l5", question: "What aspects of aging concern you most?", type: "multi_choice", options: ["Cognitive decline", "Mobility/strength", "Chronic disease", "Energy levels", "Appearance", "Independence"], required: false },
      { id: "l6", question: "What is your primary longevity goal?", type: "text", options: [], required: true },
    ],
  },
];

const CATEGORY_CONFIG: Record<PlanItemCategory, { label: string; icon: React.ElementType; color: string }> = {
  nutrition: { label: "Nutrition", icon: Utensils, color: "text-orange-500 bg-orange-500/10" },
  fitness: { label: "Fitness", icon: Dumbbell, color: "text-blue-500 bg-blue-500/10" },
  recovery: { label: "Recovery", icon: Moon, color: "text-purple-500 bg-purple-500/10" },
  mindfulness: { label: "Mindfulness", icon: Brain, color: "text-pink-500 bg-pink-500/10" },
  habits: { label: "Habits", icon: Target, color: "text-green-500 bg-green-500/10" },
  measurements: { label: "Measurements", icon: Scale, color: "text-cyan-500 bg-cyan-500/10" },
};

const FREQUENCY_OPTIONS: { value: PlanItemFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "weekdays", label: "Weekdays" },
];

interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    title: string;
    description?: string;
    category: PlanItemCategory;
    frequency: PlanItemFrequency;
    scheduledTime?: string;
    durationMinutes?: number;
  }>;
  createdAt: string;
}

const Templates = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("plans");
  const [expertId, setExpertId] = useState<string | null>(null);

  // ==================== PLAN TEMPLATES STATE ====================
  const [planTemplates, setPlanTemplates] = useState<PlanTemplate[]>([]);
  const [loadingPlanTemplates, setLoadingPlanTemplates] = useState(true);
  const [createPlanTemplateOpen, setCreatePlanTemplateOpen] = useState(false);
  const [editingPlanTemplate, setEditingPlanTemplate] = useState<PlanTemplate | null>(null);
  const [deletePlanTemplateId, setDeletePlanTemplateId] = useState<string | null>(null);

  // New plan template form
  const [newPlanTemplate, setNewPlanTemplate] = useState({
    name: "",
    description: "",
    items: [] as PlanTemplate["items"],
  });

  // New plan item form
  const [newPlanItem, setNewPlanItem] = useState({
    title: "",
    description: "",
    category: "habits" as PlanItemCategory,
    frequency: "daily" as PlanItemFrequency,
    scheduledTime: "",
    durationMinutes: "",
  });

  // ==================== QUESTIONNAIRE STATE ====================
  const { data: questionnaires = [], isLoading: loadingQuestionnaires, error: questionnaireError } = useQuestionnaires();
  const createQuestionnaire = useCreateQuestionnaire();
  const updateQuestionnaire = useUpdateQuestionnaire();
  const deleteQuestionnaire = useDeleteQuestionnaire();

  const [createQuestionnaireOpen, setCreateQuestionnaireOpen] = useState(false);
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    question: string;
    type: QuestionType;
    options: string[];
    required: boolean;
  } | null>(null);

  const [newQuestionnaire, setNewQuestionnaire] = useState({
    title: "",
    description: "",
    specialty: "general",
    questions: [] as Array<{
      id?: string;
      question: string;
      type: QuestionType;
      options: string[];
      required: boolean;
    }>,
  });

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    type: "text" as QuestionType,
    options: [] as string[],
    required: true,
  });

  const [optionInput, setOptionInput] = useState("");
  const [editOptionInput, setEditOptionInput] = useState("");

  // Expanded category sections
  const [expandedSystemCategories, setExpandedSystemCategories] = useState<string[]>(["general"]);
  const [expandedUserCategories, setExpandedUserCategories] = useState<string[]>([]);

  // Preview system template
  const [previewTemplate, setPreviewTemplate] = useState<typeof PREDEFINED_QUESTIONNAIRES[0] | null>(null);

  // ==================== LOAD PLAN TEMPLATES ====================
  // Load expert ID for the current user
  useEffect(() => {
    const loadExpertId = async () => {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }
      console.log("Loading expert ID for user:", user.id);
      try {
        const id = await coachService.getExpertIdForUser(user.id);
        console.log("Expert ID loaded:", id);
        setExpertId(id);
      } catch (error) {
        console.error("Failed to get expert ID:", error);
      }
    };
    loadExpertId();
  }, [user?.id]);

  useEffect(() => {
    loadPlanTemplates();
  }, []);

  const loadPlanTemplates = async () => {
    setLoadingPlanTemplates(true);
    try {
      const templates = await planService.fetchTemplates();
      setPlanTemplates(templates);
    } catch (error) {
      console.error("Failed to load plan templates:", error);
    } finally {
      setLoadingPlanTemplates(false);
    }
  };

  // ==================== PLAN TEMPLATE HANDLERS ====================
  const handleCreatePlanTemplate = async () => {
    if (!newPlanTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (newPlanTemplate.items.length === 0) {
      toast.error("Add at least one item to the template");
      return;
    }

    try {
      await planService.createTemplate(
        newPlanTemplate.name,
        newPlanTemplate.description || undefined,
        newPlanTemplate.items
      );
      toast.success("Plan template created!");
      setCreatePlanTemplateOpen(false);
      setNewPlanTemplate({ name: "", description: "", items: [] });
      loadPlanTemplates();
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    }
  };

  const handleUpdatePlanTemplate = async () => {
    if (!editingPlanTemplate) return;

    try {
      await planService.updateTemplate(editingPlanTemplate.id, {
        name: newPlanTemplate.name,
        description: newPlanTemplate.description || undefined,
        items: newPlanTemplate.items,
      });
      toast.success("Template updated!");
      setEditingPlanTemplate(null);
      setNewPlanTemplate({ name: "", description: "", items: [] });
      loadPlanTemplates();
    } catch (error) {
      toast.error("Failed to update template");
      console.error(error);
    }
  };

  const handleDeletePlanTemplate = async () => {
    if (!deletePlanTemplateId) return;

    try {
      await planService.deleteTemplate(deletePlanTemplateId);
      toast.success("Template deleted");
      setDeletePlanTemplateId(null);
      loadPlanTemplates();
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleAddPlanItem = () => {
    if (!newPlanItem.title.trim()) {
      toast.error("Item title is required");
      return;
    }

    setNewPlanTemplate(prev => ({
      ...prev,
      items: [...prev.items, {
        title: newPlanItem.title,
        description: newPlanItem.description || undefined,
        category: newPlanItem.category,
        frequency: newPlanItem.frequency,
        scheduledTime: newPlanItem.scheduledTime || undefined,
        durationMinutes: newPlanItem.durationMinutes ? parseInt(newPlanItem.durationMinutes) : undefined,
      }],
    }));

    setNewPlanItem({
      title: "",
      description: "",
      category: "habits",
      frequency: "daily",
      scheduledTime: "",
      durationMinutes: "",
    });
  };

  const handleRemovePlanItem = (index: number) => {
    setNewPlanTemplate(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const openEditPlanTemplate = (template: PlanTemplate) => {
    setEditingPlanTemplate(template);
    setNewPlanTemplate({
      name: template.name,
      description: template.description || "",
      items: template.items,
    });
  };

  const handleDuplicatePlanTemplate = async (template: PlanTemplate) => {
    try {
      await planService.createTemplate(
        `${template.name} (Copy)`,
        template.description,
        template.items
      );
      toast.success("Template duplicated!");
      loadPlanTemplates();
    } catch (error) {
      toast.error("Failed to duplicate template");
      console.error(error);
    }
  };

  // ==================== QUESTIONNAIRE HANDLERS ====================
  const resetQuestionForm = () => {
    setNewQuestion({
      question: "",
      type: "text",
      options: [],
      required: true,
    });
    setOptionInput("");
  };

  const handleCreateQuestionnaire = async () => {
    if (!expertId && !user?.id) {
      toast.error("Unable to identify coach profile. Please try again.");
      return;
    }

    if (!newQuestionnaire.title) {
      toast.error("Title is required");
      return;
    }

    if (newQuestionnaire.questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    try {
      await createQuestionnaire.mutateAsync({
        title: newQuestionnaire.title,
        description: newQuestionnaire.description,
        specialty: newQuestionnaire.specialty,
        createdBy: expertId || user?.id || "",
        questions: newQuestionnaire.questions.map((q, idx) => ({
          id: `q_${idx}`,
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required,
        })),
      });
      toast.success("Questionnaire template created!");
      setCreateQuestionnaireOpen(false);
      setNewQuestionnaire({
        title: "",
        description: "",
        specialty: "general",
        questions: [],
      });
    } catch (err) {
      toast.error("Failed to create questionnaire");
    }
  };

  const handleAddQuestionToNew = () => {
    if (!newQuestion.question) {
      toast.error("Question text is required");
      return;
    }

    if ((newQuestion.type === "single_choice" || newQuestion.type === "multi_choice") && newQuestion.options.length < 2) {
      toast.error("Add at least 2 options for choice questions");
      return;
    }

    setNewQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion }],
    }));

    resetQuestionForm();
  };

  const handleAddQuestionToExisting = async () => {
    if (!selectedQuestionnaire || !newQuestion.question) {
      toast.error("Question text is required");
      return;
    }

    if ((newQuestion.type === "single_choice" || newQuestion.type === "multi_choice") && newQuestion.options.length < 2) {
      toast.error("Add at least 2 options for choice questions");
      return;
    }

    try {
      const updatedQuestions = [
        ...selectedQuestionnaire.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          required: q.required,
        })),
        {
          id: `q_${selectedQuestionnaire.questions.length}`,
          question: newQuestion.question,
          type: newQuestion.type,
          options: newQuestion.options,
          required: newQuestion.required,
        },
      ];

      await updateQuestionnaire.mutateAsync({
        questionnaireId: selectedQuestionnaire.id,
        updates: { questions: updatedQuestions },
      });
      toast.success("Question added!");
      setAddQuestionDialogOpen(false);
      setSelectedQuestionnaire(null);
      resetQuestionForm();
    } catch (err) {
      toast.error("Failed to add question");
    }
  };

  const handleToggleActive = async (questionnaire: Questionnaire) => {
    try {
      await updateQuestionnaire.mutateAsync({
        questionnaireId: questionnaire.id,
        updates: { isActive: !questionnaire.isActive },
      });
      toast.success(questionnaire.isActive ? "Questionnaire deactivated" : "Questionnaire activated");
    } catch (err) {
      toast.error("Failed to update questionnaire");
    }
  };

  const handleDeleteQuestion = async (questionnaire: Questionnaire, questionId: string) => {
    try {
      const updatedQuestions = questionnaire.questions
        .filter(q => q.id !== questionId)
        .map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          required: q.required,
        }));

      await updateQuestionnaire.mutateAsync({
        questionnaireId: questionnaire.id,
        updates: { questions: updatedQuestions },
      });
      toast.success("Question deleted");
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const openEditQuestionDialog = (questionnaire: Questionnaire, question: typeof questionnaire.questions[0]) => {
    setSelectedQuestionnaire(questionnaire);
    setEditingQuestion({
      id: question.id,
      question: question.question,
      type: question.type,
      options: question.options || [],
      required: question.required,
    });
    setEditQuestionDialogOpen(true);
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestionnaire || !editingQuestion) return;

    if (!editingQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    if ((editingQuestion.type === "single_choice" || editingQuestion.type === "multi_choice") && editingQuestion.options.length < 2) {
      toast.error("Add at least 2 options for choice questions");
      return;
    }

    try {
      const updatedQuestions = selectedQuestionnaire.questions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            id: editingQuestion.id,
            question: editingQuestion.question,
            type: editingQuestion.type,
            options: editingQuestion.options,
            required: editingQuestion.required,
          };
        }
        return {
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          required: q.required,
        };
      });

      await updateQuestionnaire.mutateAsync({
        questionnaireId: selectedQuestionnaire.id,
        updates: { questions: updatedQuestions },
      });
      toast.success("Question updated!");
      setEditQuestionDialogOpen(false);
      setSelectedQuestionnaire(null);
      setEditingQuestion(null);
      setEditOptionInput("");
    } catch (err) {
      toast.error("Failed to update question");
    }
  };

  const addEditOption = () => {
    if (editOptionInput.trim() && editingQuestion) {
      setEditingQuestion(prev => prev ? ({
        ...prev,
        options: [...prev.options, editOptionInput.trim()],
      }) : null);
      setEditOptionInput("");
    }
  };

  const removeEditOption = (index: number) => {
    if (editingQuestion) {
      setEditingQuestion(prev => prev ? ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }) : null);
    }
  };

  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    if (!confirm("Are you sure you want to delete this questionnaire?")) return;

    try {
      await deleteQuestionnaire.mutateAsync(questionnaireId);
      toast.success("Questionnaire deleted");
    } catch (err) {
      toast.error("Failed to delete questionnaire");
    }
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewQuestion(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
      setOptionInput("");
    }
  };

  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const removeQuestionFromNew = (index: number) => {
    setNewQuestionnaire(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Count items by category
  const countByCategory = (items: PlanTemplate["items"]) => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  };

  // Group questionnaires by specialty
  const groupBySpecialty = <T extends { specialty?: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
      const specialty = item.specialty || "general";
      if (!acc[specialty]) acc[specialty] = [];
      acc[specialty].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const systemTemplatesByCategory = groupBySpecialty(PREDEFINED_QUESTIONNAIRES);
  const userTemplatesByCategory = groupBySpecialty(questionnaires);

  const toggleSystemCategory = (category: string) => {
    setExpandedSystemCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleUserCategory = (category: string) => {
    setExpandedUserCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Use system template - copies it and sets as default
  const handleUseSystemTemplate = async (template: typeof PREDEFINED_QUESTIONNAIRES[0]) => {
    const coachId = expertId || user?.id;
    console.log("Use template - expertId:", expertId, "user?.id:", user?.id, "using:", coachId);

    if (!coachId) {
      toast.error("Unable to identify coach profile. Please try again.");
      return;
    }

    try {
      console.log("Creating questionnaire with expert_id:", coachId);
      // Create the questionnaire
      const newQuestionnaire = await createQuestionnaire.mutateAsync({
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

      toast.success(`"${template.title}" is now your default questionnaire!`);
    } catch (err: any) {
      console.error("Failed to use template:", err);
      toast.error(err?.message || "Failed to use template");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Templates</h1>
        <p className="text-muted-foreground">
          Create reusable plan and questionnaire templates for your clients
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Plan Templates
          </TabsTrigger>
          <TabsTrigger value="questionnaires" className="gap-2">
            <FileQuestion className="h-4 w-4" />
            Questionnaires
          </TabsTrigger>
        </TabsList>

        {/* ==================== PLAN TEMPLATES TAB ==================== */}
        <TabsContent value="plans" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Plan Templates</h2>
              <p className="text-sm text-muted-foreground">
                Create coaching plan templates to quickly apply to clients
              </p>
            </div>
            <Dialog open={createPlanTemplateOpen || !!editingPlanTemplate} onOpenChange={(open) => {
              if (!open) {
                setCreatePlanTemplateOpen(false);
                setEditingPlanTemplate(null);
                setNewPlanTemplate({ name: "", description: "", items: [] });
              } else {
                setCreatePlanTemplateOpen(true);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlanTemplate ? "Edit Plan Template" : "Create Plan Template"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlanTemplate
                      ? "Update your plan template"
                      : "Build a reusable plan template with predefined items"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Template Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        value={newPlanTemplate.name}
                        onChange={(e) => setNewPlanTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Beginner Fitness Plan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-desc">Description</Label>
                      <Textarea
                        id="template-desc"
                        value={newPlanTemplate.description}
                        onChange={(e) => setNewPlanTemplate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe when to use this template..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    <Label>Items ({newPlanTemplate.items.length})</Label>
                    {newPlanTemplate.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        No items added yet
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {newPlanTemplate.items.map((item, idx) => {
                          const config = CATEGORY_CONFIG[item.category];
                          const Icon = config?.icon || Target;
                          return (
                            <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                              <div className={cn("p-1.5 rounded-md", config?.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs capitalize">{item.frequency}</Badge>
                                  {item.scheduledTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(item.scheduledTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemovePlanItem(idx)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Item Form */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Add Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={newPlanItem.title}
                          onChange={(e) => setNewPlanItem(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Morning Protein Shake"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newPlanItem.description}
                          onChange={(e) => setNewPlanItem(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Add details..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newPlanItem.category}
                            onValueChange={(v) => setNewPlanItem(prev => ({ ...prev, category: v as PlanItemCategory }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(CATEGORY_CONFIG) as [PlanItemCategory, typeof CATEGORY_CONFIG[PlanItemCategory]][]).map(
                                ([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select
                            value={newPlanItem.frequency}
                            onValueChange={(v) => setNewPlanItem(prev => ({ ...prev, frequency: v as PlanItemFrequency }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Scheduled Time</Label>
                          <Input
                            type="time"
                            value={newPlanItem.scheduledTime}
                            onChange={(e) => setNewPlanItem(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (min)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            value={newPlanItem.durationMinutes}
                            onChange={(e) => setNewPlanItem(prev => ({ ...prev, durationMinutes: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={handleAddPlanItem} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setCreatePlanTemplateOpen(false);
                    setEditingPlanTemplate(null);
                    setNewPlanTemplate({ name: "", description: "", items: [] });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingPlanTemplate ? handleUpdatePlanTemplate : handleCreatePlanTemplate}>
                    {editingPlanTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Plan Templates List */}
          {loadingPlanTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : planTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No plan templates yet</h3>
                <p className="text-muted-foreground">Create your first template to quickly set up plans for clients.</p>
                <Button onClick={() => setCreatePlanTemplateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planTemplates.map((template) => {
                const categoryCounts = countByCategory(template.items);
                return (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ListChecks className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {template.items.length} items
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditPlanTemplate(template)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicatePlanTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletePlanTemplateId(template.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(categoryCounts).map(([category, count]) => {
                          const config = CATEGORY_CONFIG[category as PlanItemCategory];
                          if (!config) return null;
                          return (
                            <Badge key={category} variant="outline" className="text-xs gap-1">
                              <config.icon className="h-3 w-3" />
                              {count}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================== QUESTIONNAIRES TAB ==================== */}
        <TabsContent value="questionnaires" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Questionnaire Templates</h2>
              <p className="text-sm text-muted-foreground">
                Use predefined templates or create your own intake questionnaires
              </p>
            </div>

            <Dialog open={createQuestionnaireOpen} onOpenChange={setCreateQuestionnaireOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Questionnaire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Questionnaire Template</DialogTitle>
                  <DialogDescription>
                    Build a questionnaire with custom questions for client intake
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="q-title">Title *</Label>
                      <Input
                        id="q-title"
                        value={newQuestionnaire.title}
                        onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Initial Health Assessment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-description">Description</Label>
                      <Textarea
                        id="q-description"
                        value={newQuestionnaire.description}
                        onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Select
                        value={newQuestionnaire.specialty}
                        onValueChange={(value) => setNewQuestionnaire(prev => ({ ...prev, specialty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <Label>Questions ({newQuestionnaire.questions.length})</Label>
                    {newQuestionnaire.questions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        No questions added yet
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {newQuestionnaire.questions.map((q, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                            <span className="text-sm font-medium text-muted-foreground mt-1">{idx + 1}.</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{q.question}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {QUESTION_TYPES.find(t => t.value === q.type)?.label}
                                </Badge>
                                {q.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeQuestionFromNew(idx)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Question Form */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Add Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Input
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="Enter your question..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={newQuestion.type}
                            onValueChange={(value: QuestionType) => setNewQuestion(prev => ({ ...prev, type: value, options: [] }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Required</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              checked={newQuestion.required}
                              onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, required: checked }))}
                            />
                            <Label className="text-sm text-muted-foreground">
                              {newQuestion.required ? "Yes" : "No"}
                            </Label>
                          </div>
                        </div>
                      </div>

                      {(newQuestion.type === "single_choice" || newQuestion.type === "multi_choice") && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="flex gap-2">
                            <Input
                              value={optionInput}
                              onChange={(e) => setOptionInput(e.target.value)}
                              placeholder="Add option..."
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                            />
                            <Button type="button" variant="outline" onClick={addOption}>
                              Add
                            </Button>
                          </div>
                          {newQuestion.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newQuestion.options.map((opt, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1">
                                  {opt}
                                  <button onClick={() => removeOption(idx)}>
                                    <XCircle className="h-3 w-3 ml-1" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <Button type="button" onClick={handleAddQuestionToNew} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateQuestionnaireOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateQuestionnaire} disabled={createQuestionnaire.isPending}>
                    {createQuestionnaire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Questionnaire
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Questionnaires - Two Sections: System Templates & My Templates */}
          {loadingQuestionnaires ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questionnaireError ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-destructive">Failed to load questionnaires</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* ====== SYSTEM TEMPLATES SECTION ====== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">System Templates</h3>
                  <Badge variant="secondary" className="text-xs">
                    {PREDEFINED_QUESTIONNAIRES.length} templates
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pre-built questionnaire templates organized by category. Copy any template to customize it.
                </p>

                <div className="space-y-3">
                  {SPECIALTIES.map(specialty => {
                    const templates = systemTemplatesByCategory[specialty.value] || [];
                    if (templates.length === 0) return null;

                    const isExpanded = expandedSystemCategories.includes(specialty.value);

                    return (
                      <Card key={specialty.value} className="overflow-hidden">
                        <button
                          onClick={() => toggleSystemCategory(specialty.value)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{specialty.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {templates.length}
                            </Badge>
                          </div>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t bg-muted/20">
                            {templates.map(template => (
                              <div
                                key={template.id}
                                className="flex items-center justify-between p-3 bg-background rounded-lg border mt-2"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileQuestion className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{template.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {template.questions.length} questions
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPreviewTemplate(template)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUseSystemTemplate(template)}
                                    disabled={createQuestionnaire.isPending}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Use Template
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ====== MY TEMPLATES SECTION ====== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">My Templates</h3>
                  <Badge variant="secondary" className="text-xs">
                    {questionnaires.length} templates
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your custom questionnaire templates. Create new ones or copy from system templates.
                </p>

                {questionnaires.length === 0 ? (
                  <Card className="p-8">
                    <div className="text-center space-y-3">
                      <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground" />
                      <h4 className="font-medium">No custom questionnaires yet</h4>
                      <p className="text-sm text-muted-foreground">
                        Create your own questionnaire or copy a system template to get started.
                      </p>
                      <Button size="sm" onClick={() => setCreateQuestionnaireOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Questionnaire
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {SPECIALTIES.map(specialty => {
                      const templates = userTemplatesByCategory[specialty.value] || [];
                      if (templates.length === 0) return null;

                      const isExpanded = expandedUserCategories.includes(specialty.value);

                      return (
                        <Card key={specialty.value} className="overflow-hidden">
                          <button
                            onClick={() => toggleUserCategory(specialty.value)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{specialty.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {templates.length}
                              </Badge>
                            </div>
                          </button>

                          {isExpanded && (
                            <Accordion type="single" collapsible className="px-4 pb-4 border-t bg-muted/20">
                              {templates.map((questionnaire: Questionnaire) => (
                                <AccordionItem
                                  key={questionnaire.id}
                                  value={questionnaire.id}
                                  className="border rounded-lg bg-background mt-2"
                                >
                                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <FileQuestion className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-medium text-sm">{questionnaire.title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {questionnaire.questions?.length || 0} questions
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant={questionnaire.isActive ? "default" : "secondary"} className="text-xs">
                                        {questionnaire.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-4">
                                    {questionnaire.description && (
                                      <p className="text-sm text-muted-foreground mb-3">{questionnaire.description}</p>
                                    )}

                                    <div className="space-y-2 mb-4">
                                      {questionnaire.questions?.map((question, idx) => (
                                        <div
                                          key={question.id}
                                          className="flex items-start gap-2 p-2 border rounded bg-muted/30"
                                        >
                                          <span className="text-xs font-medium text-muted-foreground mt-0.5">
                                            {idx + 1}.
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm">{question.question}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                              <Badge variant="outline" className="text-xs">
                                                {QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}
                                              </Badge>
                                              {question.required && (
                                                <Badge variant="secondary" className="text-xs">Required</Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              onClick={() => openEditQuestionDialog(questionnaire, question)}
                                            >
                                              <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              onClick={() => handleDeleteQuestion(questionnaire, question.id)}
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                      {(!questionnaire.questions || questionnaire.questions.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-3">
                                          No questions in this questionnaire
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={questionnaire.isActive}
                                          onCheckedChange={() => handleToggleActive(questionnaire)}
                                        />
                                        <Label className="text-xs">Active</Label>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            setSelectedQuestionnaire(questionnaire);
                                            setAddQuestionDialogOpen(true);
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Question
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteQuestionnaire(questionnaire.id)}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </Card>
                      );
                    })}

                    {/* Show uncategorized questionnaires */}
                    {questionnaires.filter(q => !q.specialty || !SPECIALTIES.find(s => s.value === q.specialty)).length > 0 && (
                      <Card className="overflow-hidden">
                        <button
                          onClick={() => toggleUserCategory("uncategorized")}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedUserCategories.includes("uncategorized") ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">Uncategorized</span>
                            <Badge variant="outline" className="text-xs">
                              {questionnaires.filter(q => !q.specialty || !SPECIALTIES.find(s => s.value === q.specialty)).length}
                            </Badge>
                          </div>
                        </button>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Question to Existing Questionnaire Dialog */}
      <Dialog open={addQuestionDialogOpen} onOpenChange={(open) => {
        setAddQuestionDialogOpen(open);
        if (!open) {
          setSelectedQuestionnaire(null);
          resetQuestionForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Add a new question to "{selectedQuestionnaire?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Input
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newQuestion.type}
                  onValueChange={(value: QuestionType) => setNewQuestion(prev => ({ ...prev, type: value, options: [] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={newQuestion.required}
                    onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, required: checked }))}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {newQuestion.required ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>

            {(newQuestion.type === "single_choice" || newQuestion.type === "multi_choice") && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Add option..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" variant="outline" onClick={addOption}>
                    Add
                  </Button>
                </div>
                {newQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newQuestion.options.map((opt, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {opt}
                        <button onClick={() => removeOption(idx)}>
                          <XCircle className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddQuestionToExisting} disabled={updateQuestionnaire.isPending}>
              {updateQuestionnaire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editQuestionDialogOpen} onOpenChange={(open) => {
        setEditQuestionDialogOpen(open);
        if (!open) {
          setSelectedQuestionnaire(null);
          setEditingQuestion(null);
          setEditOptionInput("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update question in "{selectedQuestionnaire?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Input
                value={editingQuestion?.question || ""}
                onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, question: e.target.value }) : null)}
                placeholder="Enter your question..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingQuestion?.type || "text"}
                  onValueChange={(value: QuestionType) => setEditingQuestion(prev => prev ? ({ ...prev, type: value, options: value === "single_choice" || value === "multi_choice" ? prev.options : [] }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={editingQuestion?.required || false}
                    onCheckedChange={(checked) => setEditingQuestion(prev => prev ? ({ ...prev, required: checked }) : null)}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {editingQuestion?.required ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>

            {(editingQuestion?.type === "single_choice" || editingQuestion?.type === "multi_choice") && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={editOptionInput}
                    onChange={(e) => setEditOptionInput(e.target.value)}
                    placeholder="Add option..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEditOption())}
                  />
                  <Button type="button" variant="outline" onClick={addEditOption}>
                    Add
                  </Button>
                </div>
                {editingQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingQuestion.options.map((opt, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {opt}
                        <button onClick={() => removeEditOption(idx)}>
                          <XCircle className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateQuestion} disabled={updateQuestionnaire.isPending}>
              {updateQuestionnaire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Template Confirmation */}
      <AlertDialog open={!!deletePlanTemplateId} onOpenChange={(open) => !open && setDeletePlanTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlanTemplate} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview System Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {previewTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {SPECIALTIES.find(s => s.value === previewTemplate?.specialty)?.label || "General"}
              </Badge>
              <Badge variant="secondary">
                {previewTemplate?.questions.length} questions
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                System Template
              </Badge>
            </div>

            <div className="space-y-3">
              {previewTemplate?.questions.map((question, idx) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <span className="text-sm font-medium text-muted-foreground mt-1">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}
                      </Badge>
                      {question.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {question.options && question.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.options.map((opt, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{opt}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  handleUseSystemTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }
              }}
              disabled={createQuestionnaire.isPending}
            >
              {createQuestionnaire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
