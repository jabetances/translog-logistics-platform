import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registra excepciones inesperadas y devuelve un 500 genérico', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = { url: '/api/shipments' };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(new Error('database connection details'), host);

    expect(log).toHaveBeenCalledWith('database connection details', expect.stringContaining('database connection details'));
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500, path: '/api/shipments', message: 'Error interno del servidor' }));
  });

  it('no registra como error interno las excepciones HTTP esperadas', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = { url: '/api/shipments' };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(new BadRequestException('datos inválidos'), host);

    expect(log).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
