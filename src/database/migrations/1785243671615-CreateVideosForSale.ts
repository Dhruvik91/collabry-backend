import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVideosForSale1785243671615 implements MigrationInterface {
  name = "CreateVideosForSale1785243671615";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_firebaseUid"`);
    await queryRunner.query(
      `CREATE TABLE "videos_for_sale" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "influencerId" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "videoUrl" text NOT NULL, "price" numeric(12,2), "categories" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_2ddcbb9491bc9f1188a0654dce0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3474b2e0183ed1ebfe4e4e0765" ON "videos_for_sale" ("influencerId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cfbd931190229522cdf09babc0" ON "users" ("firebaseUid") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos_for_sale" ADD CONSTRAINT "FK_3474b2e0183ed1ebfe4e4e07650" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "videos_for_sale" DROP CONSTRAINT "FK_3474b2e0183ed1ebfe4e4e07650"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfbd931190229522cdf09babc0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3474b2e0183ed1ebfe4e4e0765"`,
    );
    await queryRunner.query(`DROP TABLE "videos_for_sale"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_firebaseUid" ON "users" ("firebaseUid") WHERE ("deletedAt" IS NULL)`,
    );
  }
}
