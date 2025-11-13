import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";

const Notifications = () => {
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all");
  const [notificationHistory, setNotificationHistory] = useState<any[]>([
    { id: 1, title: "Welcome!", message: "Welcome to the platform", target: "all", sent: "2024-01-15", recipients: 45 },
    { id: 2, title: "New Feature", message: "Check out our new dashboard", target: "coaches", sent: "2024-01-14", recipients: 12 },
    { id: 3, title: "System Update", message: "Platform maintenance scheduled", target: "all", sent: "2024-01-13", recipients: 45 },
  ]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Push Notifications</h1>
        <p className="text-muted-foreground">
          Send instant push notifications to users in your platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Push Notification</CardTitle>
            <CardDescription>
              Create and send push notifications to selected user groups
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
                rows={4}
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
              <Send className="h-4 w-4 mr-2" />
              Send Push Notification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Notification delivery statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {notificationHistory.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {notificationHistory.reduce((sum, n) => sum + n.recipients, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">87%</p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>Recently sent push notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationHistory.map((notif) => (
              <div key={notif.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{notif.target}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                  <span>{notif.sent}</span>
                  <span>•</span>
                  <span>{notif.recipients} recipients</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
