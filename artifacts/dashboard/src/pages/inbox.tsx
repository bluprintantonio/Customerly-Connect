import { useListConversations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatMessageTime, getInitials } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

export default function Inbox() {
  const { data: conversations, isLoading } = useListConversations({ status: "all" });

  const sortedConversations = conversations?.sort((a, b) => {
    const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
    const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col h-full bg-background md:bg-transparent">
      <header className="px-6 py-8 md:px-8 md:py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Inbox</h1>
        <p className="text-muted-foreground mt-1">Your recent messages</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-transparent">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : sortedConversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <span className="text-2xl text-primary font-serif italic">!</span>
            </div>
            <h3 className="text-lg font-semibold">You're all caught up</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-[250px]">
              New messages from your website visitors will appear here.
            </p>
          </div>
        ) : (
          sortedConversations?.map((conv) => (
            <Link key={conv.id} href={`/conversations/${conv.id}`} className="block">
              <div
                data-testid={`conversation-item-${conv.id}`}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                  "hover:bg-card hover:shadow-sm border border-transparent hover:border-border",
                  conv.unread ? "bg-card shadow-sm border-border" : ""
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border border-border shadow-sm">
                    <AvatarFallback className={cn(
                      "text-sm font-medium",
                      conv.unread ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    )}>
                      {getInitials(conv.visitorName)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive border-2 border-card ring-0" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "font-medium truncate",
                      conv.unread ? "text-foreground font-semibold" : "text-foreground"
                    )}>
                      {conv.visitorName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap font-medium">
                      {formatMessageTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {conv.status === "closed" && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                        Closed
                      </span>
                    )}
                    {conv.visitorPhone && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {conv.visitorPhone}
                      </span>
                    )}
                    <span className={cn(
                      "text-sm truncate",
                      conv.unread ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {conv.siteUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
