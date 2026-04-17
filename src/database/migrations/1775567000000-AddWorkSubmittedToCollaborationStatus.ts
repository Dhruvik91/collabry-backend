import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkSubmittedToCollaborationStatus1775567000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "collaborations_status_enum" ADD VALUE 'WORK_SUBMITTED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from enums without recreating the type.
        // Given that this is a simple addition, we leave it in the down migration.
    }
}
