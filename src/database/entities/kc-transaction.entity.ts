import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Wallet } from './wallet.entity';
import { TransactionType, TransactionPurpose } from './enums';

@Entity('kc_transactions')
export class KCTransaction {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Wallet)
    @Index()
    wallet: Wallet;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @ApiProperty({ enum: TransactionType })
    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @ApiProperty({ enum: TransactionPurpose })
    @Column({
        type: 'enum',
        enum: TransactionPurpose,
    })
    purpose: TransactionPurpose;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
