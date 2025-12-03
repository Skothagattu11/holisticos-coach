import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Save, Shield, FileQuestion, ListChecks, Loader2, Info } from "lucide-react";
import { UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { coachService } from "@/lib/services/coachService";
import { planService } from "@/lib/services/planService";
import { useCoachQuestionnaires } from "@/hooks/useQuestionnaires";
import { useQueryClient } from "@tanstack/react-query";

interface SettingsProps {
  currentRole: UserRole;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
}

const Settings = ({ currentRole }: SettingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@holisticos.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dashboard settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Coaching setup (for coaches)
  const [expertId, setExpertId] = useState<string | null>(null);
  const [loadingCoachSettings, setLoadingCoachSettings] = useState(false);
  const [savingCoachSettings, setSavingCoachSettings] = useState(false);
  const [defaultQuestionnaireId, setDefaultQuestionnaireId] = useState<string | null>(null);
  const [defaultPlanTemplateId, setDefaultPlanTemplateId] = useState<string | null>(null);
  const [planTemplates, setPlanTemplates] = useState<Array<{ id: string; name: string; description?: string }>>([]);

  // Use expertId for fetching questionnaires (not user?.id) to match Templates.tsx behavior
  const { data: questionnaires = [], isLoading: loadingQuestionnaires } = useCoachQuestionnaires(expertId);

  // Admin user management
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Dr. Alex Rivera", email: "alex.rivera@holisticos.com", role: "coach", status: "active" },
    { id: "2", name: "Jamie Foster", email: "jamie.foster@holisticos.com", role: "coach", status: "active" },
    { id: "3", name: "Sarah Chen", email: "sarah.chen@email.com", role: "client", status: "active" },
  ]);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("client");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Load expert ID for the current user (same as Templates.tsx)
  useEffect(() => {
    const loadExpertId = async () => {
      if (!user?.id) return;
      console.log("Settings: Loading expert ID for user:", user.id);
      try {
        const id = await coachService.getExpertIdForUser(user.id);
        console.log("Settings: Expert ID loaded:", id);
        setExpertId(id);
      } catch (error) {
        console.error("Settings: Failed to get expert ID:", error);
      }
    };
    loadExpertId();
  }, [user?.id]);

  // Load coach settings when expertId is available
  useEffect(() => {
    if (currentRole === "coach" && expertId) {
      loadCoachSettings();
      loadPlanTemplates();
    }
  }, [currentRole, expertId]);

  const loadCoachSettings = async () => {
    if (!expertId) return;
    setLoadingCoachSettings(true);
    try {
      console.log("Settings: Loading coach settings for expertId:", expertId);
      const settings = await coachService.getCoachSettings(expertId);
      console.log("Settings: Coach settings loaded:", settings);
      setDefaultQuestionnaireId(settings.defaultQuestionnaireId);
      setDefaultPlanTemplateId(settings.defaultPlanTemplateId);
    } catch (error) {
      console.error("Failed to load coach settings:", error);
    } finally {
      setLoadingCoachSettings(false);
    }
  };

  const loadPlanTemplates = async () => {
    try {
      const templates = await planService.fetchTemplates();
      setPlanTemplates(templates);
    } catch (error) {
      console.error("Failed to load plan templates:", error);
    }
  };

  const handleSaveCoachSettings = async () => {
    if (!expertId) {
      toast.error("Unable to identify coach profile. Please try again.");
      return;
    }
    console.log("Saving coach settings:", {
      expertId,
      defaultQuestionnaireId,
      defaultPlanTemplateId,
    });
    setSavingCoachSettings(true);
    try {
      await coachService.updateCoachSettings(expertId, {
        defaultQuestionnaireId,
        defaultPlanTemplateId,
      });
      console.log("Coach settings saved successfully");
      // Invalidate questionnaires query to refresh the dropdown
      queryClient.invalidateQueries({ queryKey: ['questionnaires', 'coach', expertId] });
      toast.success("Coaching setup saved successfully");
    } catch (error) {
      toast.error("Failed to save coaching setup");
      console.error("Failed to save coach settings:", error);
    } finally {
      setSavingCoachSettings(false);
    }
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    toast.success("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) {
      toast.error("Please fill in all fields");
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: "active",
    };
    setUsers([...users, newUser]);
    toast.success(`User ${newUserName} added successfully`);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("client");
    setIsAddUserOpen(false);
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
    toast.success("User role updated successfully");
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" } 
        : user
    ));
    toast.success("User status updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {(currentRole === "coach" || currentRole === "admin") && (
            <TabsTrigger value="coaching">Coaching Setup</TabsTrigger>
          )}
          {currentRole === "admin" && (
            <TabsTrigger value="users">User Management</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword}>
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Preferences</CardTitle>
              <CardDescription>
                Customize your dashboard experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about client activities
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for urgent alerts
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports via email
                  </p>
                </div>
                <Switch
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaching Setup Tab - for coaches */}
        {(currentRole === "coach" || currentRole === "admin") && (
          <TabsContent value="coaching" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Templates for New Clients</CardTitle>
                <CardDescription>
                  Configure the default questionnaire and plan template that will be automatically assigned when you onboard a new client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingCoachSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Default Intake Questionnaire */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-primary" />
                        <Label className="text-base font-medium">Default Intake Questionnaire</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This questionnaire will be automatically sent to new clients when they are assigned to you.
                      </p>
                      <Select
                        value={defaultQuestionnaireId || "none"}
                        onValueChange={(value) => setDefaultQuestionnaireId(value === "none" ? null : value)}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Select a questionnaire..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">No default questionnaire</span>
                          </SelectItem>
                          {loadingQuestionnaires ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : questionnaires.length === 0 ? (
                            <SelectItem value="empty" disabled>No templates yet - create one in Templates page</SelectItem>
                          ) : (
                            questionnaires.map((q) => (
                              <SelectItem key={q.id} value={q.id}>
                                <div className="flex items-center gap-2">
                                  <span>{q.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {q.questions?.length || 0} questions
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {questionnaires.length === 0 && !loadingQuestionnaires && (
                        <p className="text-sm text-muted-foreground">
                          You haven't created any questionnaire templates yet.{" "}
                          <a href="/templates" className="text-primary hover:underline">
                            Create one in Templates
                          </a>
                        </p>
                      )}
                      {defaultQuestionnaireId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4" />
                          <span>Selected questionnaire will be assigned to new clients automatically</span>
                        </div>
                      )}
                    </div>

                    {/* Default Plan Template */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-primary" />
                        <Label className="text-base font-medium">Default Plan Template</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This plan template can be used as a starting point when creating a coaching plan for new clients.
                      </p>
                      <Select
                        value={defaultPlanTemplateId || "none"}
                        onValueChange={(value) => setDefaultPlanTemplateId(value === "none" ? null : value)}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Select a plan template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">No default plan template</span>
                          </SelectItem>
                          {planTemplates.length === 0 ? (
                            <SelectItem value="empty" disabled>No templates available</SelectItem>
                          ) : (
                            planTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {planTemplates.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          You haven't created any plan templates yet.{" "}
                          <a href="/templates" className="text-primary hover:underline">
                            Create one in Templates
                          </a>
                        </p>
                      )}
                    </div>

                    <Button onClick={handleSaveCoachSettings} disabled={savingCoachSettings}>
                      {savingCoachSettings ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Coaching Setup
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
                    <div>
                      <p className="font-medium text-foreground">Select your default templates</p>
                      <p>Choose the questionnaire and plan template you typically use with new clients.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
                    <div>
                      <p className="font-medium text-foreground">New client is assigned to you</p>
                      <p>When a client starts working with you, the default questionnaire is automatically sent.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
                    <div>
                      <p className="font-medium text-foreground">Create their personalized plan</p>
                      <p>Use your default plan template as a starting point and customize it based on their responses.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {currentRole === "admin" && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Add new users and manage their roles
                    </CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account and assign a role
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-user-name">Full Name</Label>
                          <Input
                            id="new-user-name"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-email">Email</Label>
                          <Input
                            id="new-user-email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-role">Role</Label>
                          <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="coach">Coach</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddUser} className="w-full">
                          Add User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleChangeUserRole(user.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={user.status === "active" ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
