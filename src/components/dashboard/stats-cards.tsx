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
      iconBg: "bg-blue-100 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Erros (24h)",
      value: stats.errors24h.toString(),
      icon: AlertCircle,
      iconBg: "bg-red-100 dark:bg-red-950/20",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Warnings (24h)",
      value: stats.warnings24h.toString(),
      icon: AlertTriangle,
      iconBg: "bg-yellow-100 dark:bg-yellow-950/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      valueColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
          <Card key={stat.title} className="border border-slate-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.valueColor || "text-slate-900 dark:text-slate-100"}`}>
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
