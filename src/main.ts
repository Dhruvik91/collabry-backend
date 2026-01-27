import { NestFactory, Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { FailureResponseTransformer } from './core/exception-filters/failure-exception';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SuccessResponseTransformer } from './core/interceptor/success-response-interceptor';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './modules/auth/Guards/jwt-guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = config.get<string>('CORS_ORIGIN');
      if (!allowed) {
        callback(null, true);
        return;
      }
      const list = allowed.split(',').map((o) => o.trim());
      if (!origin || list.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.use(cookieParser());
  app.useGlobalFilters(new FailureResponseTransformer());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new SuccessResponseTransformer(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kollabary API')
    .setDescription('API documentation for the Kollabary backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const PORT = config.get<number>('PORT');

  await app.listen(PORT);
}
bootstrap();
