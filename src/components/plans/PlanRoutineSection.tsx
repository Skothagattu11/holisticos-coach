import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PlanRoutineItem, Client } from "@/types";
import { Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockClients } from "@/lib/mock-data";
import { toast } from "sonner";

interface PlanRoutineSectionProps {
  items: PlanRoutineItem[];
  onChange: (items: PlanRoutineItem[]) => void;
}

export const PlanRoutineSection = ({ items, onChange }: PlanRoutineSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PlanRoutineItem>>({});
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const startEdit = (item: PlanRoutineItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = () => {
    if (editingId) {
      onChange(items.map(item => item.id === editingId ? { ...item, ...formData } as PlanRoutineItem : item));
      cancelEdit();
    }
  };

  const addNew = () => {
    const newItem: PlanRoutineItem = {
      id: `r-${Date.now()}`,
      type: "workout",
      title: "New Activity",
      time: "09:00",
      duration: "30min",
    };
    onChange([...items, newItem]);
    startEdit(newItem);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const generateRoutine = () => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    const generatedItems: PlanRoutineItem[] = [
      { id: `r-${Date.now()}-1`, type: "workout", title: "Morning Workout", time: "07:00", duration: "60min", notes: "High intensity" },
      { id: `r-${Date.now()}-2`, type: "meal", title: "Breakfast", time: "08:30", duration: "30min" },
      { id: `r-${Date.now()}-3`, type: "deep-work", title: "Focus Session", time: "10:00", duration: "90min" },
      { id: `r-${Date.now()}-4`, type: "meal", title: "Lunch", time: "13:00", duration: "45min" },
      { id: `r-${Date.now()}-5`, type: "recovery", title: "Stretching", time: "18:00", duration: "30min" },
    ];

    onChange([...items, ...generatedItems]);
    toast.success("Routine generated successfully!");
  };

  const typeColors = {
    workout: "bg-chart-1",
    meal: "bg-chart-3",
    recovery: "bg-chart-4",
    "deep-work": "bg-chart-2",
    habit: "bg-chart-5",
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
        <Button onClick={generateRoutine} disabled={!selectedClientId} variant="default">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Routine
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daily Routine</h3>
        <Button onClick={addNew} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
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
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={formData.time || ""}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={formData.duration || ""}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 30min, 1h"
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
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={typeColors[item.type]}>{item.type}</Badge>
                      <span className="font-semibold">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.time} • {item.duration}
                    </p>
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
