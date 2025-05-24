import { Link, useLocation } from "wouter";
import { Database, ScrollText, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  {
    title: "Logs",
    href: "/",
    icon: ScrollText,
  },
  {
    title: "Conexões Redis",
    href: "/connections",
    icon: Database,
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 dark:border-gray-700 px-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-navy dark:text-blue-400">VLogger</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600" 
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-gray-700 p-3">
        <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300">
          <Settings className="mr-3 h-4 w-4" />
          Configurações
        </Button>
      </div>
    </div>
  );
}