import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_SdyVP8UAQW3u@ep-late-surf-adsmnmgi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=10',
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

export const pool = new Pool(config);

export const connectDB = async (): Promise<void> => {
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Attempting to connect to PostgreSQL database... (${4 - retries}/3)`);
      const client = await pool.connect();
      console.log('✅ Successfully connected to PostgreSQL database');
      
      // Test the connection with a simple query
      await client.query('SELECT NOW()');
      console.log('✅ Database connection test successful');
      
      client.release();
      return;
    } catch (error) {
      retries--;
      console.error(`❌ Database connection attempt failed:`, error.message);
      
      if (retries > 0) {
        console.log(`⏳ Retrying in 3 seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('❌ All database connection attempts failed. Please check:');
        console.error('   1. Database URL is correct');
        console.error('   2. Database server is running');
        console.error('   3. Network connectivity');
        console.error('   4. SSL/firewall settings');
        throw error;
      }
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await pool.end();
  console.log('Database connection closed');
};