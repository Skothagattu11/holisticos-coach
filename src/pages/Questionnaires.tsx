import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  useQuestionnaires,
  useCreateQuestionnaire,
  useUpdateQuestionnaire,
  useDeleteQuestionnaire,
} from "@/hooks/useQuestionnaires";
import {
  Plus,
  Loader2,
  FileQuestion,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Questionnaire, QuestionnaireQuestion, QuestionType } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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

const Questionnaires = () => {
  const { user } = useAuth();
  const { data: questionnaires = [], isLoading, error } = useQuestionnaires();
  const createMutation = useCreateQuestionnaire();
  const updateMutation = useUpdateQuestionnaire();
  const deleteMutation = useDeleteQuestionnaire();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);

  // New questionnaire form state
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

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    type: "text" as QuestionType,
    options: [] as string[],
    required: true,
  });

  const [optionInput, setOptionInput] = useState("");

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
    if (!newQuestionnaire.title) {
      toast.error("Title is required");
      return;
    }

    if (newQuestionnaire.questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: newQuestionnaire.title,
        description: newQuestionnaire.description,
        specialty: newQuestionnaire.specialty,
        createdBy: user?.id || "unknown",
        questions: newQuestionnaire.questions.map((q, idx) => ({
          id: `q_${idx}`,
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required,
        })),
      });
      toast.success("Questionnaire created successfully");
      setCreateDialogOpen(false);
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

      await updateMutation.mutateAsync({
        questionnaireId: selectedQuestionnaire.id,
        updates: { questions: updatedQuestions },
      });
      toast.success("Question added successfully");
      setAddQuestionDialogOpen(false);
      setSelectedQuestionnaire(null);
      resetQuestionForm();
    } catch (err) {
      toast.error("Failed to add question");
    }
  };

  const handleToggleActive = async (questionnaire: Questionnaire) => {
    try {
      await updateMutation.mutateAsync({
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

      await updateMutation.mutateAsync({
        questionnaireId: questionnaire.id,
        updates: { questions: updatedQuestions },
      });
      toast.success("Question deleted");
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    if (!confirm("Are you sure you want to delete this questionnaire?")) return;

    try {
      await deleteMutation.mutateAsync(questionnaireId);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Failed to load questionnaires</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Questionnaires</h1>
          <p className="text-muted-foreground">
            Create and manage intake questionnaires for new clients
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Questionnaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Questionnaire</DialogTitle>
              <DialogDescription>
                Build a questionnaire with custom questions for client intake
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newQuestionnaire.title}
                    onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Initial Health Assessment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newQuestionnaire.description}
                    onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this questionnaire covers..."
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
                  <div className="space-y-2">
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
                          {q.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {q.options.map((opt, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{opt}</Badge>
                              ))}
                            </div>
                          )}
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
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateQuestionnaire} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Questionnaire
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questionnaires List */}
      <div className="space-y-4">
        {questionnaires.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No questionnaires yet</h3>
              <p className="text-muted-foreground">Create your first questionnaire to get started.</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Questionnaire
              </Button>
            </div>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {questionnaires.map((questionnaire: Questionnaire) => (
              <AccordionItem
                key={questionnaire.id}
                value={questionnaire.id}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileQuestion className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{questionnaire.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {questionnaire.questions?.length || 0} questions • {questionnaire.specialty || "General"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={questionnaire.isActive ? "default" : "secondary"}>
                        {questionnaire.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {questionnaire.description && (
                    <p className="text-sm text-muted-foreground mb-4">{questionnaire.description}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    {questionnaire.questions?.map((question, idx) => (
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(questionnaire, question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(!questionnaire.questions || questionnaire.questions.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No questions in this questionnaire
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={questionnaire.isActive}
                        onCheckedChange={() => handleToggleActive(questionnaire)}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQuestionnaire(questionnaire);
                          setAddQuestionDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteQuestionnaire(questionnaire.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

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
            <Button onClick={handleAddQuestionToExisting} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Questionnaires;
