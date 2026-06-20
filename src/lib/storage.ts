import { DailyEntry, InventoryEntry, OperationalMetric, ItemPriceConfig } from '../types';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const handleUnauthorized = (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    window.location.reload();
  }
};

export const loadData = async (): Promise<DailyEntry[]> => {
  try {
    let response = await fetch('/api/daily', { headers: { ...authHeaders() } });
    if (response.status === 500) {
      await fetch('/api/create-tables');
      response = await fetch('/api/daily', { headers: { ...authHeaders() } });
    }
    
    handleUnauthorized(response);

    if (response.headers.get("content-type")?.includes("application/json")) {
      if (!response.ok) throw new Error(`Erro ao carregar: ${await response.text()}`);
      const data = await response.json();
      if (data.length === 0) {
        const local = localStorage.getItem('ciclo_daily_data');
        if (local) return JSON.parse(local);
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch remote data, falling back to local storage', e);
  }
  const local = localStorage.getItem('ciclo_daily_data');
  return local ? JSON.parse(local) : [];
};

export const saveData = async (data: DailyEntry | DailyEntry[]) => {
  if (Array.isArray(data)) {
    localStorage.setItem('ciclo_daily_data', JSON.stringify(data));
  }
  try {
    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    handleUnauthorized(response);
    if (!response.ok) {
       console.warn(`Erro ao salvar no BD remoto: ${await response.text()}`);
    }
  } catch (e) {
    console.warn('Failed to save remote data', e);
  }
};

export const loadInventory = async (): Promise<InventoryEntry[]> => {
  try {
    let response = await fetch('/api/inventory', { headers: { ...authHeaders() } });
    if (response.status === 500) {
      await fetch('/api/create-tables');
      response = await fetch('/api/inventory', { headers: { ...authHeaders() } });
    }
    
    handleUnauthorized(response);

    if (response.headers.get("content-type")?.includes("application/json")) {
      if (!response.ok) throw new Error(`Erro ao carregar inventário: ${await response.text()}`);
      const data = await response.json();
      if (data.length === 0) {
        const local = localStorage.getItem('ciclo_inventory_data');
        if (local) return JSON.parse(local);
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch remote inventory, falling back to local storage', e);
  }
  const local = localStorage.getItem('ciclo_inventory_data');
  return local ? JSON.parse(local) : [];
};

export const saveInventory = async (data: InventoryEntry | InventoryEntry[]) => {
  if (Array.isArray(data)) {
    localStorage.setItem('ciclo_inventory_data', JSON.stringify(data));
  }
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      console.warn(`Erro ao salvar inventário remoto: ${await response.text()}`);
    }
  } catch (e) {
    console.warn('Failed to save remote inventory', e);
  }
};

export const loadMetrics = async (): Promise<OperationalMetric[]> => {
  try {
    let response = await fetch('/api/metrics', { headers: { ...authHeaders() } });
    if (response.status === 500) {
      await fetch('/api/create-tables');
      response = await fetch('/api/metrics', { headers: { ...authHeaders() } });
    }

    handleUnauthorized(response);

    if (response.headers.get("content-type")?.includes("application/json")) {
      if (!response.ok) throw new Error(`Erro ao carregar métricas: ${await response.text()}`);
      const data = await response.json();
      if (data.length === 0) {
        const local = localStorage.getItem('ciclo_metrics_data');
        if (local) return JSON.parse(local);
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch remote metrics, falling back to local storage', e);
  }
  const local = localStorage.getItem('ciclo_metrics_data');
  return local ? JSON.parse(local) : [];
};

export const saveMetrics = async (data: OperationalMetric | OperationalMetric[]) => {
  if (!Array.isArray(data)) {
    const local = localStorage.getItem('ciclo_metrics_data');
    let arr: OperationalMetric[] = local ? JSON.parse(local) : [];
    const idx = arr.findIndex(m => m.hotelId === data.hotelId && m.month === data.month && m.year === data.year);
    if (idx >= 0) arr[idx] = data; else arr.push(data);
    localStorage.setItem('ciclo_metrics_data', JSON.stringify(arr));
  }
  try {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      console.warn(`Erro ao salvar métricas remotas: ${await response.text()}`);
    }
  } catch (e) {
    console.warn('Failed to save remote metrics', e);
  }
};

export const loadPrices = async (): Promise<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }[]> => {
  try {
    let response = await fetch('/api/prices', { headers: { ...authHeaders() } });
    if (response.status === 500) {
      await fetch('/api/create-tables');
      response = await fetch('/api/prices', { headers: { ...authHeaders() } });
    }

    handleUnauthorized(response);

    if (response.headers.get("content-type")?.includes("application/json")) {
      if (!response.ok) throw new Error(`Erro ao carregar preços: ${await response.text()}`);
      const data = await response.json();
      if (data.length === 0) {
        const local = localStorage.getItem('ciclo_prices');
        if (local) return JSON.parse(local);
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch remote prices, falling back to local storage', e);
  }
  const local = localStorage.getItem('ciclo_prices');
  return local ? JSON.parse(local) : [];
};

export const savePrices = async (hotelId: string, prices: Record<string, ItemPriceConfig>) => {
  const local = localStorage.getItem('ciclo_prices');
  let arr: {hotel_id: string, prices: Record<string, ItemPriceConfig>}[] = local ? JSON.parse(local) : [];
  const idx = arr.findIndex(p => p.hotel_id === hotelId);
  if (idx >= 0) arr[idx].prices = prices; else arr.push({ hotel_id: hotelId, prices });
  localStorage.setItem('ciclo_prices', JSON.stringify(arr));

  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ hotelId, prices }),
    });
    handleUnauthorized(response);
    if (!response.ok) {
      console.warn(`Erro ao salvar preços remotos: ${await response.text()}`);
    }
  } catch (e) {
    console.warn('Failed to save remote prices', e);
  }
};
