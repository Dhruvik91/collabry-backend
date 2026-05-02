import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkUrlToPitch1777632031575 implements MigrationInterface {
    name = 'AddWorkUrlToPitch1777632031575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pitches" ADD "workUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pitches" DROP COLUMN "workUrl"`);
    }

}
