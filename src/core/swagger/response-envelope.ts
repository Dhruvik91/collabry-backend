import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";

export class PaginationMetaDataDto {
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  limit: number;
  @ApiProperty()
  totalPages: number;
}

export class MetaDataDto {
  @ApiProperty({ type: PaginationMetaDataDto, nullable: true })
  pagination?: PaginationMetaDataDto;
}

export class ResponseEnvelope<TData = any> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  isError: boolean;

  @ApiProperty({ type: [String] })
  message: string[];

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  metaData: MetaDataDto;

  // TData is overridden per-endpoint in Swagger schema using getSchemaPath
  @ApiProperty({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: TData;
}

export class EmptyResponseDto {}

export const ApiOkResponseEnvelope = <TModel extends Type<unknown>>(
  model: TModel,
  isArray = false,
) =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseEnvelope) },
          {
            properties: {
              data: isArray
                ? { type: "array", items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

export const ApiCreatedResponseEnvelope = <TModel extends Type<unknown>>(
  model: TModel,
  isArray = false,
) =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope, model),
    ApiCreatedResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseEnvelope) },
          {
            properties: {
              data: isArray
                ? { type: "array", items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

export const ApiBadRequestResponseEnvelope = (description = "Bad Request") =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope),
    ApiBadRequestResponse({
      description,
      schema: { $ref: getSchemaPath(ResponseEnvelope) },
    }),
  );

export const ApiUnauthorizedResponseEnvelope = (description = "Unauthorized") =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope),
    ApiUnauthorizedResponse({
      description,
      schema: { $ref: getSchemaPath(ResponseEnvelope) },
    }),
  );

export const ApiForbiddenResponseEnvelope = (description = "Forbidden") =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope),
    ApiForbiddenResponse({
      description,
      schema: { $ref: getSchemaPath(ResponseEnvelope) },
    }),
  );

export const ApiNotFoundResponseEnvelope = (description = "Not Found") =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope),
    ApiNotFoundResponse({
      description,
      schema: { $ref: getSchemaPath(ResponseEnvelope) },
    }),
  );

export const ApiConflictResponseEnvelope = (description = "Conflict") =>
  applyDecorators(
    ApiExtraModels(ResponseEnvelope),
    ApiConflictResponse({
      description,
      schema: { $ref: getSchemaPath(ResponseEnvelope) },
    }),
  );
