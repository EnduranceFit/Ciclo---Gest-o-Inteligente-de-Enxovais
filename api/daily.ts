import { sql } from '@vercel/postgres';
import { authenticateToken, requireAuth } from './_middleware/auth.js';

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    authenticateToken(request);
    try {
      const { rows } = await sql`SELECT * FROM daily_entries;`;
      const formattedRows = rows.map(row => ({
        date: row.date,
        hotelId: row.hotel_id,
        block: row.block,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
      }));
      return response.status(200).json(formattedRows);
    } catch (error) {
      console.error('Error fetching daily entries:', error);
      return response.status(500).json({ error: 'Failed to fetch daily entries', details: (error as Error).message });
    }
  }

  if (request.method === 'POST') {
    const user = requireAuth(request, response);
    if (!user) return;
    try {
      const entries = request.body;
      
      // If we receive an array, we process them. Actually frontend probably sends a single entry to save or array?
      // Wait, in previous storage.ts, `saveData(data)` gets the ENTIRE array and replaces localstorage.
      // We should probably optimize it here: if frontend sends the entire array, we could upsert all?
      // Better yet, adjust frontend api.ts to only send what changed, or we just handle UPSERT for array.
      
      const toUpdate = Array.isArray(entries) ? entries : [entries];
      
      for (const entry of toUpdate) {
        await sql`
          INSERT INTO daily_entries (date, hotel_id, block, items, updated_at, updated_by)
          VALUES (${entry.date}, ${entry.hotelId}, ${entry.block}, ${JSON.stringify(entry.items)}, ${entry.updatedAt || new Date().toISOString()}, ${entry.updatedBy})
          ON CONFLICT (date, hotel_id, block)
          DO UPDATE SET 
            items = EXCLUDED.items,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by;
        `;
      }
      
      return response.status(200).json({ message: 'Entries saved successfully' });
    } catch (error) {
      console.error('Error saving daily entries:', error);
      return response.status(500).json({ error: 'Failed to save daily entries', details: (error as Error).message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
