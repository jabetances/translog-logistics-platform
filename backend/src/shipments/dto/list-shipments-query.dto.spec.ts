import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListShipmentsQueryDto } from './list-shipments-query.dto.js';

describe('ListShipmentsQueryDto', () => {
  it('usa valores por defecto y normaliza el sentido de ordenación', () => {
    const defaults = plainToInstance(ListShipmentsQueryDto, {});
    expect(defaults.page).toBe(1);
    expect(defaults.limit).toBe(20);
    expect(defaults.sortBy).toBe('createdAt');
    expect(defaults.sortDirection).toBe('DESC');

    const query = plainToInstance(ListShipmentsQueryDto, {
      sortDirection: ' asc ',
    });
    expect(query.sortDirection).toBe('ASC');
    expect(validateSync(query)).toHaveLength(0);
  });

  it.each([
    { page: 'abc' },
    { page: '-3' },
    { limit: 'abc' },
    { limit: '101' },
    { sortBy: 'passwordHash' },
    { sortDirection: 'UP' },
    { status: 'UNKNOWN' },
  ])('rechaza parámetros inválidos: %j', (query) => {
    const dto = plainToInstance(ListShipmentsQueryDto, query);
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
