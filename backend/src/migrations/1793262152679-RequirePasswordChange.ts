import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RequirePasswordChange1793262152679 implements MigrationInterface {
  name = 'RequirePasswordChange1793262152679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('users', 'mustChangePassword')) return;
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'mustChangePassword',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'No se revierte automáticamente el requisito de cambio de contraseña; hacerlo podría reactivar credenciales temporales.',
    );
  }
}
