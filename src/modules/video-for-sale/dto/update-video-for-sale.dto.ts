import { PartialType } from "@nestjs/swagger";
import { CreateVideoForSaleDto } from "./create-video-for-sale.dto";

export class UpdateVideoForSaleDto extends PartialType(CreateVideoForSaleDto) {}
