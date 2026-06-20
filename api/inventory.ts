import { sql } from '@vercel/postgres';
import { authenticateToken } from './middleware/auth';

export default async function handler(request: any, response: any) {
  const user = authenticateToken(request);
  if (!user) return response.status(401).json({ error: 'Não autorizado' });
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM inventory_entries;`;
      const formattedRows = rows.map(row => ({
        month: row.month,
        year: row.year,
        hotelId: row.hotel_id,
        block: row.block,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      }));
      return response.status(200).json(formattedRows);
    } catch (error) {
      console.error('Error fetching inventory entries:', error);
      return response.status(500).json({ error: 'Failed to fetch inventory entries', details: (error as Error).message });
    }
  }

  if (request.method === 'POST') {
    try {
      const entries = request.body;
      const toUpdate = Array.isArray(entries) ? entries : [entries];
      
      for (const entry of toUpdate) {
        await sql`
          INSERT INTO inventory_entries (month, year, hotel_id, block, items)
          VALUES (${entry.month}, ${entry.year}, ${entry.hotelId}, ${entry.block}, ${JSON.stringify(entry.items)})
          ON CONFLICT (month, year, hotel_id, block)
          DO UPDATE SET 
            items = EXCLUDED.items;
        `;
      }
      
      return response.status(200).json({ message: 'Inventory saved successfully' });
    } catch (error) {
      console.error('Error saving inventory entries:', error);
      return response.status(500).json({ error: 'Failed to save inventory entries', details: (error as Error).message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
