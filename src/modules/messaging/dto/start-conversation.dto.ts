import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartConversationDto {
    @ApiProperty({ example: 'uuid-of-recipient' })
    @IsNotEmpty()
    @IsUUID()
    recipientId: string;
}
