import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptions1786365204421 implements MigrationInterface {
    name = 'AddSubscriptions1786365204421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('PENDING', 'ACTIVE', 'HALTED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "user_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" uuid NOT NULL, "razorpaySubscriptionId" character varying, "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'PENDING', "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "cancelledAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_2dfab576863bc3f84d4f696227" UNIQUE ("userId"), CONSTRAINT "REL_55c9f77733123bd2ead2988601" UNIQUE ("planId"), CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ddd218fe78056b9a3720c95ab1" ON "user_subscriptions" ("razorpaySubscriptionId") `);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "razorpayPlanId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "billingPeriod" character varying NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_2dfab576863bc3f84d4f6962274" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_55c9f77733123bd2ead29886017" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_55c9f77733123bd2ead29886017"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_2dfab576863bc3f84d4f6962274"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "billingPeriod"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "razorpayPlanId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ddd218fe78056b9a3720c95ab1"`);
        await queryRunner.query(`DROP TABLE "user_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."user_subscriptions_status_enum"`);
    }

}
