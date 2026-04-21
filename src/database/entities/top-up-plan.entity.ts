import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('top_up_plans')
export class TopUpPlan {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ApiProperty()
    @Column({ type: 'int' })
    coins: number;

    @ApiProperty()
    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
