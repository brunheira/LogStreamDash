import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, Database, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { LogTable } from "@/components/dashboard/log-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [filters, setFilters] = useState({
    level: "",
    service: "",
    search: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Fetch log stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/logs/stats"],
  });

  // Fetch logs with filters
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: [
      "/api/logs",
      {
        ...filters,
        page,
        limit: pageSize,
      },
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (filters.level) searchParams.set("level", filters.level);
      if (filters.service) searchParams.set("service", filters.service);
      if (filters.search) searchParams.set("search", filters.search);
      if (filters.startDate) searchParams.set("startDate", filters.startDate);
      if (filters.endDate) searchParams.set("endDate", filters.endDate);
      searchParams.set("page", page.toString());
      searchParams.set("limit", pageSize.toString());

      const response = await fetch(`/api/logs?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
  });

  // Get selected connection
  const selectedConnection = connections.find((conn: any) => conn.id.toString() === selectedConnectionId) || connections[0];
  
  // Auto-select first connection if none selected
  if (!selectedConnectionId && connections.length > 0) {
    setSelectedConnectionId(connections[0].id.toString());
  }

  const handleFiltersChange = (newFilters: typeof filters) => {
    // Convert "all" values back to empty strings for API
    const apiFilters = {
      ...newFilters,
      level: newFilters.level === "all" ? "" : newFilters.level,
      service: newFilters.service === "all" ? "" : newFilters.service,
    };
    setFilters(apiFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      level: "",
      service: "",
      search: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/logs/stats"] });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Dashboard de Logs
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Monitore e analise logs em tempo real das suas instâncias Redis
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {selectedConnection && (
              <>
                <Badge className={selectedConnection.status === 'connected' 
                  ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                }>
                  <Circle className="w-2 h-2 mr-2 fill-current" />
                  {selectedConnection.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedConnection.name}
                </span>
              </>
            )}
            {!selectedConnection && connections.length === 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma conexão configurada
              </span>
            )}
          </div>
        </div>

        {/* Connection Selector */}
        {connections.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Database className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <Select 
                    value={selectedConnectionId} 
                    onValueChange={(value) => {
                      setSelectedConnectionId(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selecione uma conexão Redis" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn: any) => (
                        <SelectItem key={conn.id} value={conn.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Circle 
                              className={`h-2 w-2 fill-current ${
                                conn.status === 'connected' ? 'text-green-500' : 
                                conn.status === 'connecting' ? 'text-yellow-500' : 'text-red-500'
                              }`} 
                            />
                            {conn.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedConnection && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedConnection.host}:{selectedConnection.port} (DB: {selectedConnection.database})
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <StatsCards
          stats={{
            totalLogs: stats?.totalLogs ?? 0,
            errors24h: stats?.errors24h ?? 0,
            warnings24h: stats?.warnings24h ?? 0,
            successRate: stats?.successRate ?? 100
          }}
          isLoading={statsLoading}
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Log Table */}
      <LogTable
        logs={logsData?.logs || []}
        total={logsData?.total || 0}
        page={page}
        pageSize={pageSize}
        isLoading={logsLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={handleRefresh}
      />
    </main>
  );
}
