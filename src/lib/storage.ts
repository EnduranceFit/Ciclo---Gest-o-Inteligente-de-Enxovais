import { DailyEntry, InventoryEntry, OperationalMetric, ItemPriceConfig } from '../types';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const tryLocal = <T>(key: string): T[] => {
  const local = localStorage.getItem(key);
  return local ? JSON.parse(local) : [];
};

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const safeFetch = async (url: string, options?: RequestInit): Promise<Response | null> => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      console.warn(`[storage] Não autorizado em ${url}`);
      return null;
    }
    return res;
  } catch (e) {
    console.warn(`[storage] Falha de rede em ${url}:`, e);
    return null;
  }
};

export const loadData = async (): Promise<DailyEntry[]> => {
  const res = await safeFetch('/api/daily', { headers: { ...authHeaders() } });
  if (!res) return tryLocal<DailyEntry>('ciclo_daily_data');

  if (res.status === 500) {
    await safeFetch('/api/create-tables');
    const retry = await safeFetch('/api/daily', { headers: { ...authHeaders() } });
    if (retry && retry.ok) {
      const data = await retry.json();
      if (Array.isArray(data)) return data;
    }
    return tryLocal<DailyEntry>('ciclo_daily_data');
  }

  try {
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch {}
  return tryLocal<DailyEntry>('ciclo_daily_data');
};

export const saveData = async (data: DailyEntry | DailyEntry[]) => {
  if (Array.isArray(data)) saveLocal('ciclo_daily_data', data);
  const res = await safeFetch('/api/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res && !res.ok) {
    console.warn(`[storage] Erro ao salvar dados: ${await res.text()}`);
  }
};

export const loadInventory = async (): Promise<InventoryEntry[]> => {
  const res = await safeFetch('/api/inventory', { headers: { ...authHeaders() } });
  if (!res) return tryLocal<InventoryEntry>('ciclo_inventory_data');

  if (res.status === 500) {
    await safeFetch('/api/create-tables');
    const retry = await safeFetch('/api/inventory', { headers: { ...authHeaders() } });
    if (retry && retry.ok) {
      const data = await retry.json();
      if (Array.isArray(data)) return data;
    }
    return tryLocal<InventoryEntry>('ciclo_inventory_data');
  }

  try {
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch {}
  return tryLocal<InventoryEntry>('ciclo_inventory_data');
};

export const saveInventory = async (data: InventoryEntry | InventoryEntry[]) => {
  if (Array.isArray(data)) saveLocal('ciclo_inventory_data', data);
  const res = await safeFetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res && !res.ok) {
    console.warn(`[storage] Erro ao salvar inventário: ${await res.text()}`);
  }
};

export const loadMetrics = async (): Promise<OperationalMetric[]> => {
  const res = await safeFetch('/api/metrics', { headers: { ...authHeaders() } });
  if (!res) return tryLocal<OperationalMetric>('ciclo_metrics_data');

  if (res.status === 500) {
    await safeFetch('/api/create-tables');
    const retry = await safeFetch('/api/metrics', { headers: { ...authHeaders() } });
    if (retry && retry.ok) {
      const data = await retry.json();
      if (Array.isArray(data)) return data;
    }
    return tryLocal<OperationalMetric>('ciclo_metrics_data');
  }

  try {
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch {}
  return tryLocal<OperationalMetric>('ciclo_metrics_data');
};

export const saveMetrics = async (data: OperationalMetric | OperationalMetric[]) => {
  if (!Array.isArray(data)) {
    const arr = tryLocal<OperationalMetric>('ciclo_metrics_data');
    const idx = arr.findIndex(m => m.hotelId === data.hotelId && m.month === data.month && m.year === data.year);
    if (idx >= 0) arr[idx] = data; else arr.push(data);
    saveLocal('ciclo_metrics_data', arr);
  }
  const res = await safeFetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res && !res.ok) {
    console.warn(`[storage] Erro ao salvar métricas: ${await res.text()}`);
  }
};

export const loadPrices = async (): Promise<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }[]> => {
  const res = await safeFetch('/api/prices', { headers: { ...authHeaders() } });
  if (!res) return tryLocal<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }>('ciclo_prices');

  if (res.status === 500) {
    await safeFetch('/api/create-tables');
    const retry = await safeFetch('/api/prices', { headers: { ...authHeaders() } });
    if (retry && retry.ok) {
      const data = await retry.json();
      if (Array.isArray(data)) return data;
    }
    return tryLocal<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }>('ciclo_prices');
  }

  try {
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch {}
  return tryLocal<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }>('ciclo_prices');
};

export const savePrices = async (hotelId: string, prices: Record<string, ItemPriceConfig>) => {
  const arr = tryLocal<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }>('ciclo_prices');
  const idx = arr.findIndex(p => p.hotel_id === hotelId);
  if (idx >= 0) arr[idx].prices = prices; else arr.push({ hotel_id: hotelId, prices });
  saveLocal('ciclo_prices', arr);

  const res = await safeFetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ hotelId, prices }),
  });
  if (res && !res.ok) {
    console.warn(`[storage] Erro ao salvar preços: ${await res.text()}`);
  }
};
