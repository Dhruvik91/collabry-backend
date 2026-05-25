import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

class SubscriptionKeysDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    p256dh: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    auth: string;
}

export class SubscribeDto {
    @ApiProperty({ example: 'https://fcm.googleapis.com/fcm/send/...' })
    @IsNotEmpty()
    @IsString()
    endpoint: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    expirationTime?: number | null;

    @ApiProperty({ type: SubscriptionKeysDto })
    @IsNotEmpty()
    @IsObject()
    keys: SubscriptionKeysDto;
}

export class UnsubscribeDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    endpoint: string;
}
