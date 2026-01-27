/**
 * Database Migration Rollback Script
 * 
 * This script drops all tables in reverse order to rollback the database schema.
 * Use with caution - this will delete all data!
 */

import { Pool } from 'pg';
import * as readline from 'readline';

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multilingual_mandi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Prompt user for confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Drop all tables in reverse order
 */
async function rollbackMigrations(): Promise<void> {
  const tables = [
    'ratings',
    'negotiation_messages',
    'negotiations',
    'price_history',
    'products',
    'categories',
    'vendors',
    'users',
  ];

  try {
    console.log('⚠️  WARNING: This will delete all tables and data!\n');
    console.log('Tables to be dropped:');
    tables.forEach(table => console.log(`  - ${table}`));
    console.log('');

    const confirmed = await askConfirmation('Are you sure you want to continue? (yes/no): ');

    if (!confirmed) {
      console.log('❌ Rollback cancelled');
      return;
    }

    console.log('\n🗑️  Starting rollback...\n');

    // Drop tables in reverse order
    for (const table of tables) {
      console.log(`📄 Dropping table: ${table}`);
      
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Successfully dropped: ${table}\n`);
      } catch (error) {
        console.error(`❌ Error dropping ${table}:`);
        console.error(error);
        throw error;
      }
    }

    console.log('✨ Rollback completed successfully!');
    console.log('💡 Run migrations again to recreate the schema');

  } catch (error) {
    console.error('❌ Rollback failed:');
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
    await rollbackMigrations();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
