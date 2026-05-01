import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPitchModule1777625776567 implements MigrationInterface {
    name = 'AddPitchModule1777625776567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."pitches_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "pitches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" text NOT NULL, "status" "public"."pitches_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "influencerId" uuid, "targetId" uuid, CONSTRAINT "PK_c0ab1fa10a5750d17b935c60854" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b09ac0d871fab16e7100a3589" ON "pitches" ("influencerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dbd2e5c99b1450b76e8ba30866" ON "pitches" ("targetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_06fe12302c2573974b17490217" ON "pitches" ("status") `);
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum" RENAME TO "kc_transactions_purpose_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_purpose_enum" AS ENUM('AUCTION_CREATION', 'COLLABORATION_CREATION', 'BID_PLACEMENT', 'WEEKLY_REWARD', 'NEW_ARRIVAL_BONUS', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'SYSTEM_ADJUSTMENT', 'KCOIN_TOPUP', 'PITCH_CREATION')`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" ALTER COLUMN "purpose" TYPE "public"."kc_transactions_purpose_enum" USING "purpose"::"text"::"public"."kc_transactions_purpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_purpose_enum_old"`);
        await queryRunner.query(`ALTER TABLE "pitches" ADD CONSTRAINT "FK_0b09ac0d871fab16e7100a35899" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pitches" ADD CONSTRAINT "FK_dbd2e5c99b1450b76e8ba308662" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pitches" DROP CONSTRAINT "FK_dbd2e5c99b1450b76e8ba308662"`);
        await queryRunner.query(`ALTER TABLE "pitches" DROP CONSTRAINT "FK_0b09ac0d871fab16e7100a35899"`);
        await queryRunner.query(`CREATE TYPE "public"."kc_transactions_purpose_enum_old" AS ENUM('AUCTION_CREATION', 'COLLABORATION_CREATION', 'BID_PLACEMENT', 'WEEKLY_REWARD', 'NEW_ARRIVAL_BONUS', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'SYSTEM_ADJUSTMENT', 'KCOIN_TOPUP')`);
        await queryRunner.query(`ALTER TABLE "kc_transactions" ALTER COLUMN "purpose" TYPE "public"."kc_transactions_purpose_enum_old" USING "purpose"::"text"::"public"."kc_transactions_purpose_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."kc_transactions_purpose_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."kc_transactions_purpose_enum_old" RENAME TO "kc_transactions_purpose_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06fe12302c2573974b17490217"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbd2e5c99b1450b76e8ba30866"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b09ac0d871fab16e7100a3589"`);
        await queryRunner.query(`DROP TABLE "pitches"`);
        await queryRunner.query(`DROP TYPE "public"."pitches_status_enum"`);
    }

}
