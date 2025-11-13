import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PlanNutritionItem } from "@/types";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanNutritionSectionProps {
  items: PlanNutritionItem[];
  onChange: (items: PlanNutritionItem[]) => void;
}

export const PlanNutritionSection = ({ items, onChange }: PlanNutritionSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PlanNutritionItem>>({});

  const startEdit = (item: PlanNutritionItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = () => {
    if (editingId) {
      onChange(items.map(item => item.id === editingId ? { ...item, ...formData } as PlanNutritionItem : item));
      cancelEdit();
    }
  };

  const addNew = () => {
    const newItem: PlanNutritionItem = {
      id: `n-${Date.now()}`,
      mealType: "breakfast",
      name: "New Meal",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
    onChange([...items, newItem]);
    startEdit(newItem);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Nutrition Plan</h3>
        <Button onClick={addNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
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
                      <Label>Meal Type</Label>
                      <Select value={formData.mealType} onValueChange={(value: any) => setFormData({ ...formData, mealType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Meal Name</Label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Calories</Label>
                      <Input
                        type="number"
                        value={formData.calories || 0}
                        onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Protein (g)</Label>
                      <Input
                        type="number"
                        value={formData.protein || 0}
                        onChange={(e) => setFormData({ ...formData, protein: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Carbs (g)</Label>
                      <Input
                        type="number"
                        value={formData.carbs || 0}
                        onChange={(e) => setFormData({ ...formData, carbs: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Fats (g)</Label>
                      <Input
                        type="number"
                        value={formData.fats || 0}
                        onChange={(e) => setFormData({ ...formData, fats: parseInt(e.target.value) || 0 })}
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
                      <Badge>{item.mealType}</Badge>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                      <div>
                        <span className="font-medium">{item.calories}</span> cal
                      </div>
                      <div>
                        <span className="font-medium">{item.protein}g</span> protein
                      </div>
                      <div>
                        <span className="font-medium">{item.carbs}g</span> carbs
                      </div>
                      <div>
                        <span className="font-medium">{item.fats}g</span> fats
                      </div>
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
