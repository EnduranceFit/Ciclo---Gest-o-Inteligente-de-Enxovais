import { DailyEntry, InventoryEntry, OperationalMetric, ItemPriceConfig } from '../types';

export const loadData = async (): Promise<DailyEntry[]> => {
  try {
    const response = await fetch('/api/daily');
    if (response.ok) {
      return await response.json();
    }
    console.error('Failed to load daily data:', await response.text());
  } catch (e) {
    console.error('Failed to fetch remote data', e);
  }
  return [];
};

export const saveData = async (data: DailyEntry | DailyEntry[]) => {
  try {
    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error('Failed to save daily data:', await response.text());
    }
  } catch (e) {
    console.error('Failed to save remote data', e);
  }
};

export const loadInventory = async (): Promise<InventoryEntry[]> => {
  try {
    const response = await fetch('/api/inventory');
    if (response.ok) {
      return await response.json();
    }
    console.error('Failed to load inventory data:', await response.text());
  } catch (e) {
    console.error('Failed to fetch remote inventory', e);
  }
  return [];
};

export const saveInventory = async (data: InventoryEntry | InventoryEntry[]) => {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error('Failed to save inventory data:', await response.text());
    }
  } catch (e) {
    console.error('Failed to save remote inventory', e);
  }
};

export const loadMetrics = async (): Promise<OperationalMetric[]> => {
  try {
    const response = await fetch('/api/metrics');
    if (response.ok) {
      return await response.json();
    }
    console.error('Failed to load metrics:', await response.text());
  } catch (e) {
    console.error('Failed to fetch remote metrics', e);
  }
  return [];
};

export const saveMetrics = async (data: OperationalMetric) => {
  try {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error('Failed to save metrics data:', await response.text());
    }
  } catch (e) {
    console.error('Failed to save remote metrics', e);
  }
};

export const loadPrices = async (): Promise<{ hotel_id: string, prices: Record<string, ItemPriceConfig> }[]> => {
  try {
    const response = await fetch('/api/prices');
    if (response.ok) {
      return await response.json();
    }
    console.error('Failed to load prices data:', await response.text());
  } catch (e) {
    console.error('Failed to fetch remote prices', e);
  }
  return [];
};

export const savePrices = async (hotelId: string, prices: Record<string, ItemPriceConfig>) => {
  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, prices }),
    });
    if (!response.ok) {
      console.error('Failed to save prices data:', await response.text());
    }
  } catch (e) {
    console.error('Failed to save remote prices', e);
  }
};
