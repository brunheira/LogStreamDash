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

      // Seleciona o banco 3 se necessário
      await redis.select(3);

      const exists = await redis.exists("LOGS");
      if (!exists) {
        return { logs: [], total: 0 };
      }

      // Lê todos os itens da lista "LOGS"
      const entries = await redis.lrange("LOGS", 0, -1);

      const logs: Log[] = [];

      entries.forEach((entry, index) => {
        try {
          const json = JSON.parse(entry);
          if (json.event_id && json.log_level && json.message && json.username && json.datetime) {
            const log: Log = {
              id: index,
              connectionId: connection.id.toString(),
              eventId: json.event_id,
              level: json.log_level.toUpperCase(),
              service: json.service || "sistema",
              message: json.message,
              username: json.username,
              timestamp: new Date(json.datetime),
              metadata: { originalJson: json }
            };
            logs.push(log);
          }
        } catch (err) {
          console.error(`Erro ao parsear log[${index}]:`, err);
        }
      });

      // Filtros
      let filtered = logs;

      if (filters.level && filters.level !== "all") {
        filtered = filtered.filter(log => log.level.toLowerCase() === filters.level.toLowerCase());
      }

      if (filters.service && filters.service !== "all") {
        filtered = filtered.filter(log => log.service === filters.service);
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(log =>
          log.message.toLowerCase().includes(query) ||
          log.username.toLowerCase().includes(query) ||
          log.eventId.toLowerCase().includes(query)
        );
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        filtered = filtered.filter(log => log.timestamp >= start);
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        filtered = filtered.filter(log => log.timestamp <= end);
      }

      // Ordenação decrescente por data
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Paginação
      const page = Math.max(1, parseInt(filters.page) || 1);
      const pageSize = Math.max(1, parseInt(filters.pageSize) || 10);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return {
        logs: filtered.slice(startIndex, endIndex),
        total: filtered.length
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

      // Seleciona o banco 3
      await redis.select(3);

      const exists = await redis.exists("LOGS");
      if (!exists) {
        return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
      }

      // Lê todos os itens da lista "LOGS"
      const entries = await redis.lrange("LOGS", 0, -1);

      if (entries.length === 0) {
        return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
      }

      let totalLogs = 0;
      let errors24h = 0;
      let warnings24h = 0;
      let successLogs = 0;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      entries.forEach((entry) => {
        try {
          const json = JSON.parse(entry);
          
          if (json.event_id && json.log_level && json.message && json.username && json.datetime) {
            totalLogs++;
            const logTime = new Date(json.datetime);
            const level = json.log_level.toLowerCase();
            
            // Debug: log para ver os dados
            console.log(`Log processado: level=${level}, time=${json.datetime}, isRecent=${logTime >= twentyFourHoursAgo}`);
            
            if (logTime >= twentyFourHoursAgo) {
              if (level === 'error') {
                errors24h++;
                console.log(`Erro encontrado! Total errors24h: ${errors24h}`);
              } else if (level === 'warning') {
                warnings24h++;
                console.log(`Warning encontrado! Total warnings24h: ${warnings24h}`);
              } else if (level === 'info' || level === 'debug') {
                successLogs++;
              }
            }
          }
        } catch (parseError) {
          console.error(`Erro ao processar estatísticas do log:`, parseError);
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
      console.error("Erro ao buscar estatísticas do Redis:", error);
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