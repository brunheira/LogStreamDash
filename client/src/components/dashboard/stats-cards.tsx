import { FileText, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalLogs: number;
    errors24h: number;
    warnings24h: number;
    successRate: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const statCards = [
    {
      title: "Total de Logs",
      value: stats.totalLogs.toLocaleString(),
      icon: FileText,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      valueColor: "text-primary",
      glowColor: "shadow-blue-500/20",
    },
    {
      title: "Erros (24h)",
      value: stats.errors24h.toString(),
      icon: AlertCircle,
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      valueColor: "text-red-400",
      glowColor: "shadow-red-500/20",
    },
    {
      title: "Avisos (24h)",
      value: stats.warnings24h.toString(),
      icon: AlertTriangle,
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      valueColor: "text-yellow-400",
      glowColor: "shadow-yellow-500/20",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      valueColor: "text-green-400",
      glowColor: "shadow-green-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className={`bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl hover:shadow-lg hover:${stat.glowColor} transition-all duration-300 hover:-translate-y-1`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.valueColor} tracking-tight`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
