import { ReactNode, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Calendar, 
  MessageSquare,
  Activity,
  Database,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const navigationItems = [
  { 
    path: "/", 
    label: "Overview", 
    icon: LayoutDashboard, 
    roles: ["admin", "coach", "client"] as UserRole[] 
  },
  { 
    path: "/clients", 
    label: "Clients", 
    icon: Users, 
    roles: ["admin", "coach"] as UserRole[] 
  },
  { 
    path: "/coaches", 
    label: "Coaches", 
    icon: UserCog, 
    roles: ["admin"] as UserRole[] 
  },
  { 
    path: "/plans", 
    label: "Plans & Routines", 
    icon: Calendar, 
    roles: ["admin", "coach"] as UserRole[] 
  },
  { 
    path: "/feedback", 
    label: "Feedback & Rules", 
    icon: MessageSquare, 
    roles: ["admin", "coach"] as UserRole[] 
  },
  { 
    path: "/insights", 
    label: "Insights", 
    icon: Activity, 
    roles: ["admin", "coach"] as UserRole[] 
  },
  { 
    path: "/pipelines", 
    label: "Data Pipelines", 
    icon: Database, 
    roles: ["admin"] as UserRole[] 
  },
  { 
    path: "/settings", 
    label: "Settings", 
    icon: Settings, 
    roles: ["admin", "coach", "client"] as UserRole[] 
  },
  { 
    path: "/audit", 
    label: "Audit Logs", 
    icon: FileText, 
    roles: ["admin"] as UserRole[] 
  },
];

export const AppLayout = ({ children, currentRole, onRoleChange }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(currentRole)
  );

  const getRoleColor = (role: UserRole) => {
    switch(role) {
      case "admin": return "bg-destructive text-destructive-foreground";
      case "coach": return "bg-primary text-primary-foreground";
      case "client": return "bg-accent text-accent-foreground";
    }
  };

  const getRoleName = (role: UserRole) => {
    switch(role) {
      case "admin": return "Admin";
      case "coach": return "Coach";
      case "client": return "Client";
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <h1 className="text-xl font-bold text-sidebar-foreground">
              HolisticOS
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {currentRole === "admin" ? "AD" : currentRole === "coach" ? "CO" : "CL"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left text-sm">
                    <div className="font-medium">Demo User</div>
                    <div className="text-xs text-muted-foreground capitalize">{currentRole}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRoleChange("admin")}>
                  <Badge className={cn("mr-2", getRoleColor("admin"))}>Admin</Badge>
                  Full access
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange("coach")}>
                  <Badge className={cn("mr-2", getRoleColor("coach"))}>Coach</Badge>
                  Manage clients
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange("client")}>
                  <Badge className={cn("mr-2", getRoleColor("client"))}>Client</Badge>
                  View only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search clients, coaches, plans..." 
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={cn("capitalize", getRoleColor(currentRole))}>
              {getRoleName(currentRole)}
            </Badge>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
