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
      <div className="lg:hidden">
        <div className="mx-4">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full h-auto p-0 flex justify-start">
              {tabItems.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className={cn(
                    "flex-shrink-0 px-4 py-3 font-medium text-gray-500 hover:text-primary transition-colors",
                    "data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary",
                    "border-b-2 border-transparent bg-transparent rounded-none"
                  )}
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
      </div>
    </>
  );
}