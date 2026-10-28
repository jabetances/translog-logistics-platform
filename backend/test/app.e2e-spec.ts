import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { ShipmentsController } from '../src/shipments/shipments.controller.js';
import { ShipmentsService } from '../src/shipments/shipments.service.js';

describe('ShipmentsController HTTP smoke test', () => {
  let app: INestApplication;
  const service = {
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
    await app.init();
  });

  afterAll(async () => app.close());

  it('rechaza UUIDs inválidos antes de consultar el servicio', async () => {
    await request(app.getHttpServer()).get('/api/shipments/not-a-uuid').expect(400);
    await request(app.getHttpServer()).patch('/api/shipments/not-a-uuid/status').send({}).expect(400);
    await request(app.getHttpServer()).delete('/api/shipments/not-a-uuid').expect(400);

    expect(service.findOne).not.toHaveBeenCalled();
    expect(service.updateStatus).not.toHaveBeenCalled();
    expect(service.cancel).not.toHaveBeenCalled();
  });

  it('atiende el detalle para un UUID válido', async () => {
    const id = '123e4567-e89b-42d3-a456-426614174000';
    service.findOne.mockResolvedValueOnce({ id, trackingCode: 'ENV-test' });

    await request(app.getHttpServer()).get('/api/shipments/' + id).expect(200, { id, trackingCode: 'ENV-test' });
    expect(service.findOne).toHaveBeenCalledWith(id);
  });
});
