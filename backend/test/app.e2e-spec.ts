import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { ShipmentsController } from '../src/shipments/shipments.controller.js';
import { ShipmentsService } from '../src/shipments/shipments.service.js';

describe('ShipmentsController HTTP smoke test', () => {
  let app: INestApplication;
  const service = {
    list: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    updateStatus: vi.fn(),
    cancel: vi.fn(),
  };

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: [ShipmentsController],
      providers: [{ provide: ShipmentsService, useValue: service }],
    });
    builder.overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: ExecutionContext) => {
        context.switchToHttp().getRequest().user = { sub: 'test-user' };
        return true;
      },
    });
    const moduleRef = await builder.compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it('rechaza UUIDs inválidos antes de consultar el servicio', async () => {
    await request(app.getHttpServer())
      .get('/api/shipments/not-a-uuid')
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/shipments/not-a-uuid/status')
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .delete('/api/shipments/not-a-uuid')
      .expect(400);

    expect(service.findOne).not.toHaveBeenCalled();
    expect(service.updateStatus).not.toHaveBeenCalled();
    expect(service.cancel).not.toHaveBeenCalled();
  });

  it('inyecta el usuario autenticado al crear un envío', async () => {
    const body = {
      originAddress: 'Calle Mayor',
      destinationAddress: 'Avenida Sol',
      recipientName: 'Ana Pérez',
      weightKg: 12.5,
    };
    const created = {
      id: 'shipment-1',
      trackingCode: 'ENV-20261028-AB12',
      ...body,
    };
    service.create.mockResolvedValueOnce(created);

    await request(app.getHttpServer())
      .post('/api/shipments')
      .send(body)
      .expect(201, created);
    expect(service.create).toHaveBeenCalledWith(body, 'test-user');
  });

  it('rechaza consultas inválidas y transforma las válidas', async () => {
    await request(app.getHttpServer())
      .get('/api/shipments?limit=abc&page=-3')
      .expect(400);
    expect(service.list).not.toHaveBeenCalled();

    const result = {
      data: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    };
    service.list.mockResolvedValueOnce(result);
    await request(app.getHttpServer())
      .get('/api/shipments?page=2&limit=10&sortDirection=asc&q=%20ENV%20')
      .expect(200, result);
    expect(service.list).toHaveBeenCalledWith(
      2,
      10,
      undefined,
      'ENV',
      'createdAt',
      'ASC',
    );
  });

  it('atiende el detalle para un UUID válido', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    service.findOne.mockResolvedValueOnce({ id, trackingCode: 'ENV-test' });

    await request(app.getHttpServer())
      .get('/api/shipments/' + id)
      .expect(200, { id, trackingCode: 'ENV-test' });
    expect(service.findOne).toHaveBeenCalledWith(id);
  });
});
