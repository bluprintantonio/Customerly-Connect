import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Phone, Webhook, Eye, EyeOff, ExternalLink, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [twilioToNumber, setTwilioToNumber] = useState("");
  const [twilioChannel, setTwilioChannel] = useState<"sms" | "whatsapp">("whatsapp");
  const [showToken, setShowToken] = useState(false);
  const [showWebhookDocs, setShowWebhookDocs] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setTwilioAccountSid(settings["twilioAccountSid"] ?? "");
    setTwilioAuthToken(settings["twilioAuthToken"] ?? "");
    setTwilioFromNumber(settings["twilioFromNumber"] ?? "");
    setTwilioToNumber(settings["twilioToNumber"] ?? "");
    setTwilioChannel((settings["twilioChannel"] as "sms" | "whatsapp") ?? "whatsapp");
  }, [settings]);

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getSettings"] });
        toast({ title: "Settings saved" });
      },
      onError: () => {
        toast({ title: "Failed to save settings", variant: "destructive" });
      },
    },
  });

  const handleSave = () => {
    const data: Record<string, string> = {
      twilioChannel,
    };
    if (twilioAccountSid) data["twilioAccountSid"] = twilioAccountSid;
    if (twilioAuthToken) data["twilioAuthToken"] = twilioAuthToken;
    if (twilioFromNumber) data["twilioFromNumber"] = twilioFromNumber;
    if (twilioToNumber) data["twilioToNumber"] = twilioToNumber;
    updateMutation.mutate({ data });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const inboundWebhookUrl = `${window.location.origin}/api/twilio/inbound`;
  const sandboxNumber = "+14155238886";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure notifications and integrations.</p>
      </div>

      {/* Webhook info section */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowWebhookDocs(!showWebhookDocs)}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Webhook — connect an AI agent</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">for developers</span>
          </div>
          {showWebhookDocs ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showWebhookDocs && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Set a <strong className="text-foreground">Webhook URL</strong> on each widget (in the Widgets page) to receive a POST whenever a visitor sends a message. Your AI reads it and calls back to reply.
            </p>
            <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-2">
              <p className="text-foreground font-semibold">Webhook payload (JSON):</p>
              <pre className="whitespace-pre-wrap text-muted-foreground">{`{
  "event": "new_message",
  "conversationId": 42,
  "visitorName": "Maria",
  "visitorEmail": "maria@example.com",
  "siteUrl": "https://yoursite.com",
  "message": {
    "id": 7,
    "content": "Hi, I need help",
    "sender": "visitor",
    "createdAt": "2026-05-07T14:00:00Z"
  }
}`}</pre>
            </div>
            <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-2">
              <p className="text-foreground font-semibold">To reply from your AI (POST):</p>
              <pre className="whitespace-pre-wrap text-muted-foreground">{`POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{ "content": "Hello! How can I help?" }`}</pre>
            </div>
            <p>
              Requests include an <code className="text-foreground">x-simplechat-signature</code> header (HMAC-SHA256) when you set a webhook secret on the widget.
            </p>
          </div>
        )}
      </section>

      {/* Twilio section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">WhatsApp / SMS via Twilio</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-5">
          <p className="text-sm text-muted-foreground">
            When a visitor sends a message, you'll get notified on your phone. Reply starting with <code className="text-foreground">#ID:</code> (e.g. <code className="text-foreground">#42: Yes, I can help!</code>) and it goes straight to the visitor.
          </p>

          {/* Channel selector */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTwilioChannel("whatsapp")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  twilioChannel === "whatsapp"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setTwilioChannel("sms")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  twilioChannel === "sms"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Phone className="h-4 w-4" />
                SMS
              </button>
            </div>
          </div>

          {/* WhatsApp sandbox instructions */}
          {twilioChannel === "whatsapp" && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2 text-sm dark:bg-green-950/20 dark:border-green-900">
              <p className="font-semibold text-green-800 dark:text-green-400 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Sandbox setup (works on Twilio trial)
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-green-700 dark:text-green-500">
                <li>In Twilio Console, go to <strong>Messaging → Try it out → Send a WhatsApp message</strong></li>
                <li>
                  On your phone, send the join keyword shown there to{" "}
                  <strong>{sandboxNumber}</strong> on WhatsApp
                </li>
                <li>Use <strong>{sandboxNumber}</strong> as your "From" number below</li>
                <li>
                  Set the sandbox inbound webhook URL to:
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white dark:bg-black/30 rounded px-2 py-1 text-xs text-green-900 dark:text-green-300 break-all border border-green-200 dark:border-green-800">
                      {inboundWebhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(inboundWebhookUrl); toast({ title: "Copied!" }); }}
                      className="shrink-0 text-green-700 hover:underline text-xs dark:text-green-400"
                    >
                      Copy
                    </button>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {twilioChannel === "sms" && (
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Twilio inbound webhook URL</p>
              <p className="text-muted-foreground">In Twilio Console → Phone Numbers → your number → Messaging webhooks:</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-background rounded px-2 py-1 text-foreground break-all">{inboundWebhookUrl}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(inboundWebhookUrl); toast({ title: "Copied!" }); }}
                  className="shrink-0 text-primary hover:underline text-xs"
                >
                  Copy
                </button>
              </div>
              <p className="text-muted-foreground mt-2">Note: Twilio trial accounts can only send SMS to verified phone numbers.</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="accountSid">Twilio Account SID</Label>
              <Input
                id="accountSid"
                value={twilioAccountSid}
                onChange={(e) => setTwilioAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="authToken">Auth Token</Label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showToken ? "text" : "password"}
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fromNumber">
                  {twilioChannel === "whatsapp" ? "Sandbox Number" : "Twilio From Number"}
                </Label>
                <Input
                  id="fromNumber"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                  placeholder={twilioChannel === "whatsapp" ? sandboxNumber : "+15551234567"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="toNumber">Your Phone Number</Label>
                <Input
                  id="toNumber"
                  value={twilioToNumber}
                  onChange={(e) => setTwilioToNumber(e.target.value)}
                  placeholder="+15559876543"
                />
              </div>
            </div>
          </div>

          <a
            href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open WhatsApp Sandbox in Twilio <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full sm:w-auto"
      >
        <Save className="h-4 w-4 mr-2" />
        {updateMutation.isPending ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
}
