import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSoftDeleteUniqueConstraints1777270712926 implements MigrationInterface {
    name = 'FixSoftDeleteUniqueConstraints1777270712926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b5706b5ae59f1ea4b743700bfd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1ea35db5be7c08520d70dc03f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7f8278f4e89249bb75c9a1589"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP CONSTRAINT "UQ_b5706b5ae59f1ea4b743700bfd1"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0171e3331b71e238166daf5ac8" ON "influencer_profiles" ("slug") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_39893678b9618f63c0919eabcb" ON "profiles" ("username") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_262d8d714a42e664d987714a75" ON "users" ("email") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bfcfa74a1bc4575ba39ee66e59" ON "users" ("username") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_93575a0017f3d53580095dfb6a" ON "users" ("referralCode") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_93575a0017f3d53580095dfb6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfcfa74a1bc4575ba39ee66e59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_262d8d714a42e664d987714a75"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39893678b9618f63c0919eabcb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0171e3331b71e238166daf5ac8"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899" UNIQUE ("referralCode")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD CONSTRAINT "UQ_b5706b5ae59f1ea4b743700bfd1" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`CREATE INDEX "IDX_b7f8278f4e89249bb75c9a1589" ON "users" ("referralCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1ea35db5be7c08520d70dc03f" ON "profiles" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5706b5ae59f1ea4b743700bfd" ON "influencer_profiles" ("slug") `);
    }

}
