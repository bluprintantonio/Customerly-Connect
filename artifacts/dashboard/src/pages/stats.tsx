import { useGetConversationStats, useListConversations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatRelativeTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, InboxIcon, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetConversationStats();
  const { data: conversations, isLoading: convsLoading } = useListConversations({ status: "all" });

  const recentConvs = conversations
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    { title: "Total", value: stats?.total || 0, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Unread", value: stats?.unread || 0, icon: InboxIcon, color: "text-primary", bg: "bg-primary/10" },
    { title: "Open", value: stats?.open || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Closed", value: stats?.closed || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your messenger performance at a glance</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title} className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {convsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))
            ) : recentConvs?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No recent activity to show.
              </div>
            ) : (
              recentConvs?.map(conv => (
                <div key={conv.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{conv.visitorName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started {formatRelativeTime(conv.createdAt)} on {conv.siteUrl.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                  <Link href={`/conversations/${conv.id}`}>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer">
                      View
                    </span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}