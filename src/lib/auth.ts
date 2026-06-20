// Basic local hash fallback for local dev without Vercel Serverless
const localHash = async (text: string) => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const login = async (username: string, password: string):Promise<{success: boolean; message: string; username?: string}> => {
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
        return { success: true, message: data.message, username: data.username };
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
    return { success: true, message: 'Login local bem sucedido', username: userUpper };
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
    if (!localStorage.getItem('localUsersDB')) {
      const defaultUsers = [
        "ADRIANA.SILVA", "GISELE.KARINE", "ANA.LIDIA", "EMILLY.CRISTINA", 
        "LETICIA.FRANÇA", "MAYNARA.VIANA", "TEREZINHA.SILVA", "MARCELO.COSTA", "JONATAN.ALMEIDA"
      ];
      const db: Record<string, string> = {};
      const defaultHash = await localHash("123");
      defaultUsers.forEach(u => db[u] = defaultHash);
      localStorage.setItem('localUsersDB', JSON.stringify(db));
      console.log('Inicializou usuários localmente');
    }
  }
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentUser');
};
