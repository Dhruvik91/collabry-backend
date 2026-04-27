import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandVerificationAndAccountLifecycle1777272448761 implements MigrationInterface {
    name = 'ExpandVerificationAndAccountLifecycle1777272448761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add verified column to profiles
        await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false`);

        // 2. Prepare verification_requests for universal user verification
        await queryRunner.query(`ALTER TABLE "verification_requests" ADD COLUMN "tempUserId" uuid`);
        
        // 3. Data Migration: Map existing requests from influencerProfileId to userId
        await queryRunner.query(`
            UPDATE "verification_requests" vr
            SET "tempUserId" = ip."userId"
            FROM "influencer_profiles" ip
            WHERE vr."influencerProfileId" = ip.id
        `);

        // 4. Clean up old relation
        await queryRunner.query(`ALTER TABLE "verification_requests" DROP CONSTRAINT IF EXISTS "FK_ea03d602e8222111bb28715c377"`);
        await queryRunner.query(`ALTER TABLE "verification_requests" DROP COLUMN "influencerProfileId"`);
        
        // 5. Finalize new relation
        await queryRunner.query(`ALTER TABLE "verification_requests" RENAME COLUMN "tempUserId" TO "userId"`);
        await queryRunner.query(`ALTER TABLE "verification_requests" ADD CONSTRAINT "FK_5aeaa2dd850bc2ca311c793716d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_requests" DROP CONSTRAINT "FK_5aeaa2dd850bc2ca311c793716d"`);
        await queryRunner.query(`ALTER TABLE "verification_requests" RENAME COLUMN "userId" TO "influencerProfileId"`);
        await queryRunner.query(`ALTER TABLE "verification_requests" ADD CONSTRAINT "FK_ea03d602e8222111bb28715c377" FOREIGN KEY ("influencerProfileId") REFERENCES "influencer_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "verified"`);
    }

}
