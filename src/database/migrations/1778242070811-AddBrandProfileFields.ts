import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBrandProfileFields1778242070811 implements MigrationInterface {
    name = 'AddBrandProfileFields1778242070811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" ADD "categories" text array`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "website" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "industry" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "companySize" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "brandTone" text`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "contactEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "contactPhone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "contactPhone"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "contactEmail"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "brandTone"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "companySize"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "industry"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "website"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "categories"`);
    }

}
