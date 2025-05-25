import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogTimeline } from "@/components/dashboard/log-timeline";
import { FilterPanel } from "@/components/dashboard/filter-panel";

export default function LogTimelinePage() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>();
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string }>();
  const [filters, setFilters] = useState({
    level: "all",
    service: "all",
    search: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch logs for timeline
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/logs", selectedConnectionId, filters],
    enabled: !!selectedConnectionId,
    staleTime: 1000 * 30,
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      level: "all",
      service: "all",
      search: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleTimeRangeSelect = (startTime: string, endTime: string) => {
    setSelectedTimeRange({ start: startTime, end: endTime });
    setFilters(prev => ({
      ...prev,
      startTime,
      endTime,
    }));
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Timeline de Logs
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Visualização temporal interativa dos logs Redis com análise de tendências
            </p>
          </div>
        </div>

        {/* Connection Selection */}
        {connections.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-medium mb-3">Selecionar Conexão para Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {connections.map((connection: any) => (
                <button
                  key={connection.id}
                  onClick={() => setSelectedConnectionId(connection.id.toString())}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedConnectionId === connection.id.toString()
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="font-medium">{connection.name}</div>
                  <div className="text-sm text-slate-500">
                    {connection.host}:{connection.port}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedConnectionId && (
          <>
            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              refreshInterval={0}
              onRefreshIntervalChange={() => {}}
              isAutoRefresh={false}
              onToggleAutoRefresh={() => {}}
            />

            {/* Interactive Timeline */}
            <LogTimeline
              logs={logsData?.logs || []}
              onTimeRangeSelect={handleTimeRangeSelect}
              selectedTimeRange={selectedTimeRange}
            />

            {/* Timeline Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Como usar a Timeline
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Clique e arraste na timeline para selecionar um período específico</li>
                <li>• Use os botões de zoom para alternar entre visualizações (minuto, hora, dia)</li>
                <li>• Hover sobre os pontos para ver detalhes dos logs</li>
                <li>• As cores representam diferentes níveis: vermelho (erro), amarelo (aviso), azul (info)</li>
              </ul>
            </div>
          </>
        )}

        {!selectedConnectionId && connections.length > 0 && (
          <div className="text-center py-12">
            <div className="text-slate-500 dark:text-slate-400">
              Selecione uma conexão Redis para visualizar a timeline de logs
            </div>
          </div>
        )}
      </div>
    </main>
  );
}