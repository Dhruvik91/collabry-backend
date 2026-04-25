import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInactiveToUserStatusManual1777100266886 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // We use a try-catch to handle cases where the value might have been added manually
        // or the migration is being re-run.
        try {
            await queryRunner.query(`ALTER TYPE "public"."users_status_enum" ADD VALUE 'INACTIVE'`);
        } catch (error) {
            // PostgreSQL error code 42710 is for duplicate_object (already exists)
            if (error.code !== '42710') {
                throw error;
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Removing a value from an enum in PostgreSQL requires recreating the type
        await queryRunner.query(`ALTER TYPE "public"."users_status_enum" RENAME TO "users_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum_old"`);
    }

}
