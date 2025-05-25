import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Database, 
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Log = any;

interface LogExportProps {
  logs: Log[];
  filters: {
    level: string;
    service: string;
    search: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  };
  totalLogs: number;
}

export function LogExport({ logs, filters, totalLogs }: LogExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatLogForExport = (log: Log) => ({
    id: log.id,
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : '',
    level: log.level,
    service: log.service,
    message: log.message,
    connectionId: log.connectionId,
    metadata: log.metadata ? JSON.stringify(log.metadata) : ''
  });

  const generateFileName = (format: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    let filterInfo = '';
    if (filters.level && filters.level !== 'all') filterInfo += `_${filters.level}`;
    if (filters.service && filters.service !== 'all') filterInfo += `_${filters.service}`;
    if (filters.startDate) filterInfo += `_from-${filters.startDate}`;
    if (filters.endDate) filterInfo += `_to-${filters.endDate}`;
    
    return `redis-logs_${dateStr}_${timeStr}${filterInfo}.${format}`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const formattedLogs = logs.map(formatLogForExport);
      
      // Create CSV headers
      const headers = ['ID', 'Timestamp', 'Level', 'Service', 'Message', 'Connection ID', 'Metadata'];
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...formattedLogs.map(log => [
          log.id,
          `"${log.timestamp}"`,
          log.level,
          log.service,
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes in message
          log.connectionId,
          `"${log.metadata.replace(/"/g, '""')}"` // Escape quotes in metadata
        ].join(','))
      ].join('\n');

      const filename = generateFileName('csv');
      downloadFile(csvContent, filename, 'text/csv');
      
      toast({
        title: "Exportação concluída!",
        description: `${logs.length} logs exportados para CSV`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Falha ao exportar logs para CSV",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const formattedLogs = logs.map(formatLogForExport);
      
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          totalLogs: logs.length,
          appliedFilters: {
            level: filters.level || 'all',
            service: filters.service || 'all',
            search: filters.search || '',
            dateRange: {
              start: filters.startDate || null,
              end: filters.endDate || null
            },
            timeRange: {
              start: filters.startTime || null,
              end: filters.endTime || null
            }
          }
        },
        logs: formattedLogs
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const filename = generateFileName('json');
      downloadFile(jsonContent, filename, 'application/json');
      
      toast({
        title: "Exportação concluída!",
        description: `${logs.length} logs exportados para JSON`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Falha ao exportar logs para JSON",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportFilteredLogs = async () => {
    setIsExporting(true);
    try {
      // Create a comprehensive export with filter information
      const exportData = {
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'Redis Log Management System',
          totalLogsInSystem: totalLogs,
          exportedLogsCount: logs.length,
          filtersApplied: {
            logLevel: filters.level || 'all levels',
            service: filters.service || 'all services',
            searchTerm: filters.search || 'no search filter',
            dateFilter: {
              startDate: filters.startDate || 'no start date',
              endDate: filters.endDate || 'no end date',
              timeRange: {
                startTime: filters.startTime || 'no start time',
                endTime: filters.endTime || 'no end time'
              }
            }
          }
        },
        logs: logs.map(formatLogForExport)
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const filename = generateFileName('filtered.json');
      downloadFile(jsonContent, filename, 'application/json');
      
      toast({
        title: "Exportação filtrada concluída!",
        description: `${logs.length} logs filtrados exportados com metadados`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Falha ao exportar logs filtrados",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.level && filters.level !== 'all') count++;
    if (filters.service && filters.service !== 'all') count++;
    if (filters.search) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.startTime) count++;
    if (filters.endTime) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={logs.length === 0 || isExporting}
          className="relative"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exportando..." : "Exportar Logs"}
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Exportar {logs.length} logs
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileText className="w-4 h-4 mr-2" />
          <div className="flex-1">
            <div className="font-medium">Formato CSV</div>
            <div className="text-xs text-slate-500">Para Excel e análise de dados</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToJSON} disabled={isExporting}>
          <Database className="w-4 h-4 mr-2" />
          <div className="flex-1">
            <div className="font-medium">Formato JSON</div>
            <div className="text-xs text-slate-500">Para APIs e integração</div>
          </div>
        </DropdownMenuItem>
        
        {activeFiltersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportFilteredLogs} disabled={isExporting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              <div className="flex-1">
                <div className="font-medium">JSON com Filtros</div>
                <div className="text-xs text-slate-500">Inclui metadados dos filtros aplicados</div>
              </div>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-slate-500">
          {activeFiltersCount > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                {activeFiltersCount} filtro(s) ativo(s)
              </div>
              {filters.level && filters.level !== 'all' && (
                <div>• Nível: {filters.level}</div>
              )}
              {filters.service && filters.service !== 'all' && (
                <div>• Serviço: {filters.service}</div>
              )}
              {filters.search && (
                <div>• Busca: "{filters.search}"</div>
              )}
              {(filters.startDate || filters.endDate) && (
                <div>• Período: {filters.startDate || '...'} - {filters.endDate || '...'}</div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Todos os logs serão exportados
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}