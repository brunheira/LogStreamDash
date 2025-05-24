import { Link, useLocation } from "wouter";
import { Database, ScrollText, Server, Settings, Plus, Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onNewConnection: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onNewConnection, onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { path: "/", label: "Logs", icon: ScrollText },
    { path: "/connections", label: "Conexões Redis", icon: Server }
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-slate-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Hamburger button for mobile and sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {location === "/" ? "Dashboard de Logs" : location === "/connections" ? "Conexões Redis" : "VLogger"}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={onNewConnection} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Conexão</span>
            </Button>
            <ThemeToggle />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
