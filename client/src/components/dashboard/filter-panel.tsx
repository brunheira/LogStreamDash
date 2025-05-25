import { useState, useEffect } from "react";
import { Calendar, Search, Clock, RotateCcw, Play, Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-mock-data";

interface FilterPanelProps {
  filters: {
    level: string;
    service: string;
    search: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  refreshInterval,
  onRefreshIntervalChange,
  isAutoRefresh,
  onToggleAutoRefresh
}: FilterPanelProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Update parent when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  const services = [
    "auth-service",
    "api-gateway",
    "user-service",
    "payment-service",
  ];

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filtros</h3>
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="text-primary hover:text-blue-700"
          >
            Limpar Filtros
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2 col-span-2">
            <Label>Intervalo de Datas</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                placeholder="Data inicial"
              />
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                placeholder="Data final"
              />
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Intervalo de Horas
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                value={filters.startTime || ""}
                onChange={(e) => onFiltersChange({ ...filters, startTime: e.target.value })}
                placeholder="Hora inicial"
              />
              <Input
                type="time"
                value={filters.endTime || ""}
                onChange={(e) => onFiltersChange({ ...filters, endTime: e.target.value })}
                placeholder="Hora final"
              />
            </div>
          </div>

          {/* Log Level Filter */}
          <div className="space-y-2">
            <Label>Nível de Log</Label>
            <Select
              value={filters.level}
              onValueChange={(value) => onFiltersChange({ ...filters, level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Filter */}
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select
              value={filters.service}
              onValueChange={(value) => onFiltersChange({ ...filters, service: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Input
                placeholder="Buscar em mensagens..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Auto Refresh Controls */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Atualização Automática
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isAutoRefresh}
                  onCheckedChange={onToggleAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh" className="text-sm">
                  {isAutoRefresh ? "Ativa" : "Inativa"}
                </Label>
                {isAutoRefresh && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs">Atualizando</span>
                  </div>
                )}
              </div>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => onRefreshIntervalChange(Number(value))}
                disabled={!isAutoRefresh}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Intervalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5 segundos</SelectItem>
                  <SelectItem value="10000">10 segundos</SelectItem>
                  <SelectItem value="30000">30 segundos</SelectItem>
                  <SelectItem value="60000">1 minuto</SelectItem>
                  <SelectItem value="300000">5 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
