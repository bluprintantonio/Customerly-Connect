import { useState } from "react";
import { useListWidgets, useCreateWidget, useDeleteWidget, useUpdateWidget, getListWidgetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Code2, Globe, Webhook, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function WebhookSection({ widget }: { widget: { id: number; webhookUrl: string | null; webhookSecret: string | null } }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(widget.webhookUrl ?? "");
  const [secret, setSecret] = useState(widget.webhookSecret ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useUpdateWidget({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Webhook saved" });
      },
      onError: () => {
        toast({ title: "Failed to save webhook", variant: "destructive" });
      },
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: widget.id,
      data: {
        webhookUrl: url || null,
        webhookSecret: secret || null,
      },
    });
  };

  return (
    <div className="border-t border-border/40 mt-4 pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Webhook className="h-4 w-4" />
        Webhook / AI Agent
        {widget.webhookUrl ? (
          <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">Configured</span>
        ) : null}
        {open ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className={cn("h-4 w-4", widget.webhookUrl ? "" : "ml-auto")} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-ai.example.com/webhook"
              className="text-xs h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              POST'd when a visitor sends a message. Your AI replies via <code className="text-foreground">/api/conversations/&#123;id&#125;/messages</code>.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook Secret (optional)</Label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="A secret to sign requests (HMAC-SHA256)"
              className="text-xs h-9"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full rounded-lg"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {updateMutation.isPending ? "Saving…" : "Save Webhook"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Widgets() {
  const { data: widgets, isLoading } = useListWidgets();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");

  const createMutation = useCreateWidget({
    mutation: {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewName("");
        setNewSiteUrl("");
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Widget created successfully" });
      },
      onError: () => {
        toast({ title: "Failed to create widget", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteWidget({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWidgetsQueryKey() });
        toast({ title: "Widget deleted" });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSiteUrl) return;
    createMutation.mutate({ data: { name: newName, siteUrl: newSiteUrl } });
  };

  const copyEmbedCode = (widget: { apiKey: string; agentName?: string | null; greeting?: string | null; color?: string | null }) => {
    const domain = import.meta.env.VITE_PUBLIC_API_URL || window.location.origin;
    const attrs = [
      `src="${domain}/api/widget.js"`,
      `data-widget-key="${widget.apiKey}"`,
      `data-api-url="${domain}/api"`,
      widget.agentName ? `data-agent-name="${widget.agentName}"` : null,
      widget.greeting  ? `data-greeting="${widget.greeting}"` : null,
      widget.color     ? `data-color="${widget.color}"` : null,
    ].filter(Boolean).join("\n  ");
    const code = `<script\n  ${attrs}>\n</script>`;
    navigator.clipboard.writeText(code);
    toast({ title: "Embed code copied to clipboard!" });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Widgets</h1>
          <p className="text-muted-foreground mt-1">Manage chat widgets for your websites</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-widget" className="rounded-xl shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Chat Widget</DialogTitle>
                <DialogDescription>
                  Add a new widget for your WordPress site.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    data-testid="input-widget-name"
                    placeholder="e.g. Main Blog"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="siteUrl">Website URL</Label>
                  <Input
                    id="siteUrl"
                    data-testid="input-widget-url"
                    placeholder="https://example.com"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !newName || !newSiteUrl}
                  className="rounded-xl w-full sm:w-auto"
                >
                  {createMutation.isPending ? "Creating..." : "Create Widget"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : widgets?.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No widgets yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">Create your first widget to install on your WordPress site.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-xl">
              Create Widget
            </Button>
          </div>
        ) : (
          widgets?.map((widget) => (
            <Card key={widget.id} data-testid={`widget-card-${widget.id}`} className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {widget.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {widget.siteUrl}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl -mt-2 -mr-2"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this widget?")) {
                        deleteMutation.mutate({ id: widget.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-5 flex-1 flex flex-col">
                <div className="mb-4 flex-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                    WordPress Embed Code
                  </Label>
                  <div className="relative">
                    <pre className="bg-secondary/50 text-secondary-foreground p-4 rounded-xl text-[11px] sm:text-xs overflow-x-auto border border-border/50 font-mono whitespace-pre-wrap word-break-all">
                      <code>
{(() => {
  const domain = import.meta.env.VITE_PUBLIC_API_URL || window.location.origin;
  const attrs = [
    `src="${domain}/api/widget.js"`,
    `data-widget-key="${widget.apiKey}"`,
    `data-api-url="${domain}/api"`,
    widget.agentName ? `data-agent-name="${widget.agentName}"` : null,
    widget.greeting  ? `data-greeting="${widget.greeting}"` : null,
    widget.color     ? `data-color="${widget.color}"` : null,
  ].filter(Boolean).join("\n  ");
  return `<script\n  ${attrs}>\n</script>`;
})()}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-muted-foreground font-medium">
                    Created {formatRelativeTime(widget.createdAt)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyEmbedCode(widget)}
                    className="rounded-lg shadow-sm"
                  >
                    <Code2 className="h-3.5 w-3.5 mr-1.5" />
                    Copy Code
                  </Button>
                </div>

                <WebhookSection widget={widget} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
