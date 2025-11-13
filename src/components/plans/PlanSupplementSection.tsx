import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PlanSupplementItem, Client } from "@/types";
import { Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { mockClients } from "@/lib/mock-data";
import { toast } from "sonner";

interface PlanSupplementSectionProps {
  items: PlanSupplementItem[];
  onChange: (items: PlanSupplementItem[]) => void;
}

export const PlanSupplementSection = ({ items, onChange }: PlanSupplementSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PlanSupplementItem>>({});
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const startEdit = (item: PlanSupplementItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = () => {
    if (editingId) {
      onChange(items.map(item => item.id === editingId ? { ...item, ...formData } as PlanSupplementItem : item));
      cancelEdit();
    }
  };

  const addNew = () => {
    const newItem: PlanSupplementItem = {
      id: `s-${Date.now()}`,
      name: "New Supplement",
      dosage: "0g",
      timing: "Daily",
    };
    onChange([...items, newItem]);
    startEdit(newItem);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const generateSupplements = () => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    const generatedItems: PlanSupplementItem[] = [
      { id: `s-${Date.now()}-1`, name: "Whey Protein", dosage: "30g", timing: "Post-workout", notes: "With water" },
      { id: `s-${Date.now()}-2`, name: "Creatine", dosage: "5g", timing: "Daily", notes: "Morning" },
      { id: `s-${Date.now()}-3`, name: "Omega-3", dosage: "2g", timing: "With meals", notes: "Twice daily" },
    ];

    onChange([...items, ...generatedItems]);
    toast.success("Supplement plan generated successfully!");
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
        <Button onClick={generateSupplements} disabled={!selectedClientId} variant="default">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Supplements
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Supplement Plan</h3>
        <Button onClick={addNew} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplement
        </Button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Supplement Name</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={formData.dosage || ""}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="e.g., 5g, 2 capsules"
                      />
                    </div>
                    <div>
                      <Label>Timing</Label>
                      <Input
                        value={formData.timing || ""}
                        onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                        placeholder="e.g., Morning, Post-workout"
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
                    <div className="font-semibold mb-2">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.dosage} • {item.timing}
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
