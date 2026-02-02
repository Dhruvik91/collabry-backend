import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateVerificationRequestDto {
    @ApiProperty({ example: { idProof: 'url-to-id-proof', socialScreenshot: 'url-to-screenshot' } })
    @IsNotEmpty()
    @IsObject()
    documents: any;
}
