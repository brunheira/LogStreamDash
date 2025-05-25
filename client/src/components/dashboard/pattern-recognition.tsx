import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Activity,
  Target,
  Zap,
  Eye
} from "lucide-react";

type Log = any;

interface PatternRecognitionProps {
  logs: Log[];
  isLoading?: boolean;
}

interface Pattern {
  id: string;
  type: 'anomaly' | 'trend' | 'frequency' | 'error_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  count: number;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: string[];
  suggestion: string;
}

export function PatternRecognition({ logs, isLoading }: PatternRecognitionProps) {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const patterns = useMemo(() => {
    if (!logs.length) return [];

    const detectedPatterns: Pattern[] = [];
    
    // Error Spike Detection
    const errorLogs = logs.filter(log => log.level === 'error');
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = errorLogs.filter(log => 
      log.timestamp && new Date(log.timestamp) > lastHour
    );

    if (recentErrors.length > 10) {
      detectedPatterns.push({
        id: 'error-spike-1',
        type: 'error_spike',
        severity: recentErrors.length > 50 ? 'critical' : recentErrors.length > 25 ? 'high' : 'medium',
        title: 'Error Spike Detected',
        description: `Unusual increase in error frequency: ${recentErrors.length} errors in the last hour`,
        count: recentErrors.length,
        confidence: 85,
        firstSeen: new Date(Math.min(...recentErrors.map(log => new Date(log.timestamp).getTime()))),
        lastSeen: new Date(Math.max(...recentErrors.map(log => new Date(log.timestamp).getTime()))),
        examples: recentErrors.slice(0, 3).map(log => log.message),
        suggestion: 'Check system resources and recent deployments. Consider scaling if needed.'
      });
    }

    // Repeated Error Messages
    const errorMessages = errorLogs.reduce((acc, log) => {
      const key = log.message.substring(0, 100); // First 100 chars
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorMessages)
      .filter(([_, count]) => count > 5)
      .forEach(([message, count]) => {
        detectedPatterns.push({
          id: `repeated-error-${message.substring(0, 20)}`,
          type: 'frequency',
          severity: count > 20 ? 'high' : count > 10 ? 'medium' : 'low',
          title: 'Repeated Error Pattern',
          description: `Same error message occurred ${count} times`,
          count,
          confidence: 90,
          firstSeen: new Date(logs.find(log => log.message.includes(message.substring(0, 50)))?.timestamp || now),
          lastSeen: new Date(),
          examples: [message],
          suggestion: 'This recurring error needs investigation. Check for configuration issues or bugs.'
        });
      });

    // Service-specific patterns
    const serviceErrors = logs.reduce((acc, log) => {
      if (log.level === 'error') {
        acc[log.service] = (acc[log.service] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    Object.entries(serviceErrors)
      .filter(([_, count]) => count > logs.length * 0.1) // More than 10% of logs
      .forEach(([service, count]) => {
        detectedPatterns.push({
          id: `service-anomaly-${service}`,
          type: 'anomaly',
          severity: 'medium',
          title: 'Service Error Concentration',
          description: `Service "${service}" has unusually high error rate`,
          count,
          confidence: 75,
          firstSeen: new Date(logs.find(log => log.service === service && log.level === 'error')?.timestamp || now),
          lastSeen: new Date(),
          examples: logs.filter(log => log.service === service && log.level === 'error').slice(0, 2).map(log => log.message),
          suggestion: `Focus monitoring on ${service} service. Check service health and dependencies.`
        });
      });

    // Time-based patterns (silent periods)
    const logsByHour = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const avgLogsPerHour = Object.values(logsByHour).reduce((a, b) => a + b, 0) / 24;
    Object.entries(logsByHour)
      .filter(([_, count]) => count < avgLogsPerHour * 0.3) // Less than 30% of average
      .forEach(([hour, count]) => {
        if (count === 0) {
          detectedPatterns.push({
            id: `silent-period-${hour}`,
            type: 'anomaly',
            severity: 'medium',
            title: 'Silent Period Detected',
            description: `No logs during hour ${hour}:00 - unusual silence`,
            count: 0,
            confidence: 70,
            firstSeen: new Date(),
            lastSeen: new Date(),
            examples: ['No log activity during this period'],
            suggestion: 'Verify if services are running normally during this time period.'
          });
        }
      });

    return detectedPatterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [logs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'error_spike': return <Zap className="w-4 h-4" />;
      case 'anomaly': return <Eye className="w-4 h-4" />;
      case 'frequency': return <Activity className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Análise Inteligente de Padrões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-3 animate-pulse text-purple-600" />
              <p className="text-slate-600 dark:text-slate-400">Analisando padrões nos logs...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="patterns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="patterns">
                Padrões Detectados ({patterns.length})
              </TabsTrigger>
              <TabsTrigger value="insights">
                Insights e Sugestões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patterns" className="space-y-4">
              {patterns.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    Nenhum padrão anômalo detectado
                  </p>
                  <p className="text-sm text-slate-500">
                    Seus logs estão dentro dos padrões normais
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(pattern.type)}
                          <h3 className="font-medium">{pattern.title}</h3>
                        </div>
                        <Badge className={`${getSeverityColor(pattern.severity)} text-white`}>
                          {pattern.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {pattern.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-3 h-3" />
                          <span>Confiança: {pattern.confidence}%</span>
                        </div>
                        <Progress value={pattern.confidence} className="h-1" />
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                        <span>Ocorrências: {pattern.count}</span>
                        <span>
                          {new Date(pattern.lastSeen).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Alertas Prioritários
                  </h3>
                  {patterns
                    .filter(p => p.severity === 'critical' || p.severity === 'high')
                    .map(pattern => (
                      <div key={pattern.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          {pattern.title}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          {pattern.suggestion}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Tendências Temporais
                  </h3>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      📊 Análise baseada em {logs.length} logs processados
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      🔍 {patterns.length} padrões identificados automaticamente
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Pattern Detail Modal */}
        {selectedPattern && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {getSeverityIcon(selectedPattern.type)}
                    {selectedPattern.title}
                  </h2>
                  <Badge className={`${getSeverityColor(selectedPattern.severity)} text-white mt-2`}>
                    {selectedPattern.severity.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPattern(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Descrição</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedPattern.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Sugestão de Ação</h3>
                  <p className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    {selectedPattern.suggestion}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Estatísticas</h3>
                    <div className="space-y-2 text-sm">
                      <div>Ocorrências: {selectedPattern.count}</div>
                      <div>Confiança: {selectedPattern.confidence}%</div>
                      <div>Primeira ocorrência: {selectedPattern.firstSeen.toLocaleString('pt-BR')}</div>
                      <div>Última ocorrência: {selectedPattern.lastSeen.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Exemplos</h3>
                    <div className="space-y-2">
                      {selectedPattern.examples.map((example, index) => (
                        <div key={index} className="text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded">
                          {example.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}