import { Server, Activity, Edit, Trash2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getConnectionStatusColor, getConnectionStatusIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RedisConnection } from "@shared/schema";

interface ConnectionCardProps {
  connection: RedisConnection;
  onTest: (id: number) => void;
  onEdit: (connection: RedisConnection) => void;
  onDelete: (id: number) => void;
  isTestLoading?: boolean;
}

export function ConnectionCard({
  connection,
  onTest,
  onEdit,
  onDelete,
  isTestLoading,
}: ConnectionCardProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro de Conexão';
      default:
        return 'Desconectado';
    }
  };

  const getLastConnectedText = () => {
    if (!connection.lastConnected) return "Nunca conectado";
    
    const now = new Date();
    const lastConnected = new Date(connection.lastConnected);
    const diffMs = now.getTime() - lastConnected.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              connection.status === 'connected' ? "bg-green-100 dark:bg-green-950/20" :
              connection.status === 'connecting' ? "bg-yellow-100 dark:bg-yellow-950/20" :
              connection.status === 'error' ? "bg-red-100 dark:bg-red-950/20" :
              "bg-gray-100 dark:bg-gray-950/20"
            )}>
              <Server className={cn(
                "w-5 h-5",
                connection.status === 'connected' ? "text-green-600 dark:text-green-400" :
                connection.status === 'connecting' ? "text-yellow-600 dark:text-yellow-400" :
                connection.status === 'error' ? "text-red-600 dark:text-red-400" :
                "text-gray-600 dark:text-gray-400"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                {connection.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {connection.host}:{connection.port}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <Badge className={getConnectionStatusColor(connection.status)}>
                  <Circle className="w-2 h-2 mr-1 fill-current" />
                  {getStatusText(connection.status)}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {getLastConnectedText()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTest(connection.id)}
              disabled={isTestLoading}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Activity className={cn(
                "w-4 h-4",
                isTestLoading && "animate-spin"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(connection)}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(connection.id)}
              className="hover:bg-red-100 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
