import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, RotateCcw, Calendar } from "lucide-react";
import { formatTimestamp, getLogLevelColor, getLogLevelClass } from "@/lib/utils";
import type { Log } from "@shared/schema";

interface LogTimelineProps {
  logs: Log[];
  isLoading?: boolean;
}

export function LogTimeline({ logs, isLoading }: LogTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1000); // ms between animations
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Ordena logs por timestamp
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateA - dateB;
  });

  // Filtra logs por data se selecionada
  const filteredLogs = selectedDate 
    ? sortedLogs.filter(log => {
        if (!log.timestamp) return false;
        return new Date(log.timestamp).toISOString().split('T')[0] === selectedDate;
      })
    : sortedLogs;

  // Controla a animação automática
  useEffect(() => {
    if (isPlaying && currentIndex < filteredLogs.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentIndex >= filteredLogs.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentIndex, filteredLogs.length, speed]);

  const handlePlay = () => {
    if (currentIndex >= filteredLogs.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const getVisibleLogs = () => {
    return filteredLogs.slice(0, currentIndex + 1);
  };

  // Obter datas únicas dos logs para filtro
  const availableDates = Array.from(new Set(
    sortedLogs
      .filter(log => log.timestamp)
      .map(log => new Date(log.timestamp!).toISOString().split('T')[0])
  )).sort();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Controles da Timeline */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Timeline de Logs</h3>
              <Badge variant="outline">
                {currentIndex + 1} / {filteredLogs.length}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Filtro de Data */}
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentIndex(0);
                  setIsPlaying(false);
                }}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="">Todas as datas</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>

              {/* Controle de Velocidade */}
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={500}>2x</option>
                <option value={1000}>1x</option>
                <option value={2000}>0.5x</option>
                <option value={3000}>0.3x</option>
              </select>

              {/* Botões de Controle */}
              <Button
                onClick={handlePlay}
                size="sm"
                disabled={filteredLogs.length === 0}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={handleReset}
                size="sm"
                variant="outline"
                disabled={filteredLogs.length === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: filteredLogs.length > 0 
                  ? `${((currentIndex + 1) / filteredLogs.length) * 100}%` 
                  : "0%" 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Timeline dos Logs */}
          <div className="relative">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado para a data selecionada</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Linha da Timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
                
                <AnimatePresence>
                  {getVisibleLogs().map((log, index) => (
                    <motion.div
                      key={`${log.id}-${index}`}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index === currentIndex ? 0.2 : 0
                      }}
                      className="relative flex items-start space-x-4"
                    >
                      {/* Ponto da Timeline */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`relative z-10 flex-shrink-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          getLogLevelClass(log.level)
                        }`}
                        style={{ backgroundColor: getLogLevelColor(log.level) }}
                      />

                      {/* Conteúdo do Log */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="flex-1 min-w-0 pb-4"
                      >
                        <Card className={`transition-all duration-300 ${
                          index === currentIndex 
                            ? 'ring-2 ring-blue-500 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  className={getLogLevelClass(log.level)}
                                  style={{ backgroundColor: getLogLevelColor(log.level) }}
                                >
                                  {log.level}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {log.service}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {log.timestamp ? formatTimestamp(log.timestamp) : 'Sem data'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                              {log.message}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>ID: {log.eventId}</span>
                              <span>Usuário: {log.username}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Informações da Timeline */}
          {filteredLogs.length > 0 && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total de Logs:</span>
                  <span className="ml-2 font-semibold">{filteredLogs.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Exibidos:</span>
                  <span className="ml-2 font-semibold">{currentIndex + 1}</span>
                </div>
                <div>
                  <span className="text-gray-500">Primeiro:</span>
                  <span className="ml-2 font-semibold">
                    {filteredLogs[0]?.timestamp ? formatTimestamp(filteredLogs[0].timestamp!) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Último:</span>
                  <span className="ml-2 font-semibold">
                    {filteredLogs[filteredLogs.length - 1]?.timestamp ? formatTimestamp(filteredLogs[filteredLogs.length - 1].timestamp!) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}