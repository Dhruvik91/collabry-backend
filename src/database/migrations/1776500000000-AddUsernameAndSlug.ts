import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameAndSlug1776500000000 implements MigrationInterface {
    name = 'AddUsernameAndSlug1776500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add username to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username")`);
        
        // Add slug to influencer_profiles table
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "slug" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_influencer_profiles_slug" ON "influencer_profiles" ("slug")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_influencer_profiles_slug"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_username"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }
}
