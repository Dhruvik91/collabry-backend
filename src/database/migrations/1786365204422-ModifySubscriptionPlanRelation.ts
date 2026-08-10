import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifySubscriptionPlanRelation1786365204422 implements MigrationInterface {
    name = 'ModifySubscriptionPlanRelation1786365204422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the unique constraint on planId to allow many user subscriptions to refer to the same plan
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "REL_55c9f77733123bd2ead2988601"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the unique constraint on planId
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "REL_55c9f77733123bd2ead2988601" UNIQUE ("planId")`);
    }
}
