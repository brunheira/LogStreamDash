import Redis from 'ioredis';
import { RedisConnection, Log } from "@shared/schema";

export class RedisService {
  private connections: Map<string, Redis> = new Map();

  async connectToRedis(connection: RedisConnection): Promise<Redis> {
    const key = `${connection.host}:${connection.port}:${connection.database}`;
    
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    const redis = new Redis({
      host: connection.host,
      port: parseInt(connection.port),
      db: parseInt(connection.database),
      password: connection.password || undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      this.connections.set(key, redis);
      return redis;
    } catch (error) {
      console.error(`Failed to connect to Redis ${key}:`, error);
      throw error;
    }
  }

  async getLogsFromRedis(connection: RedisConnection, filters: any = {}): Promise<{ logs: Log[]; total: number }> {
    try {
      const redis = await this.connectToRedis(connection);
      
      // Buscar todas as chaves de log
      const logKeys = await redis.keys('log:*');
      
      if (logKeys.length === 0) {
        return { logs: [], total: 0 };
      }

      // Buscar dados de todos os logs
      const pipeline = redis.pipeline();
      logKeys.forEach(key => {
        pipeline.hgetall(key);
      });
      
      const results = await pipeline.exec();
      
      if (!results) {
        return { logs: [], total: 0 };
      }

      // Converter dados do Redis para formato de Log
      const logs: Log[] = [];
      
      results.forEach((result, index) => {
        if (result && result[1] && typeof result[1] === 'object') {
          const logData = result[1] as Record<string, string>;
          
          // Extrair ID do log da chave (log:1 -> 1)
          const logId = parseInt(logKeys[index].split(':')[1]);
          
          if (logData.connectionId && logData.level && logData.service && logData.message) {
            const log: Log = {
              id: logId,
              connectionId: logData.connectionId,
              level: logData.level,
              service: logData.service,
              message: logData.message,
              timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date(),
              metadata: logData.metadata ? JSON.parse(logData.metadata) : null,
            };
            logs.push(log);
          }
        }
      });

      // Aplicar filtros
      let filteredLogs = logs;

      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }

      if (filters.service) {
        filteredLogs = filteredLogs.filter(log => log.service === filters.service);
      }

      if (filters.search) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter(log => log.timestamp && log.timestamp >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter(log => log.timestamp && log.timestamp <= endDate);
      }

      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });

      // Aplicar paginação
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        logs: paginatedLogs,
        total: filteredLogs.length
      };

    } catch (error) {
      console.error('Error fetching logs from Redis:', error);
      throw error;
    }
  }

  async getLogStatsFromRedis(connection: RedisConnection): Promise<{
    totalLogs: number;
    errors24h: number;
    warnings24h: number;
    successRate: number;
  }> {
    try {
      const redis = await this.connectToRedis(connection);
      const logKeys = await redis.keys('log:*');
      
      if (logKeys.length === 0) {
        return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
      }

      const pipeline = redis.pipeline();
      logKeys.forEach(key => {
        pipeline.hgetall(key);
      });
      
      const results = await pipeline.exec();
      
      if (!results) {
        return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
      }

      let totalLogs = 0;
      let errors24h = 0;
      let warnings24h = 0;
      let successLogs = 0;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      results.forEach((result) => {
        if (result && result[1] && typeof result[1] === 'object') {
          const logData = result[1] as Record<string, string>;
          
          if (logData.level && logData.timestamp) {
            totalLogs++;
            const logTime = new Date(logData.timestamp);
            
            if (logTime >= twentyFourHoursAgo) {
              if (logData.level === 'error') {
                errors24h++;
              } else if (logData.level === 'warning') {
                warnings24h++;
              } else if (logData.level === 'info' || logData.level === 'debug') {
                successLogs++;
              }
            }
          }
        }
      });

      const logsLast24h = errors24h + warnings24h + successLogs;
      const successRate = logsLast24h > 0 ? Math.round((successLogs / logsLast24h) * 100) : 100;

      return {
        totalLogs,
        errors24h,
        warnings24h,
        successRate
      };

    } catch (error) {
      console.error('Error fetching stats from Redis:', error);
      return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
    }
  }

  async testConnection(connection: RedisConnection): Promise<{ success: boolean; message: string }> {
    try {
      const redis = await this.connectToRedis(connection);
      const result = await redis.ping();
      
      if (result === 'PONG') {
        return { success: true, message: 'Conexão bem-sucedida' };
      } else {
        return { success: false, message: 'Resposta inesperada do Redis' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async disconnect(connection: RedisConnection): Promise<void> {
    const key = `${connection.host}:${connection.port}:${connection.database}`;
    const redis = this.connections.get(key);
    
    if (redis) {
      await redis.disconnect();
      this.connections.delete(key);
    }
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(redis => redis.disconnect());
    await Promise.all(promises);
    this.connections.clear();
  }
}

export const redisService = new RedisService();