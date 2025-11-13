import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockClients } from "@/lib/mock-data";
import { Plan } from "@/types";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PlanRoutineSection } from "@/components/plans/PlanRoutineSection";
import { PlanNutritionSection } from "@/components/plans/PlanNutritionSection";
import { PlanWorkoutSection } from "@/components/plans/PlanWorkoutSection";
import { PlanSupplementSection } from "@/components/plans/PlanSupplementSection";

const Plans = () => {
  const [currentPlan, setCurrentPlan] = useState<Plan>({
    id: `plan-${Date.now()}`,
    name: "New Plan",
    clientIds: [],
    routine: [],
    nutrition: [],
    workouts: [],
    supplements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [planName, setPlanName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [applyToClientsDialogOpen, setApplyToClientsDialogOpen] = useState(false);
  const [selectedClientsForApply, setSelectedClientsForApply] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("savedPlans");
    if (stored) {
      setSavedPlans(JSON.parse(stored));
    }
  }, []);

  const savePlan = () => {
    if (!currentPlan) return;
    if (!planName.trim()) {
      toast.error("Please enter a plan name");
      return;
    }

    const updatedPlan = {
      ...currentPlan,
      name: planName,
      updatedAt: new Date().toISOString(),
    };

    const existing = savedPlans.find(p => p.id === updatedPlan.id);
    let newSavedPlans;
    
    if (existing) {
      newSavedPlans = savedPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    } else {
      newSavedPlans = [...savedPlans, updatedPlan];
    }

    setSavedPlans(newSavedPlans);
    localStorage.setItem("savedPlans", JSON.stringify(newSavedPlans));
    setCurrentPlan(updatedPlan);
    setSaveDialogOpen(false);
    setPlanName("");
    toast.success("Plan saved successfully!");
  };

  const loadPlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setPlanName(plan.name);
    setLoadDialogOpen(false);
    toast.success("Plan loaded successfully!");
  };

  const deletePlan = (planId: string) => {
    const newSavedPlans = savedPlans.filter(p => p.id !== planId);
    setSavedPlans(newSavedPlans);
    localStorage.setItem("savedPlans", JSON.stringify(newSavedPlans));
    toast.success("Plan deleted successfully!");
  };

  const applyPlanToClients = () => {
    if (!currentPlan || selectedClientsForApply.length === 0) {
      toast.error("Please select clients to apply the plan");
      return;
    }

    const updatedPlan = {
      ...currentPlan,
      clientIds: [...new Set([...currentPlan.clientIds, ...selectedClientsForApply])],
      updatedAt: new Date().toISOString(),
    };

    setCurrentPlan(updatedPlan);
    const newSavedPlans = savedPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setSavedPlans(newSavedPlans);
    localStorage.setItem("savedPlans", JSON.stringify(newSavedPlans));
    
    setApplyToClientsDialogOpen(false);
    setSelectedClientsForApply([]);
    toast.success(`Plan applied to ${selectedClientsForApply.length} client(s)!`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plans & Routines</h1>
          <p className="text-muted-foreground mt-1">Create and manage comprehensive plans for your clients</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load Saved Plan</DialogTitle>
                <DialogDescription>Select a plan to load and edit</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No saved plans yet</p>
                ) : (
                  savedPlans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 cursor-pointer" onClick={() => loadPlan(plan)}>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.clientIds.length} client(s) • Updated {new Date(plan.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {currentPlan && (
            <>
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Plan</DialogTitle>
                    <DialogDescription>Give your plan a name to save it</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="planName">Plan Name</Label>
                      <Input
                        id="planName"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Enter plan name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={savePlan}>Save Plan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={applyToClientsDialogOpen} onOpenChange={setApplyToClientsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Apply to Clients</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply Plan to Clients</DialogTitle>
                    <DialogDescription>Select clients to apply this plan</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {mockClients.map(client => (
                      <div key={client.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                        <input
                          type="checkbox"
                          id={`client-${client.id}`}
                          checked={selectedClientsForApply.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClientsForApply([...selectedClientsForApply, client.id]);
                            } else {
                              setSelectedClientsForApply(selectedClientsForApply.filter(id => id !== client.id));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button onClick={applyPlanToClients} disabled={selectedClientsForApply.length === 0}>
                      Apply to {selectedClientsForApply.length} Client(s)
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{currentPlan.name}</CardTitle>
            <CardDescription>
              Applied to {currentPlan.clientIds.length} client(s) • Last updated {new Date(currentPlan.updatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="routine" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="routine">Routine</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="supplements">Supplements</TabsTrigger>
              </TabsList>

              <TabsContent value="routine" className="space-y-4">
                <PlanRoutineSection
                  items={currentPlan.routine}
                  onChange={(items) => setCurrentPlan({ ...currentPlan, routine: items, updatedAt: new Date().toISOString() })}
                />
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                <PlanNutritionSection
                  items={currentPlan.nutrition}
                  onChange={(items) => setCurrentPlan({ ...currentPlan, nutrition: items, updatedAt: new Date().toISOString() })}
                />
              </TabsContent>

              <TabsContent value="workouts" className="space-y-4">
                <PlanWorkoutSection
                  items={currentPlan.workouts}
                  onChange={(items) => setCurrentPlan({ ...currentPlan, workouts: items, updatedAt: new Date().toISOString() })}
                />
              </TabsContent>

              <TabsContent value="supplements" className="space-y-4">
                <PlanSupplementSection
                  items={currentPlan.supplements}
                  onChange={(items) => setCurrentPlan({ ...currentPlan, supplements: items, updatedAt: new Date().toISOString() })}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Plans;
