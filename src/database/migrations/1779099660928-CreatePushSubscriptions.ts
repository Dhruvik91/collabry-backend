import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushSubscriptions1779099660928 implements MigrationInterface {
    name = 'CreatePushSubscriptions1779099660928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" text NOT NULL, "auth" text NOT NULL, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4cc061875e9eecc311a94b3e43" ON "push_subscriptions" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0008bdfd174e533a3f98bf9af1" ON "push_subscriptions" ("endpoint") `);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" ADD CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_4cc061875e9eecc311a94b3e431"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0008bdfd174e533a3f98bf9af1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cc061875e9eecc311a94b3e43"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
    }

}
