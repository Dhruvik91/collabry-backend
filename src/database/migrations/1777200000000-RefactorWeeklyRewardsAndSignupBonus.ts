import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorWeeklyRewardsAndSignupBonus1777200000000 implements MigrationInterface {
    name = 'RefactorWeeklyRewardsAndSignupBonus1777200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Update the Enum Type
        // PostgreSQL doesn't allow direct renaming of enum values easily across all versions, 
        // but we can add new ones and update the records.
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum" ADD VALUE 'WEEKLY_REWARD'`);
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum" ADD VALUE 'NEW_ARRIVAL_BONUS'`);
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum" ADD VALUE 'KCOIN_TOPUP'`); // Adding this if missing as seen in enums.ts

        // 2. Update existing records in kc_transactions
        await queryRunner.query(`UPDATE "kc_transactions" SET "purpose" = 'WEEKLY_REWARD' WHERE "purpose" = 'DAILY_ALLOWANCE'`);

        // 3. Update existing records in kc_settings
        await queryRunner.query(`UPDATE "kc_settings" SET "key" = 'WEEKLY_REWARD_BRAND' WHERE "key" = 'DAILY_ALLOWANCE_BRAND'`);
        await queryRunner.query(`UPDATE "kc_settings" SET "key" = 'WEEKLY_REWARD_INFLUENCER' WHERE "key" = 'DAILY_ALLOWANCE_INFLUENCER'`);

        // 4. Insert new setting for NEW_ARRIVAL_BONUS_AMOUNT (if not exists)
        await queryRunner.query(`INSERT INTO "kc_settings" ("key", "value") VALUES ('NEW_ARRIVAL_BONUS_AMOUNT', 500) ON CONFLICT ("key") DO NOTHING`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert settings
        await queryRunner.query(`UPDATE "kc_settings" SET "key" = 'DAILY_ALLOWANCE_BRAND' WHERE "key" = 'WEEKLY_REWARD_BRAND'`);
        await queryRunner.query(`UPDATE "kc_settings" SET "key" = 'DAILY_ALLOWANCE_INFLUENCER' WHERE "key" = 'WEEKLY_REWARD_INFLUENCER'`);
        await queryRunner.query(`DELETE FROM "kc_settings" WHERE "key" = 'NEW_ARRIVAL_BONUS_AMOUNT'`);

        // Revert transactions (Note: We can't easily remove enum values once added in Postgres without dropping/recreating)
        await queryRunner.query(`UPDATE "kc_transactions" SET "purpose" = 'DAILY_ALLOWANCE' WHERE "purpose" = 'WEEKLY_REWARD'`);
    }

}
