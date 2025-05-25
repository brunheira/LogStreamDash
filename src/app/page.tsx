'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { NewConnectionForm } from "@/components/connections/new-connection-form";
import { ConnectionHealth } from "@/components/dashboard/connection-health";
import { PatternRecognition } from "@/components/dashboard/pattern-recognition";
import { LogTimeline } from "@/components/dashboard/log-timeline";
import { LogExport } from "@/components/dashboard/log-export";
import { LogTable } from "@/components/dashboard/log-table";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    redirect('/auth');
  }

  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>();
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string }>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({
    level: "all",
    service: "all",
    search: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/logs", selectedConnectionId, filters, page, pageSize],
    enabled: !!selectedConnectionId,
    staleTime: 1000 * 30,
    refetchInterval: isAutoRefresh ? refreshInterval * 1000 : false,
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/logs/stats", selectedConnectionId],
    enabled: !!selectedConnectionId,
    staleTime: 1000 * 60,
  });

  const handleNewConnection = () => {
    setShowNewConnectionModal(true);
  };

  const handleNewConnectionSuccess = () => {
    // Invalidate and refetch connections
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
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
    setPage(1);
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
        <Header 
          onNewConnection={handleNewConnection} 
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Visão geral completa do sistema de monitoramento Redis
                </p>
              </div>
            </div>

            {/* Connection Selection */}
            {connections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Conexão</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div id="stats">
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

            {/* Real-time Connection Health Indicators */}
            <div id="connection-health">
              <ConnectionHealth 
                connections={connections || []}
                selectedConnectionId={selectedConnectionId}
              />
            </div>

            {/* Advanced Log Pattern Recognition */}
            <div id="pattern-recognition">
              <PatternRecognition 
                logs={logsData?.logs || []}
                isLoading={logsLoading}
              />
            </div>

            {/* Interactive Log Timeline */}
            <div id="log-timeline">
              <LogTimeline
                logs={logsData?.logs || []}
                onTimeRangeSelect={handleTimeRangeSelect}
                selectedTimeRange={selectedTimeRange}
              />
            </div>

            {/* Export Controls */}
            <div id="export" className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Logs da Conexão</h2>
              <LogExport
                logs={logsData?.logs || []}
                filters={filters}
                totalLogs={logsData?.total || 0}
              />
            </div>

            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              isAutoRefresh={isAutoRefresh}
              onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
            />

            {/* Log Table */}
            <LogTable
              logs={logsData?.logs || []}
              total={logsData?.total || 0}
              page={page}
              pageSize={pageSize}
              isLoading={logsLoading}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onRefresh={refetchLogs}
            />
          </div>
        </main>
      </div>
      <NewConnectionForm
        open={showNewConnectionModal}
        onOpenChange={setShowNewConnectionModal}
        onSuccess={handleNewConnectionSuccess}
      />
    </div>
  );
}