import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRedisConnectionSchema, updateRedisConnectionSchema, logFilterSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Redis Connection routes
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getRedisConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.get("/api/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }

      const connection = await storage.getRedisConnection(id);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      res.json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connection" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      const validatedData = insertRedisConnectionSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const connection = await storage.createRedisConnection(validatedData);
      console.log("Created connection:", connection);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create connection", error: error.message });
    }
  });

  app.put("/api/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }

      const validatedData = updateRedisConnectionSchema.parse(req.body);
      const connection = await storage.updateRedisConnection(id, validatedData);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      res.json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  app.delete("/api/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }

      const deleted = await storage.deleteRedisConnection(id);
      if (!deleted) {
        return res.status(404).json({ message: "Connection not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // Test connection route
  app.post("/api/connections/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }

      const connection = await storage.getRedisConnection(id);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      // Simulate connection test
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        await storage.updateRedisConnection(id, { 
          status: "connected",
          lastConnected: new Date(),
        });
        res.json({ success: true, message: "Connection successful" });
      } else {
        await storage.updateRedisConnection(id, { 
          status: "error",
        });
        res.status(400).json({ success: false, message: "Connection failed: timeout" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  // Log routes
  app.get("/api/logs", async (req, res) => {
    try {
      const filters = logFilterSchema.parse({
        level: req.query.level,
        service: req.query.service,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const result = await storage.getLogs(filters);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const validatedData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create log" });
    }
  });

  app.get("/api/logs/stats", async (req, res) => {
    try {
      const stats = await storage.getLogStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch log stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
