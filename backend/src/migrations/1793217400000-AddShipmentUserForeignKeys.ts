import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShipmentUserForeignKeys1793217400000 implements MigrationInterface {
  name = 'AddShipmentUserForeignKeys1793217400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "shipments" shipment
          LEFT JOIN "users" creator ON creator."id" = shipment."createdById"
          WHERE creator."id" IS NULL
        ) THEN
          RAISE EXCEPTION 'No se pueden crear las FK: hay envíos con createdById sin usuario.';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM "shipment_events" event
          LEFT JOIN "users" actor ON actor."id" = event."actorId"
          WHERE event."actorId" IS NOT NULL AND actor."id" IS NULL
        ) THEN
          RAISE EXCEPTION 'No se pueden crear las FK: hay eventos con actorId sin usuario.';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "shipments"
      ADD CONSTRAINT "FK_shipments_created_by_user"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_events"
      ADD CONSTRAINT "FK_shipment_events_actor_user"
      FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "shipment_events" DROP CONSTRAINT "FK_shipment_events_actor_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "shipments" DROP CONSTRAINT "FK_shipments_created_by_user"',
    );
  }
}
