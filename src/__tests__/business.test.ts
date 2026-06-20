import { describe, it, expect } from 'vitest';
import { createEmptyDailyItems, createEmptyInventoryItems, ITEMS } from '../types';

describe('Business Rules and Utilities', () => {
  it('should create empty daily items correctly', () => {
    const items = createEmptyDailyItems();
    expect(Object.keys(items).length).toBe(ITEMS.length);
    expect(items['lencol_casal']).toEqual({ enviado: 0, recebido: 0 });
  });

  it('should create empty inventory items correctly', () => {
    const items = createEmptyInventoryItems();
    expect(Object.keys(items).length).toBe(ITEMS.length);
    expect(items['lencol_casal']).toEqual({ hotel: 0, lavanderia: 0, danificado: 0 });
  });
});
