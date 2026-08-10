import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultExistingUsersToFreePlan1786370146804 implements MigrationInterface {
    name = 'DefaultExistingUsersToFreePlan1786370146804'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure uuid-ossp extension is enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Insert FREE subscription plan if it doesn't exist
        await queryRunner.query(`
            INSERT INTO "subscription_plans" ("id", "name", "price", "isActive", "billingPeriod")
            VALUES (uuid_generate_v4(), 'FREE', 0.00, true, 'monthly')
            ON CONFLICT ("name") DO NOTHING
        `);

        // Assign FREE plan to all existing USER and INFLUENCER accounts who don't have any subscription record
        await queryRunner.query(`
            INSERT INTO "user_subscriptions" ("userId", "planId", "status", "currentPeriodStart", "createdAt", "updatedAt")
            SELECT u."id", p."id", 'ACTIVE', NOW(), NOW(), NOW()
            FROM "users" u
            CROSS JOIN "subscription_plans" p
            LEFT JOIN "user_subscriptions" us ON us."userId" = u."id"
            WHERE u."role" IN ('USER', 'INFLUENCER')
              AND p."name" = 'FREE'
              AND us."id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete free subscriptions that were automatically created (they will have plan name 'FREE' and no razorpaySubscriptionId)
        await queryRunner.query(`
            DELETE FROM "user_subscriptions"
            WHERE "planId" IN (SELECT "id" FROM "subscription_plans" WHERE "name" = 'FREE')
              AND "razorpaySubscriptionId" IS NULL
        `);
    }
}
