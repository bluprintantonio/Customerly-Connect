import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetConversation, 
  getGetConversationQueryKey,
  useSendAgentMessage,
  useUpdateConversation
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send, CheckCircle, ExternalLink } from "lucide-react";
import { formatMessageTime, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Conversation() {
  const [, params] = useRoute("/conversations/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [draft, setDraft] = useState("");

  const { data: conversation, isLoading } = useGetConversation(id, {
    query: {
      enabled: !!id,
      queryKey: getGetConversationQueryKey(id)
    }
  });

  const sendMutation = useSendAgentMessage({
    mutation: {
      onSuccess: (newMessage) => {
        setDraft("");
        // Optimistic cache update
        queryClient.setQueryData(getGetConversationQueryKey(id), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, newMessage]
          };
        });
      }
    }
  });

  const updateMutation = useUpdateConversation({
    mutation: {
      onSuccess: (updatedData) => {
        queryClient.setQueryData(getGetConversationQueryKey(id), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            status: updatedData.status,
            unread: updatedData.unread
          };
        });
      }
    }
  });

  // Mark as read when opening
  useEffect(() => {
    if (conversation?.unread) {
      updateMutation.mutate({ id, data: { unread: false } });
    }
  }, [conversation?.unread, id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages?.length]);

  const handleSend = () => {
    if (!draft.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ id, data: { content: draft } });
  };

  const toggleStatus = () => {
    if (!conversation) return;
    const newStatus = conversation.status === "open" ? "closed" : "open";
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        <header className="flex items-center gap-4 p-4 border-b border-border bg-card">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </header>
        <div className="flex-1 p-4" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative max-w-3xl mx-auto border-x border-border shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {getInitials(conversation.visitorName)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold text-base leading-tight">{conversation.visitorName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <a href={conversation.siteUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                {conversation.siteUrl.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <Button 
          data-testid="button-toggle-status"
          variant={conversation.status === "open" ? "secondary" : "outline"}
          size="sm"
          onClick={toggleStatus}
          disabled={updateMutation.isPending}
          className={cn(
            "h-8 rounded-full px-4 text-xs font-medium transition-all",
            conversation.status === "closed" && "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
          )}
        >
          {conversation.status === "open" ? (
            <>Close Thread</>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Closed
            </>
          )}
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {conversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet.
          </div>
        ) : (
          conversation.messages.map((msg, i) => {
            const isAgent = msg.sender === "agent";
            const showAvatar = !isAgent && (i === 0 || conversation.messages[i - 1].sender !== msg.sender);
            
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isAgent ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {!isAgent && (
                  <div className="w-8 shrink-0 flex items-end">
                    {showAvatar && (
                      <Avatar className="h-8 w-8 border border-border shadow-sm">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {getInitials(conversation.visitorName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
                
                <div className={cn(
                  "flex flex-col gap-1",
                  isAgent ? "items-end" : "items-start"
                )}>
                  <div 
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                      isAgent 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-card border border-border text-card-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium px-1">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-background border-t border-border mt-auto pb-safe">
        {conversation.status === "closed" ? (
          <div className="text-center p-4 bg-muted/50 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            This conversation is closed. 
            <button onClick={toggleStatus} className="ml-2 font-medium text-primary hover:underline">
              Reopen
            </button>
          </div>
        ) : (
          <div className="relative flex items-end gap-2 bg-card border border-border shadow-sm rounded-2xl p-2 focus-within:ring-2 ring-primary/20 transition-all">
            <Textarea
              data-testid="input-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[44px] max-h-32 border-0 bg-transparent resize-none py-3 px-3 shadow-none focus-visible:ring-0 text-[15px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              data-testid="button-send"
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl shrink-0 transition-all duration-200",
                draft.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
              onClick={handleSend}
              disabled={!draft.trim() || sendMutation.isPending}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}