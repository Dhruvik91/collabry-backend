import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFullNameToInfluencerProfile1771483426027 implements MigrationInterface {
    name = 'AddFullNameToInfluencerProfile1771483426027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "fullName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "fullName"`);
    }

}
