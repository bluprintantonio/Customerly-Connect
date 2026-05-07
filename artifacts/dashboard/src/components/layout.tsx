import { Link, useLocation } from "wouter";
import { MessageSquare, BarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: MessageSquare, label: "Inbox" },
    { href: "/stats", icon: BarChart, label: "Stats" },
    { href: "/widgets", icon: Settings, label: "Widgets" },
  ];

  // Hide nav on conversation details page for mobile
  const isConversationPage = location.startsWith("/conversations/");

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            SimpleChat
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <span
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
                  location === item.href || (item.href !== "/" && location.startsWith(item.href))
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[100dvh] md:min-h-0 relative">
        <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        {!isConversationPage && (
          <div className="md:hidden border-t border-border bg-card pb-safe sticky bottom-0 z-50">
            <nav className="flex items-center justify-around p-2">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
                    <span
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-6 w-6 transition-transform duration-200",
                          isActive ? "scale-110" : ""
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
