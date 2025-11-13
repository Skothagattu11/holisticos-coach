import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { RoutineBlock } from "@/types";

interface RoutineFormProps {
  clientId: string;
  editingRoutine?: RoutineBlock | null;
  onAdd: (routine: Omit<RoutineBlock, "id">) => void;
  onUpdate: (routine: RoutineBlock) => void;
  onCancel?: () => void;
}

export const RoutineForm = ({ clientId, editingRoutine, onAdd, onUpdate, onCancel }: RoutineFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "workout" as RoutineBlock["type"],
    title: "",
    start: "",
    end: "",
    effort: "medium" as RoutineBlock["effort"],
    location: "",
    purpose: "",
    status: "scheduled" as RoutineBlock["status"],
  });

  useEffect(() => {
    if (editingRoutine) {
      setFormData({
        type: editingRoutine.type,
        title: editingRoutine.title,
        start: editingRoutine.start,
        end: editingRoutine.end,
        effort: editingRoutine.effort,
        location: editingRoutine.location || "",
        purpose: editingRoutine.notes || "",
        status: editingRoutine.status,
      });
      setIsOpen(true);
    }
  }, [editingRoutine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start || !formData.end) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingRoutine) {
      onUpdate({
        ...editingRoutine,
        type: formData.type,
        title: formData.title,
        start: formData.start,
        end: formData.end,
        effort: formData.effort,
        location: formData.location,
        notes: formData.purpose,
        status: formData.status,
      });
      toast.success("Routine updated successfully");
    } else {
      onAdd({
        clientId,
        type: formData.type,
        title: formData.title,
        start: formData.start,
        end: formData.end,
        effort: formData.effort,
        location: formData.location,
        status: formData.status,
        origin: "manual",
        notes: formData.purpose,
      });
      toast.success("Routine added successfully");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: "workout",
      title: "",
      start: "",
      end: "",
      effort: "medium",
      location: "",
      purpose: "",
      status: "scheduled",
    });
    setIsOpen(false);
    onCancel?.();
  };

  if (!isOpen && !editingRoutine) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add New Routine
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{editingRoutine ? "Edit Routine" : "Create New Routine"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={resetForm}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: RoutineBlock["type"]) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout">Workout</SelectItem>
                  <SelectItem value="meal">Meal</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="deep-work">Deep Work</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effort">Effort Level</Label>
              <Select value={formData.effort} onValueChange={(value: RoutineBlock["effort"]) => setFormData({ ...formData, effort: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning HIIT Workout"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">End Time *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Home Gym, Office"
            />
          </div>

          {editingRoutine && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: RoutineBlock["status"]) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose / Notes (Optional)</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Add any notes or purpose for this routine..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingRoutine ? "Update Routine" : "Create Routine"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
