import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, DeleteDateColumn } from 'typeorm';
import { UserRole, UserStatus } from './enums';
import { InfluencerProfile } from './influencer-profile.entity';
import { Profile } from './profile.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column({ nullable: true, select: false })
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @Column({ default: false })
    emailVerified: boolean;

    @Exclude()
    @Column({ nullable: true, select: false })
    passwordResetToken: string;

    @Column({ nullable: true })
    passwordResetExpires: Date;

    @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
    profile: Profile;

    @OneToOne(() => InfluencerProfile, (profile) => profile.user)
    influencerProfile: InfluencerProfile;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
