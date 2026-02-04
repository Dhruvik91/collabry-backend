import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, DeleteDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from './enums';
import { InfluencerProfile } from './influencer-profile.entity';
import { Profile } from './profile.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column({ nullable: true, select: false })
    passwordHash: string;

    @ApiProperty({ enum: UserRole })
    @Index()
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @ApiProperty({ enum: UserStatus })
    @Index()
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
