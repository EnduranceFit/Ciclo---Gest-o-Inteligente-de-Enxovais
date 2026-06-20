import { sql } from '@vercel/postgres';
import { authenticateToken, requireAuth } from './_middleware/auth';

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    authenticateToken(request);
    try {
      const { rows } = await sql`SELECT hotel_id, prices FROM pricing_config;`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching prices:', error);
      return response.status(200).json([]);
    }
  }

  if (request.method === 'POST') {
    const user = requireAuth(request, response);
    if (!user) return;
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
