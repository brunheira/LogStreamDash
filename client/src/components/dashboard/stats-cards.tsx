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
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      valueColor: "text-primary",
    },
    {
      title: "Erros (24h)",
      value: stats.errors24h.toString(),
      icon: AlertCircle,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Avisos (24h)",
      value: stats.warnings24h.toString(),
      icon: AlertTriangle,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      valueColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      valueColor: "text-green-600 dark:text-green-400",
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
            className="border shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
