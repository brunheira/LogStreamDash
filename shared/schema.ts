import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const redisConnections = pgTable("redis_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: text("port").notNull().default("6379"),
  password: text("password"),
  database: text("database").notNull().default("0"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, connecting, error
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  connectionId: text("connection_id").notNull(),
  level: text("level").notNull(), // error, warning, info, debug
  service: text("service").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: json("metadata"), // additional fields like requestId, ip, etc.
});

// Relations
export const redisConnectionsRelations = relations(redisConnections, ({ many }) => ({
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  connection: one(redisConnections, {
    fields: [logs.connectionId],
    references: [redisConnections.id],
  }),
}));

export const insertRedisConnectionSchema = createInsertSchema(redisConnections).omit({
  id: true,
  status: true,
  lastConnected: true,
  createdAt: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

export const updateRedisConnectionSchema = insertRedisConnectionSchema.partial().extend({
  status: z.string().optional(),
  lastConnected: z.date().optional(),
});

export const logFilterSchema = z.object({
  level: z.string().optional(),
  service: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type RedisConnection = typeof redisConnections.$inferSelect;
export type InsertRedisConnection = z.infer<typeof insertRedisConnectionSchema>;
export type UpdateRedisConnection = z.infer<typeof updateRedisConnectionSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type LogFilter = z.infer<typeof logFilterSchema>;
