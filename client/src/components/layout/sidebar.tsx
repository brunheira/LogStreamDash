import { Link, useLocation } from "wouter";
import { Database, ScrollText, Home, Settings, X, Activity, Brain, Download, Clock, Wifi, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: ScrollText,
  },
  {
    title: "Conexões Redis",
    href: "/connections",
    icon: Database,
  },
];

const dashboardSections = [
  { 
    name: "Status das Conexões", 
    href: "/#connection-health", 
    icon: Wifi,
    description: "Monitoramento em tempo real"
  },
  { 
    name: "Análise Inteligente", 
    href: "/#pattern-recognition", 
    icon: Brain,
    description: "Detecção de padrões e anomalias"
  },
  { 
    name: "Timeline de Logs", 
    href: "/#log-timeline", 
    icon: Clock,
    description: "Visualização temporal interativa"
  },
  { 
    name: "Estatísticas", 
    href: "/#stats", 
    icon: BarChart3,
    description: "Métricas e resumos"
  },
  { 
    name: "Exportação", 
    href: "/#export", 
    icon: Download,
    description: "Download de logs (CSV/JSON)"
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-gray-700 px-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-navy dark:text-blue-400">VLogger</h1>
            </div>
            
            {/* Close button for mobile */}
            <Button 
              variant="ghost" 
              size="sm"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
                Navegação Principal
              </h3>
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
                      onClick={() => {
                        // Close sidebar on mobile when navigating
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Dashboard Sections */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
                Seções do Dashboard
              </h3>
              {dashboardSections.map((section) => {
                const Icon = section.icon;
                const isCurrentPage = location === "/";
                
                return (
                  <button
                    key={section.name}
                    onClick={() => {
                      if (section.href.startsWith("/#")) {
                        // Se já estiver no dashboard, apenas rola para a seção
                        if (location === "/") {
                          const sectionId = section.href.replace("/#", "");
                          const element = document.getElementById(sectionId);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        } else {
                          // Se não estiver no dashboard, navega primeiro
                          window.location.href = section.href;
                        }
                      }
                      // Close sidebar on mobile
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={cn(
                      "w-full flex items-start px-3 py-3 text-sm rounded-md transition-colors text-left",
                      isCurrentPage
                        ? "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Status Indicator */}
            <div className="px-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sistema Ativo
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Monitoramento em tempo real ativo
                </div>
              </div>
            </div>
          </nav>


        </div>
      </div>
    </>
  );
}