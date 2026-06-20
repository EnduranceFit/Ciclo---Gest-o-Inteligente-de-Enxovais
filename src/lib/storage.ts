import { DailyEntry, InventoryEntry, OperationalMetric, ItemPriceConfig } from '../types';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const loadData = async (): Promise<DailyEntry[]> => {
  try {
    const response = await fetch('/api/daily', { headers: { ...authHeaders() } });
    if (!response.ok) {
      throw new Error(`Erro ao carregar: ${await response.text()}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch remote data', e);
    throw e;
  }
};

export const saveData = async (data: DailyEntry | DailyEntry[]) => {
  try {
    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erro ao salvar: ${await response.text()}`);
    }
  } catch (e) {
    console.error('Failed to save remote data', e);
    throw e;
  }
};

export const loadInventory = async (): Promise<InventoryEntry[]> => {
  try {
    const response = await fetch('/api/inventory', { headers: { ...authHeaders() } });
    if (!response.ok) {
      throw new Error(`Erro ao carregar inventário: ${await response.text()}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch remote inventory', e);
    throw e;
  }
};

export const saveInventory = async (data: InventoryEntry | InventoryEntry[]) => {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erro ao salvar inventário: ${await response.text()}`);
    }
  } catch (e) {
    console.error('Failed to save remote inventory', e);
    throw e;
  }
};

export const loadMetrics = async (): Promise<OperationalMetric[]> => {
  try {
    const response = await fetch('/api/metrics', { headers: { ...authHeaders() } });
    if (!response.ok) {
      throw new Error(`Erro ao carregar métricas: ${await response.text()}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch remote metrics', e);
    throw e;
  }
};

export const saveMetrics = async (data: OperationalMetric) => {
  try {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erro ao salvar métricas: ${await response.text()}`);
    }
  } catch (e) {
    console.error('Failed to save remote metrics', e);
    throw e;
  }
};

export const loadPrices = async (): Promise<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }[]> => {
  try {
    const response = await fetch('/api/prices', { headers: { ...authHeaders() } });
    if (!response.ok) {
      throw new Error(`Erro ao carregar preços: ${await response.text()}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch remote prices', e);
    throw e;
  }
};

export const savePrices = async (hotelId: string, prices: Record<string, ItemPriceConfig>) => {
  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ hotelId, prices }),
    });
    if (!response.ok) {
      throw new Error(`Erro ao salvar preços: ${await response.text()}`);
    }
  } catch (e) {
    console.error('Failed to save remote prices', e);
    throw e;
  }
};
