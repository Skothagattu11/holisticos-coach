import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Save, Shield, Bell, Mail, MessageSquare, Send, Calendar, Users as UsersIcon, TrendingUp } from "lucide-react";
import { UserRole } from "@/types";

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
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@holisticos.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Dashboard settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  
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

  // Push Notifications
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all");
  const [notificationHistory, setNotificationHistory] = useState<any[]>([
    { id: 1, title: "Welcome!", message: "Welcome to the platform", target: "all", sent: "2024-01-15", recipients: 45 },
    { id: 2, title: "New Feature", message: "Check out our new dashboard", target: "coaches", sent: "2024-01-14", recipients: 12 },
  ]);

  // Email Campaigns
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState("all");
  const [emailCampaignName, setEmailCampaignName] = useState("");
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([
    { id: 1, name: "Weekly Newsletter", subject: "Your Weekly Update", target: "all", sent: "2024-01-15", opens: 89, clicks: 34 },
    { id: 2, name: "Coach Onboarding", subject: "Welcome Coach!", target: "coaches", sent: "2024-01-10", opens: 12, clicks: 8 },
  ]);

  // SMS
  const [smsMessage, setSmsMessage] = useState("");
  const [smsTarget, setSmsTarget] = useState("all");
  const [smsHistory, setSmsHistory] = useState<any[]>([
    { id: 1, message: "Reminder: Check your daily tasks", target: "clients", sent: "2024-01-15", recipients: 33 },
    { id: 2, message: "Welcome to the platform!", target: "all", sent: "2024-01-10", recipients: 45 },
  ]);

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

  const handleSendNotification = () => {
    if (!notificationTitle || !notificationMessage) {
      toast.error("Please fill in all fields");
      return;
    }
    const newNotification = {
      id: Date.now(),
      title: notificationTitle,
      message: notificationMessage,
      target: notificationTarget,
      sent: new Date().toISOString().split('T')[0],
      recipients: notificationTarget === "all" ? 45 : notificationTarget === "coaches" ? 12 : 33,
    };
    setNotificationHistory([newNotification, ...notificationHistory]);
    toast.success("Push notification sent successfully");
    setNotificationTitle("");
    setNotificationMessage("");
  };

  const handleSendEmail = () => {
    if (!emailSubject || !emailBody) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Email sent successfully");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleCreateCampaign = () => {
    if (!emailCampaignName || !emailSubject || !emailBody) {
      toast.error("Please fill in all campaign fields");
      return;
    }
    const newCampaign = {
      id: Date.now(),
      name: emailCampaignName,
      subject: emailSubject,
      target: emailTarget,
      sent: new Date().toISOString().split('T')[0],
      opens: 0,
      clicks: 0,
    };
    setEmailCampaigns([newCampaign, ...emailCampaigns]);
    toast.success("Email campaign created and sent");
    setEmailCampaignName("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleSendSMS = () => {
    if (!smsMessage) {
      toast.error("Please enter a message");
      return;
    }
    if (smsMessage.length > 160) {
      toast.error("SMS message must be 160 characters or less");
      return;
    }
    const newSMS = {
      id: Date.now(),
      message: smsMessage,
      target: smsTarget,
      sent: new Date().toISOString().split('T')[0],
      recipients: smsTarget === "all" ? 45 : smsTarget === "coaches" ? 12 : 33,
    };
    setSmsHistory([newSMS, ...smsHistory]);
    toast.success("SMS sent successfully");
    setSmsMessage("");
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {currentRole === "admin" && (
            <>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="notifications">Push Notifications</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
            </>
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

        {currentRole === "admin" && (
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Push Notification</CardTitle>
                <CardDescription>
                  Send push notifications to users in your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Notification Title</Label>
                  <Input
                    id="notif-title"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="Enter notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-message">Message</Label>
                  <Textarea
                    id="notif-message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-target">Target Audience</Label>
                  <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="coaches">Coaches Only</SelectItem>
                      <SelectItem value="clients">Clients Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSendNotification} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Push Notification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>Recently sent push notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationHistory.map((notif) => (
                    <div key={notif.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{notif.title}</p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                        </div>
                        <Badge variant="outline">{notif.target}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{notif.sent}</span>
                        <span>•</span>
                        <span>{notif.recipients} recipients</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {currentRole === "admin" && (
          <TabsContent value="email" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send Direct Email</CardTitle>
                  <CardDescription>
                    Send a one-time email to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-target-direct">Target Audience</Label>
                    <Select value={emailTarget} onValueChange={setEmailTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="coaches">Coaches Only</SelectItem>
                        <SelectItem value="clients">Clients Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-subject-direct">Subject</Label>
                    <Input
                      id="email-subject-direct"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-body-direct">Message</Label>
                    <Textarea
                      id="email-body-direct"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email content"
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleSendEmail} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create Email Campaign</CardTitle>
                  <CardDescription>
                    Create and track email campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={emailCampaignName}
                      onChange={(e) => setEmailCampaignName(e.target.value)}
                      placeholder="e.g., Weekly Newsletter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-target-campaign">Target Audience</Label>
                    <Select value={emailTarget} onValueChange={setEmailTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="coaches">Coaches Only</SelectItem>
                        <SelectItem value="clients">Clients Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-subject-campaign">Subject</Label>
                    <Input
                      id="email-subject-campaign"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Campaign subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-body-campaign">Message</Label>
                    <Textarea
                      id="email-body-campaign"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Campaign content"
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleCreateCampaign} className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create & Send Campaign
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Email Campaigns</CardTitle>
                <CardDescription>Track your email campaign performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                        <Badge variant="outline">{campaign.target}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{campaign.opens}</p>
                          <p className="text-xs text-muted-foreground">Opens</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{campaign.clicks}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {campaign.opens > 0 ? Math.round((campaign.clicks / campaign.opens) * 100) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Sent on {campaign.sent}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {currentRole === "admin" && (
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send SMS</CardTitle>
                <CardDescription>
                  Send text messages to users (160 characters max)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-target">Target Audience</Label>
                  <Select value={smsTarget} onValueChange={setSmsTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="coaches">Coaches Only</SelectItem>
                      <SelectItem value="clients">Clients Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-message">Message</Label>
                    <span className="text-xs text-muted-foreground">
                      {smsMessage.length}/160
                    </span>
                  </div>
                  <Textarea
                    id="sms-message"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value.slice(0, 160))}
                    placeholder="Enter SMS message (max 160 characters)"
                    rows={4}
                    maxLength={160}
                  />
                </div>
                <Button onClick={handleSendSMS} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS History</CardTitle>
                <CardDescription>Recently sent text messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {smsHistory.map((sms) => (
                    <div key={sms.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-foreground flex-1">{sms.message}</p>
                        <Badge variant="outline">{sms.target}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{sms.sent}</span>
                        <span>•</span>
                        <span>{sms.recipients} recipients</span>
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
