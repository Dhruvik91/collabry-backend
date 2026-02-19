export enum UserRole {
    USER = 'USER',
    INFLUENCER = 'INFLUENCER',
    ADMIN = 'ADMIN',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
}

export enum CollaborationStatus {
    REQUESTED = 'REQUESTED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum CollaborationType {
    SPONSORED_POST = 'SPONSORED_POST',
    SPONSORED_VIDEO = 'SPONSORED_VIDEO',
    UGC_CONTENT = 'UGC_CONTENT',
    GIVEAWAY = 'GIVEAWAY',
    BRAND_AMBASSADOR = 'BRAND_AMBASSADOR',
    AFFILIATE_PARTNERSHIP = 'AFFILIATE_PARTNERSHIP',
    PRODUCT_PLACEMENT = 'PRODUCT_PLACEMENT',
    LIVE_SESSION = 'LIVE_SESSION',
    EVENT_COVERAGE = 'EVENT_COVERAGE',
    REVENUE_SHARE = 'REVENUE_SHARE',
}

export enum AvailabilityStatus {
    OPEN = 'OPEN',
    BUSY = 'BUSY',
    CLOSED = 'CLOSED',
}

export enum VerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum SubscriptionTier {
    FREE = 'FREE',
    PRO = 'PRO',
    ELITE = 'ELITE',
}

export enum ReviewStatus {
    VISIBLE = 'VISIBLE',
    HIDDEN = 'HIDDEN',
    FLAGGED = 'FLAGGED',
}

export enum ReportStatus {
    OPEN = 'OPEN',
    UNDER_REVIEW = 'UNDER_REVIEW',
    RESOLVED = 'RESOLVED',
}
