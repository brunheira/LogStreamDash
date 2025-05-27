import { users, redisConnections, logs, type User, type InsertUser, type RedisConnection, type InsertRedisConnection, type UpdateRedisConnection, type Log, type InsertLog, type LogFilter } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, desc, sql } from "drizzle-orm";
import { redisService } from "./redis";

export interface IStorage {
  // User methods
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Redis Connection methods
  getRedisConnections(): Promise<RedisConnection[]>;
  getRedisConnection(id: number): Promise<RedisConnection | undefined>;
  createRedisConnection(connection: InsertRedisConnection): Promise<RedisConnection>;
  updateRedisConnection(id: number, connection: UpdateRedisConnection): Promise<RedisConnection | undefined>;
  deleteRedisConnection(id: number): Promise<boolean>;
  
  // Log methods
  getLogs(filters: LogFilter): Promise<{ logs: Log[]; total: number }>;
  getLog(id: number): Promise<Log | undefined>;
  createLog(log: InsertLog): Promise<Log>;
  getLogStats(): Promise<{
    totalLogs: number;
    errors24h: number;
    warnings24h: number;
    successRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getRedisConnections(): Promise<RedisConnection[]> {
    const connections = await db.select().from(redisConnections).orderBy(desc(redisConnections.createdAt));
    return connections;
  }

  async getRedisConnection(id: number): Promise<RedisConnection | undefined> {
    const [connection] = await db.select().from(redisConnections).where(eq(redisConnections.id, id));
    return connection || undefined;
  }

  async createRedisConnection(connection: InsertRedisConnection): Promise<RedisConnection> {
    const connectionData = {
      name: connection.name,
      host: connection.host,
      port: connection.port || "6379",
      password: connection.password || null,
      database: connection.database || "0",
    };
    
    const [newConnection] = await db
      .insert(redisConnections)
      .values(connectionData)
      .returning();
    return newConnection;
  }

  async updateRedisConnection(id: number, connection: UpdateRedisConnection): Promise<RedisConnection | undefined> {
    const [updatedConnection] = await db
      .update(redisConnections)
      .set(connection)
      .where(eq(redisConnections.id, id))
      .returning();
    return updatedConnection || undefined;
  }

  async deleteRedisConnection(id: number): Promise<boolean> {
    const result = await db.delete(redisConnections).where(eq(redisConnections.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getLogs(filters: LogFilter): Promise<{ logs: Log[]; total: number }> {
    // Buscar logs da primeira conexão Redis disponível
    const connections = await this.getRedisConnections();
    
    if (connections.length === 0) {
      return { logs: [], total: 0 };
    }
    
    try {
      // Usar a primeira conexão disponível para buscar logs
      const connection = connections[0];
      const result = await redisService.getLogsFromRedis(connection, {
        ...filters,
        page: filters.page || 1,
        pageSize: filters.limit || 10
      });
      return result;
    } catch (error) {
      console.error('Erro ao buscar logs do Redis:', error);
      return { logs: [], total: 0 };
    }
  }

  async getLog(id: number): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log || undefined;
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db
      .insert(logs)
      .values({
        ...log,
        metadata: log.metadata || null,
        datetime: new Date(),
      })
      .returning();
    return newLog;
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    errors24h: number;
    warnings24h: number;
    successRate: number;
  }> {
    // Buscar estatísticas da primeira conexão Redis disponível
    const connections = await this.getRedisConnections();
    
    if (connections.length === 0) {
      return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
    }
    
    try {
      // Usar a primeira conexão disponível para buscar estatísticas
      const connection = connections[0];
      const stats = await redisService.getLogStatsFromRedis(connection);
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do Redis:', error);
      return { totalLogs: 0, errors24h: 0, warnings24h: 0, successRate: 100 };
    }
  }
}

export const storage = new DatabaseStorage();