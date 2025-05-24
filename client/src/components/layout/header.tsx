import { Link, useLocation } from "wouter";
import { Database, ScrollText, Server, Settings, Plus, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onNewConnection: () => void;
}

export function Header({ onNewConnection }: HeaderProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Logs", icon: ScrollText },
    { path: "/connections", label: "Conexões Redis", icon: Server },
    { path: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-slate-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-navy dark:text-blue-400">RedisWatch</h1>
            </div>
            <nav className="hidden md:flex space-x-8 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={cn(
                        "flex items-center space-x-2 transition-colors pb-1",
                        isActive
                          ? "text-primary font-medium border-b-2 border-primary"
                          : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={onNewConnection} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Conexão</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
