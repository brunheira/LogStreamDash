import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, AlertTriangle, Info, Bug } from "lucide-react";
// Use any type for logs to avoid import issues for now
type Log = any;

interface LogTimelineProps {
  logs: Log[];
  onTimeRangeSelect: (startTime: string, endTime: string) => void;
  selectedTimeRange?: { start: string; end: string };
}

interface TimelineData {
  time: string;
  timestamp: number;
  total: number;
  error: number;
  warning: number;
  info: number;
  debug: number;
}

export function LogTimeline({ logs, onTimeRangeSelect, selectedTimeRange }: LogTimelineProps) {
  const [selectedInterval, setSelectedInterval] = useState<'hour' | 'minute' | 'day'>('hour');

  const timelineData = useMemo(() => {
    if (!logs.length) return [];

    // Group logs by time intervals
    const groupedData = new Map<string, TimelineData>();

    logs.forEach(log => {
      if (!log.timestamp) return;

      const date = new Date(log.timestamp);
      let timeKey: string;
      
      switch (selectedInterval) {
        case 'minute':
          timeKey = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          break;
        case 'hour':
          timeKey = `${date.getHours().toString().padStart(2, '0')}:00`;
          break;
        case 'day':
          timeKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          break;
        default:
          timeKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      }

      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, {
          time: timeKey,
          timestamp: date.getTime(),
          total: 0,
          error: 0,
          warning: 0,
          info: 0,
          debug: 0,
        });
      }

      const data = groupedData.get(timeKey)!;
      data.total++;
      
      switch (log.level) {
        case 'error':
          data.error++;
          break;
        case 'warning':
          data.warning++;
          break;
        case 'info':
          data.info++;
          break;
        case 'debug':
          data.debug++;
          break;
      }
    });

    return Array.from(groupedData.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, selectedInterval]);

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter(log => log.level === 'error').length;
    const warnings = logs.filter(log => log.level === 'warning').length;
    const infos = logs.filter(log => log.level === 'info').length;
    const debugs = logs.filter(log => log.level === 'debug').length;

    return { total, errors, warnings, infos, debugs };
  }, [logs]);

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startData = timelineData[brushData.startIndex];
      const endData = timelineData[brushData.endIndex];
      
      if (startData && endData) {
        const startTime = new Date(startData.timestamp).toTimeString().slice(0, 5);
        const endTime = new Date(endData.timestamp).toTimeString().slice(0, 5);
        onTimeRangeSelect(startTime, endTime);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`Horário: ${label}`}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">Errors: {data.error}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm">Warnings: {data.warning}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Info: {data.info}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-sm">Debug: {data.debug}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t">
              <span className="text-sm font-medium">Total: {data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Timeline de Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedInterval === 'minute' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedInterval('minute')}
            >
              Minutos
            </Button>
            <Button
              variant={selectedInterval === 'hour' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedInterval('hour')}
            >
              Horas
            </Button>
            <Button
              variant={selectedInterval === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedInterval('day')}
            >
              Dias
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Clock className="w-4 h-4 text-slate-600" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
              <p className="text-lg font-semibold text-red-700 dark:text-red-300">{stats.errors}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</p>
              <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{stats.warnings}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">{stats.infos}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Bug className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Debug</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{stats.debugs}</p>
            </div>
          </div>
        </div>

        {/* Selected Time Range */}
        {selectedTimeRange && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Período selecionado: {selectedTimeRange.start} - {selectedTimeRange.end}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTimeRangeSelect('', '')}
                className="ml-auto text-blue-600 hover:text-blue-700"
              >
                Limpar seleção
              </Button>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        <div className="h-80">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="error" stackId="logs" fill="#ef4444" name="Errors" />
                <Bar dataKey="warning" stackId="logs" fill="#f59e0b" name="Warnings" />
                <Bar dataKey="info" stackId="logs" fill="#3b82f6" name="Info" />
                <Bar dataKey="debug" stackId="logs" fill="#6b7280" name="Debug" />
                <Brush 
                  dataKey="time" 
                  height={30} 
                  stroke="#3b82f6"
                  onChange={handleBrushChange}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum log encontrado para visualização</p>
                <p className="text-sm">Ajuste os filtros para ver dados no timeline</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm">Errors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm">Warnings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm">Info</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-sm">Debug</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 <strong>Dica:</strong> Use a barra de seleção na parte inferior do gráfico para filtrar logs por período específico
          </p>
        </div>
      </CardContent>
    </Card>
  );
}