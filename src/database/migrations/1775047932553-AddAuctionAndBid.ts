import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuctionAndBid1775047932553 implements MigrationInterface {
    name = 'AddAuctionAndBid1775047932553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bids_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "bids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "proposal" text NOT NULL, "status" "public"."bids_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "auctionId" uuid, "influencerId" uuid, CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6d6b20987ed2f61e8801398f8d" ON "bids" ("auctionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_27ac794ee92f3b7cdd574e42c2" ON "bids" ("influencerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_203fecbe7e6e79182d64c11971" ON "bids" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."auctions_status_enum" AS ENUM('OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TYPE "public"."auctions_category_enum" AS ENUM('SPONSORED_POST', 'SPONSORED_VIDEO', 'UGC_CONTENT', 'GIVEAWAY', 'BRAND_AMBASSADOR', 'AFFILIATE_PARTNERSHIP', 'PRODUCT_PLACEMENT', 'LIVE_SESSION', 'EVENT_COVERAGE', 'REVENUE_SHARE')`);
        await queryRunner.query(`CREATE TABLE "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "minBudget" numeric(10,2), "maxBudget" numeric(10,2), "deadline" TIMESTAMP NOT NULL, "status" "public"."auctions_status_enum" NOT NULL DEFAULT 'OPEN', "category" "public"."auctions_category_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "creatorId" uuid, CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fb8b133ab3e0a013ca99505f43" ON "auctions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_225a167d47c9e707de2c755d38" ON "auctions" ("creatorId") `);
        await queryRunner.query(`COMMENT ON COLUMN "influencer_profiles"."platforms" IS NULL`);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_6d6b20987ed2f61e8801398f8d1" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_27ac794ee92f3b7cdd574e42c22" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_225a167d47c9e707de2c755d382" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_225a167d47c9e707de2c755d382"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_27ac794ee92f3b7cdd574e42c22"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_6d6b20987ed2f61e8801398f8d1"`);
        await queryRunner.query(`COMMENT ON COLUMN "influencer_profiles"."platforms" IS 'Platform data with handle, followers, and engagementRate per platform'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_225a167d47c9e707de2c755d38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb8b133ab3e0a013ca99505f43"`);
        await queryRunner.query(`DROP TABLE "auctions"`);
        await queryRunner.query(`DROP TYPE "public"."auctions_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."auctions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_203fecbe7e6e79182d64c11971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27ac794ee92f3b7cdd574e42c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d6b20987ed2f61e8801398f8d"`);
        await queryRunner.query(`DROP TABLE "bids"`);
        await queryRunner.query(`DROP TYPE "public"."bids_status_enum"`);
    }

}
