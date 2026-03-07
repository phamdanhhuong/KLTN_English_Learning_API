import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: [
      'https://app.vocaburex.io.vn',    // Cho phép User App
      'https://admin.vocaburex.io.vn',  // Cho phép Admin Panel
      'http://localhost:4000',          // Cho phép chạy local test
      'http://localhost:4200',          // Cho phép chạy local admin test
      'http://localhost:3000',          // Flutter web dev server
      'http://localhost:8080',          // Flutter web alternative port
      'http://127.0.0.1:3000',          // Flutter web localhost
      'http://127.0.0.1:8080',          // Flutter web localhost alternative
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Quan trọng nếu bạn dùng Cookie/Session
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/`);
}
bootstrap();
