import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanFields1777451237911 implements MigrationInterface {
  name = "AddPlanFields1777451237911";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "imageUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "isPopular" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "top_up_plans" ADD "description" text`,
    );
    await queryRunner.query(`ALTER TABLE "top_up_plans" ADD "imageUrl" text`);
    await queryRunner.query(
      `ALTER TABLE "top_up_plans" ADD "isPopular" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "top_up_plans" DROP COLUMN "isPopular"`,
    );
    await queryRunner.query(
      `ALTER TABLE "top_up_plans" DROP COLUMN "imageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "top_up_plans" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "isActive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "isPopular"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "imageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "description"`,
    );
  }
}
