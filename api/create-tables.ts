import { sql } from '@vercel/postgres';

export default async function handler(request: any, response: any) {
  try {
    // Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Daily Entries Table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_entries (
        id SERIAL PRIMARY KEY,
        date VARCHAR(20) NOT NULL,
        hotel_id VARCHAR(50) NOT NULL,
        block VARCHAR(50) NOT NULL,
        items JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        UNIQUE(date, hotel_id, block)
      );
    `;

    // Create Inventory Entries Table
    await sql`
      CREATE TABLE IF NOT EXISTS inventory_entries (
        id SERIAL PRIMARY KEY,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        hotel_id VARCHAR(50) NOT NULL,
        block VARCHAR(50) NOT NULL,
        items JSONB NOT NULL,
        UNIQUE(month, year, hotel_id, block)
      );
    `;

    // Create Operational Metrics Table (For UHs, global hotel metrics)
    await sql`
      CREATE TABLE IF NOT EXISTS operational_metrics (
        id SERIAL PRIMARY KEY,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        hotel_id VARCHAR(50) NOT NULL,
        uhs_ocupadas INTEGER NOT NULL DEFAULT 0,
        UNIQUE(month, year, hotel_id)
      );
    `;

    // Create Pricing Config Table
    await sql`
      CREATE TABLE IF NOT EXISTS pricing_config (
        hotel_id VARCHAR(50) PRIMARY KEY,
        prices JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return response.status(200).json({ message: 'Tables created successfully' });
  } catch (error) {
    console.error('Error creating tables:', error);
    return response.status(500).json({ error: 'Failed to create tables', details: (error as Error).message });
  }
}
