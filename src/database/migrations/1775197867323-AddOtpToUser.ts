import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpToUser1775197867323 implements MigrationInterface {
    name = 'AddOtpToUser1775197867323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "otp" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpExpires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpExpires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otp"`);
    }

}
