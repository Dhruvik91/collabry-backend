import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('kc_settings')
export class KCSetting {
    @ApiProperty()
    @PrimaryColumn()
    key: string;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    value: number;

    @UpdateDateColumn()
    updatedAt: Date;
}
