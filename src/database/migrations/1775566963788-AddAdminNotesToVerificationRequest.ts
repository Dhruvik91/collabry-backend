import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminNotesToVerificationRequest1775566963788 implements MigrationInterface {
    name = 'AddAdminNotesToVerificationRequest1775566963788'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_requests" ADD "adminNotes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_requests" DROP COLUMN "adminNotes"`);
    }

}
