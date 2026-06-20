import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function legacyHashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(request: any, response: any) {
  if (request.method === 'POST') {
    const { action, username, password, newPassword, pin } = request.body;

    if (action === 'init') {
      const users = [
        "ADRIANA.SILVA", "GISELE.KARINE", "ANA.LIDIA", "EMILLY.CRISTINA", 
        "LETICIA.FRANÇA", "MAYNARA.VIANA", "TEREZINHA.SILVA", "MARCELO.COSTA", "JONATAN.ALMEIDA"
      ];
      // Generate a new bcrypt hash for 123
      const defaultHash = bcrypt.hashSync("123", 10);
      try {
        for (const u of users) {
          await sql`
            INSERT INTO users (username, password_hash) 
            VALUES (${u}, ${defaultHash}) 
            ON CONFLICT (username) DO NOTHING;
          `;
        }
        return response.status(200).json({ message: 'Users initialized' });
      } catch (error: any) {
        return response.status(500).json({ error: 'Failed to init users', details: error.message });
      }
    }

    if (action === 'login') {
      if (!username || !password) return response.status(400).json({ error: 'Missing credentials' });
      
      try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username.toUpperCase()}`;
        if (rows.length === 0) return response.status(401).json({ error: 'User not found' });
        
        const dbHash = rows[0].password_hash;
        
        let isValid = false;
        let isLegacy = false;
        
        if (dbHash.startsWith('$2')) {
          isValid = bcrypt.compareSync(password, dbHash);
        } else {
          const legacyHash = legacyHashPassword(password);
          if (dbHash === legacyHash) {
             isValid = true;
             isLegacy = true;
          }
        }
        
        if (!isValid) return response.status(401).json({ error: 'Invalid password' });

        if (isLegacy || password === '123') {
           return response.status(401).json({ error: 'force-password-change' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-123';
        const token = jwt.sign({ username: rows[0].username, role: 'user' }, jwtSecret, { expiresIn: '24h' });
        return response.status(200).json({ message: 'Login successful', username: rows[0].username, token });
      } catch (error: any) {
        return response.status(500).json({ error: 'Login error', details: error.message });
      }
    }

    if (action === 'change-password') {
      if (!username || !password || !newPassword) return response.status(400).json({ error: 'Missing parameters' });
      
      try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username.toUpperCase()}`;
        if (rows.length === 0) return response.status(401).json({ error: 'User not found' });
        
        const dbHash = rows[0].password_hash;
        
        let isValid = false;
        if (dbHash.startsWith('$2')) {
          isValid = bcrypt.compareSync(password, dbHash);
        } else {
          const legacyHash = legacyHashPassword(password);
          if (dbHash === legacyHash) {
             isValid = true;
          }
        }
        
        if (!isValid) return response.status(401).json({ error: 'Current password invalid' });

        const newHashed = bcrypt.hashSync(newPassword, 10);
        await sql`UPDATE users SET password_hash = ${newHashed} WHERE username = ${username.toUpperCase()}`;
        
        return response.status(200).json({ message: 'Password updated successfully' });
      } catch (error: any) {
        return response.status(500).json({ error: 'Change password error', details: error.message });
      }
    }

    if (action === 'verify-pin') {
      if (!pin) return response.status(400).json({ error: 'PIN missing' });
      const adminPin = process.env.ADMIN_PIN || '1808'; 
      if (pin === adminPin) {
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-123';
        const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '1h' });
        return response.status(200).json({ token });
      } else {
        return response.status(401).json({ error: 'Invalid PIN' });
      }
    }

    return response.status(400).json({ error: 'Invalid action' });
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
