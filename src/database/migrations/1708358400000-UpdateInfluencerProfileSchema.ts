import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInfluencerProfileSchema1708358400000 implements MigrationInterface {
    name = 'UpdateInfluencerProfileSchema1708358400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns: avatarUrl, bio, address
        await queryRunner.query(`
            ALTER TABLE "influencer_profiles" 
            ADD COLUMN IF NOT EXISTS "avatarUrl" text,
            ADD COLUMN IF NOT EXISTS "bio" text,
            ADD COLUMN IF NOT EXISTS "address" character varying
        `);

        // Remove old columns: followersCount, engagementRate
        await queryRunner.query(`
            ALTER TABLE "influencer_profiles" 
            DROP COLUMN IF EXISTS "followersCount",
            DROP COLUMN IF EXISTS "engagementRate"
        `);

        // Update platforms column comment to reflect new structure
        await queryRunner.query(`
            COMMENT ON COLUMN "influencer_profiles"."platforms" IS 'Platform data with handle, followers, and engagementRate per platform'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore old columns
        await queryRunner.query(`
            ALTER TABLE "influencer_profiles" 
            ADD COLUMN IF NOT EXISTS "followersCount" bigint DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "engagementRate" numeric(5,2)
        `);

        // Remove new columns
        await queryRunner.query(`
            ALTER TABLE "influencer_profiles" 
            DROP COLUMN IF EXISTS "avatarUrl",
            DROP COLUMN IF EXISTS "bio",
            DROP COLUMN IF EXISTS "address"
        `);
    }
}
