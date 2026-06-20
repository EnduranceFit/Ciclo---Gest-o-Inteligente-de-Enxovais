import { sql } from '@vercel/postgres';
import { authenticateToken, requireAuth } from './_middleware/auth';

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    authenticateToken(request);
    try {
      const { rows } = await sql`SELECT * FROM operational_metrics;`;
      const formattedRows = rows.map(row => ({
        month: row.month,
        year: row.year,
        hotelId: row.hotel_id,
        uhsOcupadas: row.uhs_ocupadas
      }));
      return response.status(200).json(formattedRows);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return response.status(500).json({ error: 'Failed to fetch metrics', details: (error as Error).message });
    }
  }

  if (request.method === 'POST') {
    const user = requireAuth(request, response);
    if (!user) return;
    try {
      const metric = request.body;
      
      await sql`
        INSERT INTO operational_metrics (month, year, hotel_id, uhs_ocupadas)
        VALUES (${metric.month}, ${metric.year}, ${metric.hotelId}, ${metric.uhsOcupadas})
        ON CONFLICT (month, year, hotel_id)
        DO UPDATE SET 
          uhs_ocupadas = EXCLUDED.uhs_ocupadas;
      `;
      
      return response.status(200).json({ message: 'Metrics saved successfully' });
    } catch (error) {
      console.error('Error saving metrics:', error);
      return response.status(500).json({ error: 'Failed to save metrics', details: (error as Error).message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
