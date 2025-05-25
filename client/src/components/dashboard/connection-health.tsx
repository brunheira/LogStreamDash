import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Zap,
  Server,
  Database,
  Eye,
  RefreshCw
} from "lucide-react";

interface ConnectionHealthProps {
  connections: any[];
  selectedConnectionId?: string;
}

interface HealthMetrics {
  id: number;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'slow';
  responseTime: number;
  uptime: number;
  lastCheck: Date;
  memoryUsage?: number;
  connectedClients?: number;
  opsPerSecond?: number;
  errorRate: number;
  reliability: number;
}

export function ConnectionHealth({ connections, selectedConnectionId }: ConnectionHealthProps) {
  const [healthData, setHealthData] = useState<HealthMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Simulate real-time health monitoring
  const { data: realTimeHealth, refetch } = useQuery({
    queryKey: ["/api/connections/health"],
    queryFn: async () => {
      // In a real app, this would call your backend health check endpoint
      return connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        status: Math.random() > 0.8 ? 'error' : Math.random() > 0.9 ? 'slow' : 'connected',
        responseTime: Math.floor(Math.random() * 100) + 10,
        uptime: 99.2 + Math.random() * 0.8,
        lastCheck: new Date(),
        memoryUsage: Math.floor(Math.random() * 80) + 20,
        connectedClients: Math.floor(Math.random() * 50) + 5,
        opsPerSecond: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 5,
        reliability: 95 + Math.random() * 5
      }));
    },
    refetchInterval: isMonitoring ? 5000 : false,
    enabled: connections.length > 0
  });

  useEffect(() => {
    if (realTimeHealth) {
      setHealthData(realTimeHealth);
    }
  }, [realTimeHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'slow': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'disconnected': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'slow': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'slow': return 'Lento';
      case 'error': return 'Erro';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  const getHealthScore = (metrics: HealthMetrics) => {
    const uptimeScore = metrics.uptime;
    const responseScore = Math.max(0, 100 - metrics.responseTime);
    const errorScore = Math.max(0, 100 - (metrics.errorRate * 20));
    return Math.round((uptimeScore + responseScore + errorScore) / 3);
  };

  const selectedConnection = healthData.find(conn => conn.id.toString() === selectedConnectionId);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Status das Conexões em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={!isMonitoring}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            <Button
              variant={isMonitoring ? "default" : "outline"}
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Monitorando
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  Pausado
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {healthData.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">
              Nenhuma conexão para monitorar
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Conexões Ativas</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {healthData.filter(conn => conn.status === 'connected').length}
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Latência Média</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(healthData.reduce((acc, conn) => acc + conn.responseTime, 0) / healthData.length)}ms
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Uptime Médio</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {(healthData.reduce((acc, conn) => acc + conn.uptime, 0) / healthData.length).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Com Problemas</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {healthData.filter(conn => conn.status === 'error' || conn.status === 'slow').length}
                </p>
              </div>
            </div>

            {/* Detailed Connection Status */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Status Detalhado das Conexões</h3>
              {healthData.map((connection) => (
                <div
                  key={connection.id}
                  className={`border rounded-lg p-4 ${
                    selectedConnectionId === connection.id.toString() 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Server className="w-6 h-6" />
                        {isMonitoring && (
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                            connection.status === 'connected' ? 'bg-green-500' :
                            connection.status === 'slow' ? 'bg-yellow-500' :
                            connection.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                          } ${isMonitoring ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{connection.name}</h4>
                        <p className="text-sm text-slate-500">ID: {connection.id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(connection.status)}>
                      {getStatusIcon(connection.status)}
                      <span className="ml-1">{getStatusText(connection.status)}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Latência</p>
                      <p className="font-medium">{connection.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Uptime</p>
                      <p className="font-medium">{connection.uptime.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Memória</p>
                      <p className="font-medium">{connection.memoryUsage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Clientes</p>
                      <p className="font-medium">{connection.connectedClients}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Health Score</span>
                      <span className="text-sm">{getHealthScore(connection)}%</span>
                    </div>
                    <Progress value={getHealthScore(connection)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>Ops/sec: {connection.opsPerSecond}</span>
                    <span>Erro: {connection.errorRate.toFixed(1)}%</span>
                    <span>Última verificação: {connection.lastCheck.toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time Monitoring Status */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {isMonitoring ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Monitoramento ativo - atualizando a cada 5 segundos
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Monitoramento pausado
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 O monitoramento em tempo real ajuda a identificar problemas de conectividade instantaneamente
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}