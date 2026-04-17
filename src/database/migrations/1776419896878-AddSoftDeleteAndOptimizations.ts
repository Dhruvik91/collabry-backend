import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteAndOptimizations1776419896878 implements MigrationInterface {
    name = 'AddSoftDeleteAndOptimizations1776419896878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "collaborations" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "bids" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "verification_requests" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_requests" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "collaborations" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "deletedAt"`);
    }

}
