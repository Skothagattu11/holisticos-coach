import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { RoutineBlock } from "@/types";

interface RoutineFormProps {
  clientId: string;
  onAdd: (routine: Omit<RoutineBlock, "id">) => void;
}

export const RoutineForm = ({ clientId, onAdd }: RoutineFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "workout" as RoutineBlock["type"],
    title: "",
    start: "",
    end: "",
    effort: "medium" as RoutineBlock["effort"],
    location: "",
    purpose: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start || !formData.end) {
      toast.error("Please fill in all required fields");
      return;
    }

    onAdd({
      clientId,
      type: formData.type,
      title: formData.title,
      start: formData.start,
      end: formData.end,
      effort: formData.effort,
      location: formData.location,
      status: "scheduled",
      origin: "manual",
      notes: formData.purpose,
    });

    toast.success("Routine added successfully");
    setFormData({
      type: "workout",
      title: "",
      start: "",
      end: "",
      effort: "medium",
      location: "",
      purpose: "",
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4" />
        Add New Routine
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Routine</CardTitle>
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
              placeholder="e.g., Morning Run, Team Meeting"
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
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Gym, Home, Office"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose & Comments</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Describe the purpose of this routine and any special instructions..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Add Routine</Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
