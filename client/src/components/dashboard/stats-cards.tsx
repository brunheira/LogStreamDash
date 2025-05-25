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
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconBg: "bg-blue-500/10 backdrop-blur-sm",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Erros (24h)",
      value: stats.errors24h.toString(),
      icon: AlertCircle,
      gradient: "from-red-500/20 to-pink-500/20",
      iconBg: "bg-red-500/10 backdrop-blur-sm",
      iconColor: "text-red-500",
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Avisos (24h)",
      value: stats.warnings24h.toString(),
      icon: AlertTriangle,
      gradient: "from-yellow-500/20 to-orange-500/20",
      iconBg: "bg-yellow-500/10 backdrop-blur-sm",
      iconColor: "text-yellow-500",
      valueColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      gradient: "from-green-500/20 to-emerald-500/20",
      iconBg: "bg-green-500/10 backdrop-blur-sm",
      iconColor: "text-green-500",
      valueColor: "text-green-600 dark:text-green-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card shadow-elegant border-0 bg-gradient-to-br from-white/50 to-white/30 dark:from-card/50 dark:to-card/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-24 shimmer"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-lg w-20 shimmer"></div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl shimmer"></div>
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
            className={`glass-card shadow-elegant hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 bg-gradient-to-br ${stat.gradient} backdrop-blur-xl`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold tracking-tight ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center ring-1 ring-white/20 dark:ring-white/10`}>
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
