import { sql } from '@vercel/postgres';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(request: any, response: any) {
  if (request.method === 'POST') {
    const { action, username, password, newPassword } = request.body;

    if (action === 'init') {
      const users = [
        "ADRIANA.SILVA", "GISELE.KARINE", "ANA.LIDIA", "EMILLY.CRISTINA", 
        "LETICIA.FRANÇA", "MAYNARA.VIANA", "TEREZINHA.SILVA", "MARCELO.COSTA", "JONATAN.ALMEIDA"
      ];
      const defaultHash = hashPassword("123");
      try {
        for (const u of users) {
          await sql`
            INSERT INTO users (username, password_hash) 
            VALUES (${u}, ${defaultHash}) 
            ON CONFLICT (username) DO NOTHING;
          `;
        }
        return response.status(200).json({ message: 'Users initialized' });
      } catch (error) {
        return response.status(500).json({ error: 'Failed to init users', details: (error as Error).message });
      }
    }

    if (action === 'login') {
      if (!username || !password) return response.status(400).json({ error: 'Missing credentials' });
      const hashed = hashPassword(password);
      try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username.toUpperCase()}`;
        if (rows.length === 0) return response.status(401).json({ error: 'User not found' });
        
        if (rows[0].password_hash !== hashed) return response.status(401).json({ error: 'Invalid password' });

        return response.status(200).json({ message: 'Login successful', username: rows[0].username });
      } catch (error) {
        return response.status(500).json({ error: 'Login error', details: (error as Error).message });
      }
    }

    if (action === 'change-password') {
      if (!username || !password || !newPassword) return response.status(400).json({ error: 'Missing parameters' });
      const currentHashed = hashPassword(password);
      try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username.toUpperCase()}`;
        if (rows.length === 0) return response.status(401).json({ error: 'User not found' });
        
        if (rows[0].password_hash !== currentHashed) return response.status(401).json({ error: 'Current password invalid' });

        const newHashed = hashPassword(newPassword);
        await sql`UPDATE users SET password_hash = ${newHashed} WHERE username = ${username.toUpperCase()}`;
        
        return response.status(200).json({ message: 'Password updated successfully' });
      } catch (error) {
        return response.status(500).json({ error: 'Change password error', details: (error as Error).message });
      }
    }
    return response.status(400).json({ error: 'Invalid action' });
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
