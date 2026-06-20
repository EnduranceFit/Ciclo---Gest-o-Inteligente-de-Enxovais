import { sql } from '@vercel/postgres';
import { authenticateToken } from './middleware/auth';

export default async function handler(request: any, response: any) {
  const user = authenticateToken(request);
  if (!user) return response.status(401).json({ error: 'Não autorizado' });
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT hotel_id, prices FROM pricing_config;`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Return empty array instead of failing so the app doesn't break if table is empty/missing
      return response.status(200).json([]);
    }
  }

  if (request.method === 'POST') {
    try {
      const { hotelId, prices } = request.body;
      
      await sql`
        INSERT INTO pricing_config (hotel_id, prices, updated_at)
        VALUES (${hotelId}, ${JSON.stringify(prices)}, CURRENT_TIMESTAMP)
        ON CONFLICT (hotel_id)
        DO UPDATE SET 
          prices = EXCLUDED.prices,
          updated_at = EXCLUDED.updated_at;
      `;
      
      return response.status(200).json({ message: 'Prices saved successfully' });
    } catch (error) {
      console.error('Error saving prices:', error);
      return response.status(500).json({ error: 'Failed to save prices', details: (error as Error).message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
