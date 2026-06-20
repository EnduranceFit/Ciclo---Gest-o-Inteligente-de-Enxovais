import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

export function authenticateToken(request: any) {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(request: any, response: any) {
  const user = authenticateToken(request);
  if (!user) {
    response.status(401).json({ error: 'Não autorizado' });
    return null;
  }
  return user;
}
