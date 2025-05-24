import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { LogTable } from "@/components/dashboard/log-table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    level: "",
    service: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Fetch current connection (mock for now)
  const currentConnection = {
    name: "Redis-Prod-01",
    status: "connected",
  };

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
            <Badge className="bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">
              <Circle className="w-2 h-2 mr-2 fill-current" />
              Conectado
            </Badge>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {currentConnection.name}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          stats={{
            totalLogs: stats?.totalLogs ?? 0,
            errors24h: stats?.errors24h ?? 0,
            warnings24h: stats?.warnings24h ?? 0,
            successRate: stats?.successRate ?? 0
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
