import { TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../../lib/utils";

interface SidebarTabsListProps {
  className?: string;
}

const tabItems = [
  {
    value: "my-circles",
    label: "My Circles",
    icon: "donut_small"
  },
  {
    value: "memberships",
    label: "Circle Memberships", 
    icon: "group"
  },
  {
    value: "pending",
    label: "Pending Requests",
    icon: "hourglass_top"
  },
  {
    value: "activity",
    label: "Activity",
    icon: "timeline"
  },
  {
    value: "notifications",
    label: "Notifications",
    icon: "notifications"
  }
];

export function SidebarTabsList({ className }: SidebarTabsListProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block w-64 flex-shrink-0", className)}>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <TabsList className="flex-col h-auto bg-transparent p-0 w-full space-y-1">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  "w-full justify-start gap-3 py-3 px-4 rounded-lg",
                  "text-muted-foreground font-medium",
                  "data-[state=active]:bg-accent/10 data-[state=active]:text-primary",
                  "hover:bg-muted/50 transition-all duration-200"
                )}
              >
                <span className="material-icons text-base">{item.icon}</span>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {/* Mobile Horizontal Tabs */}
      <div className="lg:hidden mb-6">
        <TabsList className="bg-white rounded-xl p-1 w-full overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-thin">
          {tabItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(
                "data-[state=active]:bg-accent/10 data-[state=active]:text-primary",
                "rounded-lg transition-all text-sm px-3 py-2 flex-shrink-0",
                "text-muted-foreground font-medium"
              )}
            >
              <span className="material-icons text-sm mr-2">{item.icon}</span>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </>
  );
}