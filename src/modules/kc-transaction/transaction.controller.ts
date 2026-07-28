import { Controller, Get, UseGuards, Query, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { TransactionService } from "./transaction.service";
import {
  UserRole,
  TransactionType,
  TransactionPurpose,
} from "../../database/entities/enums";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { KCTransaction } from "../../database/entities/kc-transaction.entity";

@ApiTags("KC Coins")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/kc-transactions")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get("my")
  @ApiOperation({ summary: "Get my KC coin transaction history" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "type", required: false, enum: TransactionType })
  @ApiQuery({ name: "purpose", required: false, enum: TransactionPurpose })
  @ApiOkResponseEnvelope(KCTransaction, true)
  @ApiUnauthorizedResponseEnvelope()
  async getMyHistory(
    @Req() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("type") type?: TransactionType,
    @Query("purpose") purpose?: TransactionPurpose,
  ) {
    return await this.transactionService.getHistory(
      req.user.id,
      page,
      limit,
      type,
      purpose,
    );
  }

  @Get("all")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all system KC coin transactions (Admin only)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "type", required: false, enum: TransactionType })
  @ApiQuery({ name: "purpose", required: false, enum: TransactionPurpose })
  @ApiOkResponseEnvelope(KCTransaction, true)
  @ApiUnauthorizedResponseEnvelope()
  async getAllTransactions(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("type") type?: TransactionType,
    @Query("purpose") purpose?: TransactionPurpose,
  ) {
    return await this.transactionService.getAllTransactions(
      page,
      limit,
      type,
      purpose,
    );
  }
}
