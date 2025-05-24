import { redisConnections, logs, type RedisConnection, type InsertRedisConnection, type UpdateRedisConnection, type Log, type InsertLog, type LogFilter } from "@shared/schema";

export interface IStorage {
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

export class MemStorage implements IStorage {
  private connections: Map<number, RedisConnection>;
  private logEntries: Map<number, Log>;
  private currentConnectionId: number;
  private currentLogId: number;

  constructor() {
    this.connections = new Map();
    this.logEntries = new Map();
    this.currentConnectionId = 1;
    this.currentLogId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo connections
    const demoConnections: RedisConnection[] = [
      {
        id: 1,
        name: "Redis-Prod-01",
        host: "redis-prod-01.company.com",
        port: "6379",
        password: null,
        database: "0",
        status: "connected",
        lastConnected: new Date(),
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Redis-Dev-01",
        host: "localhost",
        port: "6379",
        password: null,
        database: "0",
        status: "connecting",
        lastConnected: new Date(Date.now() - 30000),
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Redis-Staging-01",
        host: "staging.redis.company.com",
        port: "6379",
        password: null,
        database: "0",
        status: "error",
        lastConnected: new Date(Date.now() - 300000),
        createdAt: new Date(),
      },
    ];

    demoConnections.forEach(conn => {
      this.connections.set(conn.id, conn);
      this.currentConnectionId = Math.max(this.currentConnectionId, conn.id + 1);
    });

    // Demo logs
    const demoLogs: Log[] = [
      {
        id: 1,
        connectionId: "1",
        level: "error",
        service: "auth-service",
        message: "Failed to authenticate user: invalid credentials provided for user ID 12345",
        timestamp: new Date(Date.now() - 60000),
        metadata: { requestId: "req_abc123def456", ip: "192.168.1.100" },
      },
      {
        id: 2,
        connectionId: "1",
        level: "warning",
        service: "api-gateway",
        message: "High response time detected: endpoint /api/users took 3.2s to respond",
        timestamp: new Date(Date.now() - 120000),
        metadata: { responseTime: "3.2s", endpoint: "/api/users" },
      },
      {
        id: 3,
        connectionId: "1",
        level: "info",
        service: "user-service",
        message: "User successfully created: new user registration completed",
        timestamp: new Date(Date.now() - 180000),
        metadata: { userId: "user_987654321", email: "user@example.com" },
      },
      {
        id: 4,
        connectionId: "1",
        level: "debug",
        service: "payment-service",
        message: "Database query executed: SELECT * FROM transactions WHERE user_id = ? LIMIT 10",
        timestamp: new Date(Date.now() - 240000),
        metadata: { queryTime: "45ms", rowCount: "7" },
      },
      {
        id: 5,
        connectionId: "1",
        level: "info",
        service: "api-gateway",
        message: "Health check passed: all services responding normally",
        timestamp: new Date(Date.now() - 300000),
        metadata: { serviceCount: "4/4", avgResponse: "120ms" },
      },
    ];

    demoLogs.forEach(log => {
      this.logEntries.set(log.id, log);
      this.currentLogId = Math.max(this.currentLogId, log.id + 1);
    });
  }

  async getRedisConnections(): Promise<RedisConnection[]> {
    return Array.from(this.connections.values());
  }

  async getRedisConnection(id: number): Promise<RedisConnection | undefined> {
    return this.connections.get(id);
  }

  async createRedisConnection(connection: InsertRedisConnection): Promise<RedisConnection> {
    const id = this.currentConnectionId++;
    const newConnection: RedisConnection = {
      ...connection,
      id,
      status: "disconnected",
      lastConnected: null,
      createdAt: new Date(),
    };
    this.connections.set(id, newConnection);
    return newConnection;
  }

  async updateRedisConnection(id: number, connection: UpdateRedisConnection): Promise<RedisConnection | undefined> {
    const existing = this.connections.get(id);
    if (!existing) return undefined;

    const updated: RedisConnection = {
      ...existing,
      ...connection,
    };
    this.connections.set(id, updated);
    return updated;
  }

  async deleteRedisConnection(id: number): Promise<boolean> {
    return this.connections.delete(id);
  }

  async getLogs(filters: LogFilter): Promise<{ logs: Log[]; total: number }> {
    let allLogs = Array.from(this.logEntries.values());

    // Apply filters
    if (filters.level) {
      allLogs = allLogs.filter(log => log.level === filters.level);
    }
    
    if (filters.service) {
      allLogs = allLogs.filter(log => log.service === filters.service);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allLogs = allLogs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.service.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      allLogs = allLogs.filter(log => log.timestamp && log.timestamp >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      allLogs = allLogs.filter(log => log.timestamp && log.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const total = allLogs.length;
    
    // Apply pagination
    const offset = (filters.page - 1) * filters.limit;
    const paginatedLogs = allLogs.slice(offset, offset + filters.limit);

    return { logs: paginatedLogs, total };
  }

  async getLog(id: number): Promise<Log | undefined> {
    return this.logEntries.get(id);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const newLog: Log = {
      ...log,
      id,
      timestamp: new Date(),
    };
    this.logEntries.set(id, newLog);
    return newLog;
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    errors24h: number;
    warnings24h: number;
    successRate: number;
  }> {
    const allLogs = Array.from(this.logEntries.values());
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLogs = allLogs.filter(log => 
      log.timestamp && log.timestamp >= last24h
    );

    const errors24h = recentLogs.filter(log => log.level === "error").length;
    const warnings24h = recentLogs.filter(log => log.level === "warning").length;
    const totalRecent = recentLogs.length;
    const successfulRecent = recentLogs.filter(log => 
      log.level === "info" || log.level === "debug"
    ).length;

    const successRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 100;

    return {
      totalLogs: allLogs.length,
      errors24h,
      warnings24h,
      successRate: Math.round(successRate * 10) / 10,
    };
  }
}

export const storage = new MemStorage();
