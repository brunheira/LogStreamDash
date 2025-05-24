// db.ts
import { drizzle } from 'drizzle-orm/node-postgres'; // Mude para node-postgres
import { Pool } from 'pg'; // Use o Pool do 'pg'
import * as schema from "@shared/schema"; // Seu schema Drizzle
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use o Pool do 'pg' para PostgreSQL padrão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // "postgresql://postgres:postgres@localhost:5432/rediswatch"
  // Você pode adicionar outras opções de configuração do Pool do pg aqui, se necessário
  // max: 20,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});

// Passe o pool do 'pg' para o Drizzle
export const db = drizzle(pool, { schema });