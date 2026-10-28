import type { MigrationInterface, QueryRunner, Table } from 'typeorm';

function quoteSchema(queryRunner: QueryRunner): string {
  const options = queryRunner.connection.options;
  const schema =
    options.type === 'postgres' ? (options.schema ?? 'public') : 'public';
  return '"' + schema.replaceAll('"', '""') + '"';
}

export class InitialSchema1793218670099 implements MigrationInterface {
  name = 'InitialSchema1793218670099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemaName = quoteSchema(queryRunner);
    const userTable = await queryRunner.getTable('users');
    const shipmentTable = await queryRunner.getTable('shipments');
    const eventTable = await queryRunner.getTable('shipment_events');

    if (userTable || shipmentTable || eventTable) {
      const hasColumns = (table: Table | undefined, columns: string[]) =>
        Boolean(
          table &&
          columns.every((name) =>
            table.columns.some((column) => column.name === name),
          ),
        );
      const hasForeignKey = (
        table: Table | undefined,
        columnName: string,
        targetTable: string,
      ) =>
        table?.foreignKeys.some(
          (foreignKey) =>
            foreignKey.columnNames.includes(columnName) &&
            foreignKey.referencedTableName
              .split('.')
              .at(-1)
              ?.replaceAll('"', '') === targetTable &&
            foreignKey.referencedColumnNames.includes('id'),
        ) ?? false;
      const alreadySynchronized =
        hasColumns(userTable, [
          'id',
          'email',
          'passwordHash',
          'fullName',
          'role',
          'createdAt',
        ]) &&
        hasColumns(shipmentTable, [
          'id',
          'trackingCode',
          'originAddress',
          'destinationAddress',
          'recipientName',
          'contactPhone',
          'weightKg',
          'status',
          'deliveredAt',
          'createdById',
          'createdAt',
          'updatedAt',
        ]) &&
        hasColumns(eventTable, [
          'id',
          'shipmentId',
          'status',
          'actorId',
          'location',
          'notes',
          'createdAt',
        ]) &&
        hasForeignKey(shipmentTable, 'createdById', 'users') &&
        hasForeignKey(eventTable, 'actorId', 'users') &&
        hasForeignKey(eventTable, 'shipmentId', 'shipments');

      if (alreadySynchronized) return;
      throw new Error(
        'InitialSchema encontró tablas parciales o incompatibles; no se modificó el esquema existente.',
      );
    }

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
            CREATE TYPE ${schemaName}."users_role_enum" AS ENUM('OPERATOR', 'SUPERVISOR')
        `);
    await queryRunner.query(`
            CREATE TABLE ${schemaName}."users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(254) NOT NULL,
                "passwordHash" character varying NOT NULL,
                "fullName" character varying(120) NOT NULL,
                "role" ${schemaName}."users_role_enum" NOT NULL DEFAULT 'OPERATOR',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE ${schemaName}."shipments_status_enum" AS ENUM(
                'CREATED',
                'IN_WAREHOUSE',
                'IN_TRANSIT',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'RETURNED',
                'CANCELLED'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE ${schemaName}."shipments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "trackingCode" character varying(24) NOT NULL,
                "originAddress" character varying(240) NOT NULL,
                "destinationAddress" character varying(240) NOT NULL,
                "recipientName" character varying(160) NOT NULL,
                "contactPhone" character varying(40),
                "weightKg" numeric(10, 3) NOT NULL,
                "status" ${schemaName}."shipments_status_enum" NOT NULL DEFAULT 'CREATED',
                "deliveredAt" TIMESTAMP WITH TIME ZONE,
                "createdById" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_8f63eba0c4474a3e6999ce3fc03" UNIQUE ("trackingCode"),
                CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a19baf6dd62cac42fbb40a518" ON ${schemaName}."shipments" ("status")
        `);
    await queryRunner.query(`
            CREATE TYPE ${schemaName}."shipment_events_status_enum" AS ENUM(
                'CREATED',
                'IN_WAREHOUSE',
                'IN_TRANSIT',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'RETURNED',
                'CANCELLED'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE ${schemaName}."shipment_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shipmentId" uuid NOT NULL,
                "status" ${schemaName}."shipment_events_status_enum" NOT NULL,
                "actorId" uuid,
                "location" character varying(200) NOT NULL,
                "notes" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_80a42a8d00d59cbfab38e1d0872" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_62b5b88cdaedf8939e29021486" ON ${schemaName}."shipment_events" ("shipmentId", "createdAt")
        `);
    await queryRunner.query(`
            ALTER TABLE ${schemaName}."shipments"
            ADD CONSTRAINT "FK_96de1112a6c3b62bf5b5fc151df" FOREIGN KEY ("createdById") REFERENCES ${schemaName}."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE ${schemaName}."shipment_events"
            ADD CONSTRAINT "FK_e0d86c92942127971af5a1d9829" FOREIGN KEY ("shipmentId") REFERENCES ${schemaName}."shipments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE ${schemaName}."shipment_events"
            ADD CONSTRAINT "FK_60f9f125157bd4339d8b3472cb3" FOREIGN KEY ("actorId") REFERENCES ${schemaName}."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'InitialSchema no se revierte automáticamente: recrea una base vacía desde copia de seguridad para evitar borrar datos.',
    );
  }
}
