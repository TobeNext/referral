import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

async function bootstrap(): Promise<void> {
  positiveInteger('REFERRAL_REWARD_CREDITS', 100);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  const config = new DocumentBuilder().setTitle('Referral Demo API').setVersion('1.0.0').build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  Logger.log(JSON.stringify({ event: 'app.started', port, environment: process.env.NODE_ENV || 'development' }), 'Bootstrap');
}
void bootstrap();
