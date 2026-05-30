import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Supabase requires SSL. postgres.js supports ssl option.
// For local Postgres (no SSL), set DATABASE_URL without sslmode or set DATABASE_NO_SSL=true
const ssl = process.env.DATABASE_NO_SSL === 'true' ? false : 'require';

const sql = postgres(DATABASE_URL, {
  transform: postgres.camel,
  ssl,
  max: 10, // connection pool size
  idle_timeout: 30,
});

export default sql;
