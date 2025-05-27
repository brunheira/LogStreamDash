import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, Database, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { LogTable } from "@/components/dashboard/log-table";
import { LogTimeline } from "@/components/dashboard/log-timeline";
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
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Calculate stats from filtered logs
  const calculateStats = (logs: any[]) => {
    if (!logs || logs.length === 0) {
      return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp);
      return logDate >= twentyFourHoursAgo;
    });

    const errors24h = recentLogs.filter(log => log.level?.toLowerCase() === 'error').length;
    const warnings24h = recentLogs.filter(log => log.level?.toLowerCase() === 'warning').length;
    const totalRecent = recentLogs.length;
    const successRate = totalRecent > 0 ? Math.round(((totalRecent - errors24h) / totalRecent) * 100) : 100;

    return {
      totalLogs: logs.length,
      errors24h,
      warnings24h,
      successRate
    };
  };



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
          stats={calculateStats(logsData?.logs || [])}
          isLoading={logsLoading}
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Timeline Visualizer */}
      <div className="mb-8">
        <LogTimeline 
          logs={logsData?.logs || []}
          isLoading={logsLoading}
        />
      </div>

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
