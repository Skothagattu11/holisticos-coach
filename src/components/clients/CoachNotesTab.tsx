import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  StickyNote,
  Plus,
  Pin,
  PinOff,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { coachService } from "@/lib/services/coachService";
import { useAuth } from "@/contexts/AuthContext";

interface CoachNotesTabProps {
  relationshipId: string;
  userId: string;
  clientName?: string;
}

type NoteType = "general" | "session" | "progress" | "concern" | "goal";

interface Note {
  id: string;
  relationship_id: string;
  expert_id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: typeof FileText; color: string }> = {
  general: { label: "General", icon: FileText, color: "text-muted-foreground" },
  session: { label: "Session", icon: Calendar, color: "text-blue-500" },
  progress: { label: "Progress", icon: TrendingUp, color: "text-green-500" },
  concern: { label: "Concern", icon: AlertTriangle, color: "text-orange-500" },
  goal: { label: "Goal", icon: Target, color: "text-purple-500" },
};

export const CoachNotesTab = ({ relationshipId, userId, clientName }: CoachNotesTabProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New note form state
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<NoteType>("general");

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editNoteType, setEditNoteType] = useState<NoteType>("general");

  // Delete confirmation
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<NoteType | "all">("all");

  // Fetch notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const data = await coachService.fetchNotes(relationshipId);
        setNotes(data);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [relationshipId]);

  // Create new note
  const handleCreateNote = async () => {
    if (!newNoteContent.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      // Get expert ID for the current user
      const expertId = await coachService.getExpertIdForUser(user.id);
      if (!expertId) {
        console.error("Could not find expert ID for user");
        return;
      }

      const newNote = await coachService.createNote({
        relationshipId,
        expertId,
        userId,
        content: newNoteContent.trim(),
        noteType: newNoteType,
      });

      setNotes([newNote, ...notes]);
      setNewNoteContent("");
      setNewNoteType("general");
      setShowNewNote(false);
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const updated = await coachService.updateNote(noteId, {
        content: editContent.trim(),
        noteType: editNoteType,
      });

      setNotes(notes.map(n => n.id === noteId ? updated : n));
      setEditingNoteId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle pin
  const handleTogglePin = async (noteId: string, currentlyPinned: boolean) => {
    try {
      const updated = await coachService.toggleNotePin(noteId, !currentlyPinned);
      setNotes(notes.map(n => n.id === noteId ? updated : n).sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }));
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    try {
      await coachService.deleteNote(deleteNoteId);
      setNotes(notes.filter(n => n.id !== deleteNoteId));
      setDeleteNoteId(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Start editing
  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditNoteType(note.note_type);
  };

  // Filter notes
  const filteredNotes = filterType === "all"
    ? notes
    : notes.filter(n => n.note_type === filterType);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button and Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Coach Notes
          </h3>
          <Badge variant="outline">{notes.length} notes</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as NoteType | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn("h-4 w-4", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewNote(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>

      {/* New Note Form */}
      {showNewNote && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Note</CardTitle>
            <CardDescription>
              Add a private note about {clientName || "this client"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-muted-foreground">Type:</label>
              <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as NoteType)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteContent("");
                  setNewNoteType("general");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={!newNoteContent.trim() || isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {filterType !== "all"
                ? `No ${NOTE_TYPE_CONFIG[filterType].label.toLowerCase()} notes found.`
                : "Add notes to track observations, progress, and concerns about this client."}
            </p>
            {filterType === "all" && (
              <Button onClick={() => setShowNewNote(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const config = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.general;
            const Icon = config.icon;
            const isEditing = editingNoteId === note.id;

            return (
              <Card
                key={note.id}
                className={cn(
                  "transition-all",
                  note.is_pinned && "border-primary/30 bg-primary/5"
                )}
              >
                <CardContent className="pt-4">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-muted-foreground">Type:</label>
                        <Select value={editNoteType} onValueChange={(v) => setEditNoteType(v as NoteType)}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(NOTE_TYPE_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                                  {cfg.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditContent("");
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editContent.trim() || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {note.is_pinned && (
                            <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="gap-1">
                                <Icon className={cn("h-3 w-3", config.color)} />
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(note.created_at)}
                              </span>
                              {note.updated_at !== note.created_at && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTogglePin(note.id, note.is_pinned)}>
                              {note.is_pinned ? (
                                <>
                                  <PinOff className="h-4 w-4 mr-2" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4 mr-2" />
                                  Pin to Top
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditing(note)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteNoteId(note.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
