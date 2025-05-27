import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, getLogLevelColor, getLogLevelClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Log } from "@shared/schema";

interface LogTableProps {
  logs: Log[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

export function LogTable({
  logs,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: LogTableProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Logs Recentes</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando {startItem}-{endItem} de {total.toLocaleString()} resultados
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="min-w-full">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">Nenhum log encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "px-6 py-4 border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                  getLogLevelClass(log.level)
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <Badge className={getLogLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {log.service}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {log.timestamp ? formatTimestamp(log.timestamp) : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {log.message}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="flex items-center space-x-4 mt-2">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="text-xs text-slate-500 dark:text-slate-400">
                              {key}: <span className="font-mono">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {expandedLogs.has(log.id) && log.metadata && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleLogExpansion(log.id)}
                    className="flex-shrink-0"
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedLogs.has(log.id) ? "rotate-180" : ""
                      )}
                    />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Itens por página:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(pageNum)}
                    className={page === pageNum ? "bg-primary text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
