import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirebaseUid1779100000000 implements MigrationInterface {
  name = "AddFirebaseUid1779100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firebaseUid" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_firebaseUid" ON "users" ("firebaseUid") WHERE ("deletedAt" IS NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_firebaseUid"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firebaseUid"`);
  }
}
