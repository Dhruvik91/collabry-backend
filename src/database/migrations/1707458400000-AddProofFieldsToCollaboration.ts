import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProofFieldsToCollaboration1707458400000 implements MigrationInterface {
    name = 'AddProofFieldsToCollaboration1707458400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add proofUrls column (text array)
        await queryRunner.addColumn(
            'collaborations',
            new TableColumn({
                name: 'proofUrls',
                type: 'text',
                isArray: true,
                isNullable: true,
                default: null,
            })
        );

        // Add proofSubmittedAt column
        await queryRunner.addColumn(
            'collaborations',
            new TableColumn({
                name: 'proofSubmittedAt',
                type: 'timestamp',
                isNullable: true,
                default: null,
            })
        );

        // Add proofVerifiedAt column
        await queryRunner.addColumn(
            'collaborations',
            new TableColumn({
                name: 'proofVerifiedAt',
                type: 'timestamp',
                isNullable: true,
                default: null,
            })
        );

        // Add proofVerifiedBy column (admin who verified)
        await queryRunner.addColumn(
            'collaborations',
            new TableColumn({
                name: 'proofVerifiedBy',
                type: 'uuid',
                isNullable: true,
                default: null,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('collaborations', 'proofVerifiedBy');
        await queryRunner.dropColumn('collaborations', 'proofVerifiedAt');
        await queryRunner.dropColumn('collaborations', 'proofSubmittedAt');
        await queryRunner.dropColumn('collaborations', 'proofUrls');
    }
}
