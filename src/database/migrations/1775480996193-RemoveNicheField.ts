import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNicheField1775480996193 implements MigrationInterface {
    name = 'RemoveNicheField1775480996193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6e6b749a17002296382b30aa67"`);
        await queryRunner.query(`ALTER TABLE "influencer_profiles" DROP COLUMN "niche"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "influencer_profiles" ADD "niche" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_6e6b749a17002296382b30aa67" ON "influencer_profiles" ("niche") `);
    }

}
