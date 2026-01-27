/**
 * Database Migration Runner
 * 
 * This script runs all SQL migration files in order to set up the database schema.
 * It reads migration files from the migrations directory and executes them sequentially.
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multilingual_mandi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Run all migration files in order
 */
async function runMigrations(): Promise<void> {
  const migrationsDir = join(__dirname, '..', 'migrations');
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Read all migration files
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order (000, 001, 002, etc.)
    
    if (sqlFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }
    
    console.log(`Found ${sqlFiles.length} migration files:\n`);
    
    // Execute each migration file
    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      console.log(`📄 Running migration: ${file}`);
      
      try {
        // Read the SQL file
        const sql = await readFile(filePath, 'utf-8');
        
        // Execute the SQL
        await pool.query(sql);
        
        console.log(`✅ Successfully executed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`);
        console.error(error);
        throw error;
      }
    }
    
    console.log('✨ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Verify database connection
 */
async function verifyConnection(): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log(`📅 Server time: ${result.rows[0].now}\n`);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await verifyConnection();
    await runMigrations();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
