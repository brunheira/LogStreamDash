import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PatternRecognition } from "@/components/dashboard/pattern-recognition";
import { FilterPanel } from "@/components/dashboard/filter-panel";

export default function PatternAnalysisPage() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>();
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

  // Fetch logs for pattern analysis
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

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Análise Inteligente de Padrões
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Detecção automática de anomalias, padrões e tendências nos logs Redis
            </p>
          </div>
        </div>

        {/* Connection Selection */}
        {connections.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-medium mb-3">Selecionar Conexão para Análise</h3>
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

            {/* Pattern Recognition */}
            <PatternRecognition 
              logs={logsData?.logs || []}
              isLoading={logsLoading}
            />
          </>
        )}

        {!selectedConnectionId && connections.length > 0 && (
          <div className="text-center py-12">
            <div className="text-slate-500 dark:text-slate-400">
              Selecione uma conexão Redis para iniciar a análise de padrões
            </div>
          </div>
        )}
      </div>
    </main>
  );
}