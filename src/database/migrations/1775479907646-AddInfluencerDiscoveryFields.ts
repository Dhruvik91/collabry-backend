import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInfluencerDiscoveryFields1775479907646 implements MigrationInterface {
    name = 'AddInfluencerDiscoveryFields1775479907646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "categories" text array`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "locationCountry" character varying`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "locationCity" character varying`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "gender" character varying`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "languages" text array`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "totalFollowers" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "avgEngagementRate" numeric(5,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "audienceGenderRatio" jsonb`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "audienceAgeBrackets" jsonb`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "audienceTopCountries" text array`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "minPrice" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "maxPrice" numeric(12,2)`);
        await queryRunner.query(`CREATE INDEX "IDX_7210d4ad1d7b6bd637dedd12b6" ON "influencer_profiles" ("totalFollowers") `);
        await queryRunner.query(`CREATE INDEX "IDX_590bb56ef9b72390c609d3cdb0" ON "influencer_profiles" ("avgEngagementRate") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_590bb56ef9b72390c609d3cdb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7210d4ad1d7b6bd637dedd12b6"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "maxPrice"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "minPrice"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "audienceTopCountries"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "audienceAgeBrackets"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "audienceGenderRatio"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "avgEngagementRate"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "totalFollowers"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "languages"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "gender"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "locationCity"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "locationCountry"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "categories"`);
    }

}
