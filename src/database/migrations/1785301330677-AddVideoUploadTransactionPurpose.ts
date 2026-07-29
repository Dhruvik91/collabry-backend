import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoUploadTransactionPurpose1785301330677 implements MigrationInterface {
    name = 'AddVideoUploadTransactionPurpose1785301330677'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum" RENAME TO "kc_transactions_purpose_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_purpose_enum" AS ENUM('AUCTION_CREATION', 'COLLABORATION_CREATION', 'BID_PLACEMENT', 'WEEKLY_REWARD', 'NEW_ARRIVAL_BONUS', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'SYSTEM_ADJUSTMENT', 'KCOIN_TOPUP', 'PITCH_CREATION', 'VIDEO_UPLOAD')`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" ALTER COLUMN "purpose" TYPE "public"."kc_transactions_purpose_enum" USING "purpose"::"text"::"public"."kc_transactions_purpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_purpose_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_purpose_enum_old" AS ENUM('AUCTION_CREATION', 'COLLABORATION_CREATION', 'BID_PLACEMENT', 'WEEKLY_REWARD', 'NEW_ARRIVAL_BONUS', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'SYSTEM_ADJUSTMENT', 'KCOIN_TOPUP', 'PITCH_CREATION')`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" ALTER COLUMN "purpose" TYPE "public"."kc_transactions_purpose_enum_old" USING "purpose"::"text"::"public"."kc_transactions_purpose_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_purpose_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum_old" RENAME TO "kc_transactions_purpose_enum"`);
    }

}
