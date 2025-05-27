import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  eventId: text("event_id").notNull(), // ID único do evento
  logLevel: text("log_level").notNull(), // INFO, ERROR, WARN, DEBUG
  message: text("message").notNull(),
  username: text("username").notNull(), // Usuário que gerou o log
  datetime: timestamp("datetime").notNull(), // Data e hora do evento
  metadata: json("metadata"), // Dados adicionais (opcional)
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
  datetime: true,
});

export const updateRedisConnectionSchema = insertRedisConnectionSchema.partial().extend({
  status: z.string().optional(),
  lastConnected: z.date().optional(),
});

export const logFilterSchema = z.object({
  logLevel: z.string().optional(),
  username: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email deve ter um formato válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type RedisConnection = typeof redisConnections.$inferSelect;
export type InsertRedisConnection = z.infer<typeof insertRedisConnectionSchema>;
export type UpdateRedisConnection = z.infer<typeof updateRedisConnectionSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type LogFilter = z.infer<typeof logFilterSchema>;
