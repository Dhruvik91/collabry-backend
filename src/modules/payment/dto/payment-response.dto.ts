import { ApiProperty } from '@nestjs/swagger';
import { PaymentOrder } from '../../../database/entities/payment-order.entity';

export class VerifyPaymentResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty({ type: PaymentOrder })
    order: PaymentOrder;
}

export class SyncOrderResponseDto {
    @ApiProperty()
    message: string;

    @ApiProperty({ type: PaymentOrder })
    order: PaymentOrder;
}
