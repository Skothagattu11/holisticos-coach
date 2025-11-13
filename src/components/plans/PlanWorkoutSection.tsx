import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PlanWorkoutItem, Client } from "@/types";
import { Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { mockClients } from "@/lib/mock-data";
import { toast } from "sonner";

interface PlanWorkoutSectionProps {
  items: PlanWorkoutItem[];
  onChange: (items: PlanWorkoutItem[]) => void;
}

export const PlanWorkoutSection = ({ items, onChange }: PlanWorkoutSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PlanWorkoutItem>>({});
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const startEdit = (item: PlanWorkoutItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = () => {
    if (editingId) {
      onChange(items.map(item => item.id === editingId ? { ...item, ...formData } as PlanWorkoutItem : item));
      cancelEdit();
    }
  };

  const addNew = () => {
    const newItem: PlanWorkoutItem = {
      id: `w-${Date.now()}`,
      exercise: "New Exercise",
      sets: 3,
      reps: "10",
      rest: "60s",
    };
    onChange([...items, newItem]);
    startEdit(newItem);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const generateWorkout = () => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    const generatedItems: PlanWorkoutItem[] = [
      { id: `w-${Date.now()}-1`, exercise: "Squats", sets: 4, reps: "8-12", rest: "90s", notes: "Focus on form" },
      { id: `w-${Date.now()}-2`, exercise: "Bench Press", sets: 4, reps: "8-10", rest: "120s" },
      { id: `w-${Date.now()}-3`, exercise: "Deadlifts", sets: 3, reps: "5-8", rest: "180s", notes: "Heavy day" },
      { id: `w-${Date.now()}-4`, exercise: "Pull-ups", sets: 3, reps: "Max", rest: "90s" },
    ];

    onChange([...items, ...generatedItems]);
    toast.success("Workout plan generated successfully!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4 pb-4 border-b">
        <div className="flex-1">
          <Label htmlFor="clientSelect">Select Client</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger id="clientSelect">
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
            <SelectContent>
              {mockClients.map((client: Client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateWorkout} disabled={!selectedClientId} variant="default">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Workout
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workout Plan</h3>
        <Button onClick={addNew} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Exercise</Label>
                    <Input
                      value={formData.exercise || ""}
                      onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        value={formData.sets || 0}
                        onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Reps</Label>
                      <Input
                        value={formData.reps || ""}
                        onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                        placeholder="e.g., 10, 8-12"
                      />
                    </div>
                    <div>
                      <Label>Rest</Label>
                      <Input
                        value={formData.rest || ""}
                        onChange={(e) => setFormData({ ...formData, rest: e.target.value })}
                        placeholder="e.g., 60s, 2min"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button onClick={cancelEdit} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={saveEdit} size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold mb-2">{item.exercise}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.sets} sets × {item.reps} reps • Rest: {item.rest}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => startEdit(item)} variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => deleteItem(item.id)} variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
