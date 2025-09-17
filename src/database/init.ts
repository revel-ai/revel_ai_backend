import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './connection';

export const initializeDatabase = async (): Promise<void> => {
  try {
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSQL);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};