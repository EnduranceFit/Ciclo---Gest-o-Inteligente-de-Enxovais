// Basic local hash fallback for local dev without Vercel Serverless
const localHash = async (text: string) => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const login = async (username: string, password: string):Promise<{success: boolean; message: string; username?: string; token?: string}> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    
    // Check if response is JSON (if running local Vite, it returns HTML)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('currentUser', data.username);
        localStorage.setItem('token', data.token);
        return { success: true, message: data.message, username: data.username, token: data.token };
      } else {
        return { success: false, message: data.error || 'Erro ao fazer login' };
      }
    } else {
      // Fallback para dev local sem Vercel
      throw new Error('Local API fallback');
    }
  } catch (error) {
    // Local development fallback
    const users = JSON.parse(localStorage.getItem('localUsersDB') || '{}');
    const userUpper = username.toUpperCase();
    const hashed = await localHash(password);
    
    if (!users[userUpper]) {
      return { success: false, message: 'Usuário não encontrado (Modo Local)' };
    }
    if (users[userUpper] !== hashed) {
      return { success: false, message: 'Senha inválida (Modo Local)' };
    }
    
    localStorage.setItem('currentUser', userUpper);
    localStorage.setItem('token', 'local-dev-token');
    return { success: true, message: 'Login local bem sucedido', username: userUpper, token: 'local-dev-token' };
  }
};

export const changePassword = async (username: string, password: string, newPassword: string):Promise<{success: boolean; message: string}> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change-password', username, password, newPassword })
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Erro ao trocar senha' };
      }
    } else {
      throw new Error('Local API fallback');
    }
  } catch (error) {
    // Local development fallback
    const users = JSON.parse(localStorage.getItem('localUsersDB') || '{}');
    const userUpper = username.toUpperCase();
    const currentHashed = await localHash(password);
    
    if (!users[userUpper]) return { success: false, message: 'Usuário não encontrado' };
    if (users[userUpper] !== currentHashed) return { success: false, message: 'Senha atual inválida' };
    
    users[userUpper] = await localHash(newPassword);
    localStorage.setItem('localUsersDB', JSON.stringify(users));
    return { success: true, message: 'Senha alterada com sucesso (Modo Local)' };
  }
};

export const initUsers = async ():Promise<void> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init' })
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      throw new Error('Local API fallback');
    }
  } catch (e) {
    // Local fallback init
    const db: Record<string, string> = JSON.parse(localStorage.getItem('localUsersDB') || '{}');
    const defaultUsers = [
      "ADRIANA.SILVA", "GISELE.KARINE", "ANA.LIDIA", "EMILLY.CRISTINA", 
      "LETICIA.FRANÇA", "MAYNARA.VIANA", "TEREZINHA.SILVA", "MARCELO.COSTA", "JONATAN.ALMEIDA", "MARCELO.SILVA"
    ];
    const defaultHash = await localHash("123");
    defaultUsers.forEach(u => {
      if (!db[u] || u === "MARCELO.SILVA") db[u] = defaultHash;
    });
    localStorage.setItem('localUsersDB', JSON.stringify(db));
    console.log('Inicializou usuários localmente');
  }
};

export const logout = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentUser');
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  if (token === 'local-dev-token' || token === 'local-token') return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const verifyPin = async (pin: string): Promise<{success: boolean; token?: string}> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-pin', pin })
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      return { success: true, token: data.token };
    }
    return { success: false };
  } catch {
    // Local fallback
    if (pin === '1808') {
      localStorage.setItem('token', 'local-token');
      return { success: true, token: 'local-token' };
    }
    return { success: false };
  }
};
