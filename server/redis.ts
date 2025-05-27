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
      
      // Buscar todas as chaves de evento
      const eventKeys = await redis.keys('event:*');
      
      if (eventKeys.length === 0) {
        return { logs: [], total: 0 };
      }

      // Buscar dados de todos os eventos
      const pipeline = redis.pipeline();
      eventKeys.forEach(key => {
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
          const eventData = result[1] as Record<string, string>;
          
          // Extrair ID do evento da chave (event:1 -> 1)
          const logId = parseInt(eventKeys[index].split(':')[1]);
          
          if (eventData.event_id && eventData.log_level && eventData.message && eventData.username && eventData.datetime) {
            const log: Log = {
              id: logId,
              connectionId: connection.id.toString(),
              eventId: eventData.event_id,
              logLevel: eventData.log_level,
              message: eventData.message,
              username: eventData.username,
              datetime: new Date(eventData.datetime),
              metadata: eventData.metadata ? JSON.parse(eventData.metadata) : null,
            };
            logs.push(log);
          }
        }
      });

      // Aplicar filtros
      let filteredLogs = logs;

      if (filters.logLevel) {
        filteredLogs = filteredLogs.filter(log => log.logLevel === filters.logLevel);
      }

      if (filters.username) {
        filteredLogs = filteredLogs.filter(log => log.username === filters.username);
      }

      if (filters.search) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter(log => log.datetime && log.datetime >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter(log => log.datetime && log.datetime <= endDate);
      }

      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => {
          if (!log.datetime) return false;
          const logTime = log.datetime.toTimeString().slice(0, 5); // HH:MM format
          return logTime >= filters.startTime;
        });
      }

      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => {
          if (!log.datetime) return false;
          const logTime = log.datetime.toTimeString().slice(0, 5); // HH:MM format
          return logTime <= filters.endTime;
        });
      }

      // Ordenar por datetime (mais recente primeiro)
      filteredLogs.sort((a, b) => {
        const timeA = a.datetime ? a.datetime.getTime() : 0;
        const timeB = b.datetime ? b.datetime.getTime() : 0;
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
      const eventKeys = await redis.keys('event:*');
      
      if (eventKeys.length === 0) {
        return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
      }

      const pipeline = redis.pipeline();
      eventKeys.forEach(key => {
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
          const eventData = result[1] as Record<string, string>;
          
          if (eventData.log_level && eventData.datetime) {
            totalLogs++;
            const logTime = new Date(eventData.datetime);
            
            if (logTime >= twentyFourHoursAgo) {
              if (eventData.log_level === 'ERROR') {
                errors24h++;
              } else if (eventData.log_level === 'WARN') {
                warnings24h++;
              } else if (eventData.log_level === 'INFO' || eventData.log_level === 'DEBUG') {
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