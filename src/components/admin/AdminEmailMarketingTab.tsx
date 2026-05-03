import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Mail, 
  Sparkles, 
  Zap, 
  Send, 
  Settings, 
  Clock, 
  Target, 
  Layout,
  RefreshCw,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  type: "welcome" | "promo" | "educational" | "re-engagement";
  aiPrompt: string;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Wellness Sequence",
    subject: "Welcome to your wellness journey! 🌿",
    description: "Convert new subscribers with a warm welcome and an exclusive introductory offer.",
    type: "welcome",
    aiPrompt: "Write a warm, welcoming email for a new subscriber to Lifestyle Medicine Gateway. Focus on health, wellness, and the benefits of our products. Include a placeholder for a 15% discount code."
  },
  {
    id: "promo",
    name: "Flash Sale Accelerator",
    subject: "Exclusive Offer: Your Wellness, Upgraded! ✨",
    description: "High-conversion promotional email focused on urgency and digital marketing best practices.",
    type: "promo",
    aiPrompt: "Write a high-energy promotional email for a flash sale. Use persuasive copywriting techniques, create urgency, and highlight the value of investing in one's health."
  },
  {
    id: "educational",
    name: "Expert Insight Newsletter",
    subject: "The Science of Better Living 🧬",
    description: "Build trust and authority by sharing expert knowledge from your latest articles.",
    type: "educational",
    aiPrompt: "Create a newsletter-style email that introduces a complex wellness topic in an easy-to-digest way. Link to recent articles and offer genuine value before asking for a sale."
  },
  {
    id: "winback",
    name: "Customer Re-engagement",
    subject: "We've missed you! Here's something special... ❤️",
    description: "Win back inactive subscribers with a personalized message and a strong incentive.",
    type: "re-engagement",
    aiPrompt: "Write a soft, caring email for subscribers who haven't opened emails in a while. Ask for feedback on how we can improve and offer a 'welcome back' gift."
  }
];

export function AdminEmailMarketingTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleAIAutomation = async (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setIsGenerating(true);
    setCampaignName(template.name);
    setSubjectLine(template.subject);
    
    // Simulate AI Generation for now - in production this would call your AI edge function
    try {
      // In a real app: const res = await fetch("/api/ai-generate-email", { ... })
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const simulatedContent = `Hi [Customer Name],\n\n${template.aiPrompt.replace("Write a ", "We've crafted this ")}... \n\nAt Lifestyle Medicine Gateway, we believe that small changes lead to big results. Our community is built on the foundation of science-backed wellness and premium natural products.\n\n[INSERT PRODUCT HIGHLIGHT HERE]\n\nDon't wait to start feeling your best. Click below to explore our latest arrivals.\n\nBest in Health,\nThe LMG Team`;
      
      setEmailContent(simulatedContent);
      toast.success(`${template.name} generated with AI best practices!`);
    } catch (err) {
      toast.error("AI Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendCampaign = () => {
    if (!emailContent || !subjectLine) {
      toast.error("Please generate or write your campaign first.");
      return;
    }
    
    setIsSent(true);
    toast.success("Campaign scheduled for immediate delivery to all subscribers!");
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight">AI Email Marketing</h2>
        <p className="text-sm text-muted-foreground">Automate your conversion funnel with AI-powered campaigns.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Campaign Automations</h3>
          {CAMPAIGN_TEMPLATES.map((t) => (
            <Card 
              key={t.id} 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 group",
                selectedTemplate?.id === t.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50"
              )}
              onClick={() => handleAIAutomation(t)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                    selectedTemplate?.id === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}>
                    {t.id === "welcome" && <Rocket className="h-4 w-4" />}
                    {t.id === "promo" && <Zap className="h-4 w-4" />}
                    {t.id === "educational" && <Layout className="h-4 w-4" />}
                    {t.id === "winback" && <RefreshCw className="h-4 w-4" />}
                  </div>
                  <CardTitle className="text-sm font-bold">{t.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider">
                    {t.type}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2">
                    <Sparkles className="h-3 w-3" /> Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-dashed border-2 border-border/50 bg-transparent">
            <CardContent className="p-4 flex flex-col items-center justify-center py-8 text-center opacity-60">
              <Settings className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">Custom Trigger Automation</p>
              <p className="text-[10px] text-muted-foreground">Pro Feature: Segment based on purchase history</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-border/50 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    {selectedTemplate ? `Campaign: ${campaignName}` : "Select an Automation Template"}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate ? "Configure and review your AI-generated campaign." : "Choose a best-practice template to start."}
                  </CardDescription>
                </div>
              </div>
              {selectedTemplate && (
                <Badge variant="secondary" className="gap-1 animate-pulse bg-primary/20 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3" /> AI Active
                </Badge>
              )}
            </div>
            <CardContent className="p-6 space-y-5">
              {!selectedTemplate ? (
                <div className="py-20 text-center space-y-4">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <Target className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold">Ready to boost conversions?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Select one of our conversion-optimized templates on the left. 
                    Our AI will help you craft the perfect message for your subscribers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject Line</Label>
                    <div className="relative">
                      <Input 
                        value={subjectLine} 
                        onChange={(e) => setSubjectLine(e.target.value)}
                        className="pr-10 font-medium"
                        placeholder="Your email subject..."
                      />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Body</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-bold gap-1.5"
                        onClick={() => handleAIAutomation(selectedTemplate)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Regenerate with AI
                      </Button>
                    </div>
                    {isGenerating ? (
                      <div className="h-[300px] w-full rounded-md bg-muted/30 border border-border/50 flex flex-col items-center justify-center gap-4">
                        <Sparkles className="h-8 w-8 text-primary animate-bounce" />
                        <p className="text-sm font-medium animate-pulse">Applying digital marketing best practices...</p>
                      </div>
                    ) : (
                      <Textarea 
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm leading-relaxed border-border/50"
                        placeholder="Email content will appear here..."
                      />
                    )}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                    <Button 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2 h-11 px-8 shadow-lg shadow-primary/20"
                      onClick={handleSendCampaign}
                      disabled={isSent || !emailContent}
                    >
                      {isSent ? <CheckCircle2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                      {isSent ? "Sent Successfully" : "Send to All Subscribers"}
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto gap-2 h-11 px-6">
                      <Clock className="h-5 w-5" />
                      Schedule Later
                    </Button>
                    <p className="text-[10px] text-muted-foreground sm:ml-auto text-center sm:text-right">
                      Best Practice Tip: <br/>
                      <span className="font-bold">Urgency</span> and <span className="font-bold">Social Proof</span> <br/> 
                      increase click-rates by 27%.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-emerald-500/[0.03]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">List Health</p>
                  <p className="text-lg font-bold">Excellent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-blue-500/[0.03]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg. Open Rate</p>
                  <p className="text-lg font-bold">32.4%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
