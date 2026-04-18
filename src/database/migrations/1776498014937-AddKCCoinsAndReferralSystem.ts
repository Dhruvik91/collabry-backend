import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKCCoinsAndReferralSystem1776498014937 implements MigrationInterface {
    name = 'AddKCCoinsAndReferralSystem1776498014937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "balance" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_2ecdb33f23e9a6fc392025c0b9" UNIQUE ("userId"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2ecdb33f23e9a6fc392025c0b9" ON "wallets" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_type_enum" AS ENUM('CREDIT', 'DEBIT')`);
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_purpose_enum" AS ENUM('AUCTION_CREATION', 'COLLABORATION_CREATION', 'BID_PLACEMENT', 'DAILY_ALLOWANCE', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'SYSTEM_ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "kc_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(12,2) NOT NULL, "type" "public"."kc_transactions_type_enum" NOT NULL, "purpose" "public"."kc_transactions_purpose_enum" NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "walletId" uuid, CONSTRAINT "PK_2c546920f559abff86d755aa9d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa77124d5d475160d1a54f869b" ON "kc_transactions" ("walletId") `);
        await queryRunner.query(`CREATE TABLE "kc_settings" ("key" character varying NOT NULL, "value" numeric(12,2) NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cff1f0db39784b6af86d9669dd8" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rewarded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "referrerId" uuid, "referredId" uuid, CONSTRAINT "REL_ad6772c3fcb57375f43114b5cb" UNIQUE ("referredId"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59de462f9ce130da142e3b5a9f" ON "referrals" ("referrerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad6772c3fcb57375f43114b5cb" ON "referrals" ("referredId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "referralCode" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899" UNIQUE ("referralCode")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referredBy" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_b7f8278f4e89249bb75c9a1589" ON "users" ("referralCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3998945517e0cac384f573b3c" ON "users" ("referredBy") `);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" ADD CONSTRAINT "FK_fa77124d5d475160d1a54f869ba" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4"`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" DROP CONSTRAINT "FK_fa77124d5d475160d1a54f869ba"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3998945517e0cac384f573b3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7f8278f4e89249bb75c9a1589"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referredBy"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referralCode"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad6772c3fcb57375f43114b5cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59de462f9ce130da142e3b5a9f"`);
        await queryRunner.query(`DROP TABLE "referrals"`);
        await queryRunner.query(`DROP TABLE "kc_settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa77124d5d475160d1a54f869b"`);
        await queryRunner.query(`DROP TABLE "kc_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_purpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ecdb33f23e9a6fc392025c0b9"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
    }

}
