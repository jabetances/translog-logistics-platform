import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';
import { User } from '../users/user.entity.js';

describe('shipment Swagger documentation', () => {
  it('publishes request-body properties and operation summaries', async () => {
    const builder = Test.createTestingModule({
      controllers: [ShipmentsController],
      providers: [{ provide: ShipmentsService, useValue: {} }],
    });
    builder.overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true });
    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('test').addBearerAuth().build(),
        { extraModels: [User] },
      );
      const schemas = document.components?.schemas as Record<
        string,
        { properties?: Record<string, unknown> }
      >;
      const createProperties = schemas.CreateShipmentDto.properties;
      const assignProperties = schemas.AssignVehiclesDto.properties;
      const userProperties = schemas.User.properties;

      expect(createProperties).toHaveProperty('originAddress');
      expect(createProperties).toHaveProperty('weightKg');
      expect(assignProperties).toHaveProperty('shipmentIds');
      expect(assignProperties).toHaveProperty('vehicleCapacity');
      expect(userProperties).toHaveProperty('email');
      expect(userProperties).not.toHaveProperty('passwordHash');
      const listParameters =
        document.paths['/shipments']?.get?.parameters ?? [];
      const listParameterNames = listParameters.flatMap((parameter) =>
        'name' in parameter && typeof parameter.name === 'string'
          ? [parameter.name]
          : [],
      );
      expect(listParameterNames).toEqual(
        expect.arrayContaining([
          'page',
          'limit',
          'status',
          'q',
          'sortBy',
          'sortDirection',
        ]),
      );
      expect(document.paths['/shipments']?.post?.summary).toBe(
        'Crear un envío',
      );
      expect(
        document.paths['/shipments/assign-vehicles']?.post?.summary,
      ).toContain('First Fit Decreasing');
    } finally {
      await app.close();
    }
  });
});
