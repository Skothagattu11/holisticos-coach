import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, Calendar, TrendingUp } from "lucide-react";

const Email = () => {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState("all");
  const [emailCampaignName, setEmailCampaignName] = useState("");
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([
    { id: 1, name: "Weekly Newsletter", subject: "Your Weekly Update", target: "all", sent: "2024-01-15", opens: 89, clicks: 34 },
    { id: 2, name: "Coach Onboarding", subject: "Welcome Coach!", target: "coaches", sent: "2024-01-10", opens: 12, clicks: 8 },
    { id: 3, name: "Client Progress Report", subject: "Your Monthly Progress", target: "clients", sent: "2024-01-08", opens: 67, clicks: 23 },
  ]);

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

  const totalOpens = emailCampaigns.reduce((sum, c) => sum + c.opens, 0);
  const totalClicks = emailCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgOpenRate = emailCampaigns.length > 0 
    ? Math.round((totalOpens / (emailCampaigns.length * 100)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Email Campaigns</h1>
        <p className="text-muted-foreground">
          Send direct emails and manage marketing campaigns
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpens}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">Link engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">Campaign average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Email</TabsTrigger>
          <TabsTrigger value="campaign">Create Campaign</TabsTrigger>
          <TabsTrigger value="history">Campaign History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Direct Email</CardTitle>
              <CardDescription>
                Send a one-time email to selected user groups
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
                  rows={8}
                />
              </div>
              <Button onClick={handleSendEmail} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Email Campaign</CardTitle>
              <CardDescription>
                Create a trackable email campaign with analytics
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
                  rows={8}
                />
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Create & Send Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Track your email campaign metrics and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{campaign.subject}</p>
                      </div>
                      <Badge variant="outline">{campaign.target}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-2xl font-bold text-foreground">{campaign.opens}</p>
                        <p className="text-xs text-muted-foreground">Opens</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-2xl font-bold text-foreground">{campaign.clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
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
      </Tabs>
    </div>
  );
};

export default Email;
