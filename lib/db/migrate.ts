import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = config.databaseUrl;
const dir = path.dirname(dbPath);
if (dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: './lib/db/migrations' });
console.log('migrations complete');
sqlite.close();
