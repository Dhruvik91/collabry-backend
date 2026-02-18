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
    PAID_SHOUTOUT = 'PAID_SHOUTOUT',
    AFFILIATE = 'AFFILIATE',
    GIFTING = 'GIFTING',
    LONG_TERM = 'LONG_TERM',
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
