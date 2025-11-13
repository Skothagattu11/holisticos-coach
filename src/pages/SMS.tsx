import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

const SMS = () => {
  const [smsMessage, setSmsMessage] = useState("");
  const [smsTarget, setSmsTarget] = useState("all");
  const [smsHistory, setSmsHistory] = useState<any[]>([
    { id: 1, message: "Reminder: Check your daily tasks", target: "clients", sent: "2024-01-15", recipients: 33 },
    { id: 2, message: "Welcome to the platform!", target: "all", sent: "2024-01-10", recipients: 45 },
    { id: 3, message: "New training plan available", target: "clients", sent: "2024-01-08", recipients: 33 },
    { id: 4, message: "Coach meeting scheduled for tomorrow", target: "coaches", sent: "2024-01-05", recipients: 12 },
  ]);

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

  const totalSent = smsHistory.length;
  const totalRecipients = smsHistory.reduce((sum, sms) => sum + sms.recipients, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">SMS Messaging</h1>
        <p className="text-muted-foreground">
          Send text messages to users (160 characters max)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send SMS</CardTitle>
            <CardDescription>
              Send text messages to selected user groups
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
                <span className={`text-xs ${smsMessage.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {smsMessage.length}/160
                </span>
              </div>
              <Textarea
                id="sms-message"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value.slice(0, 160))}
                placeholder="Enter SMS message (max 160 characters)"
                rows={5}
                maxLength={160}
                className={smsMessage.length > 160 ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Keep messages concise and impactful for best results
              </p>
            </div>
            <Button onClick={handleSendSMS} className="w-full" disabled={!smsMessage || smsMessage.length > 160}>
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS Statistics</CardTitle>
            <CardDescription>Message delivery metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">{totalSent}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">{totalRecipients}</p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">99%</p>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {totalSent > 0 ? Math.round(totalRecipients / totalSent) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Recipients</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">SMS Best Practices</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep messages under 160 characters</li>
                <li>• Include a clear call-to-action</li>
                <li>• Send during appropriate hours</li>
                <li>• Personalize when possible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS History</CardTitle>
          <CardDescription>Recently sent text messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smsHistory.map((sms) => (
              <div key={sms.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground flex-1">{sms.message}</p>
                  </div>
                  <Badge variant="outline">{sms.target}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                  <span>{sms.sent}</span>
                  <span>•</span>
                  <span>{sms.recipients} recipients</span>
                  <span>•</span>
                  <span>{sms.message.length} chars</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMS;
