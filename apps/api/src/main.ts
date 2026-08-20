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

function validateSecurityConfig(): void {
  const demoPassword = process.env.DEMO_INVITER_PASSWORD || 'AliceDemo1234';
  if (demoPassword.length < 10 || demoPassword.length > 72 || !/[A-Za-z]/.test(demoPassword) || !/\d/.test(demoPassword)) {
    throw new Error('DEMO_INVITER_PASSWORD must be 10-72 characters and contain letters and numbers');
  }
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }
}

async function bootstrap(): Promise<void> {
  positiveInteger('REFERRAL_REWARD_CREDITS', 100);
  validateSecurityConfig();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  const config = new DocumentBuilder().setTitle('Referral Demo API').setVersion('2.0.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  Logger.log(JSON.stringify({ event: 'app.started', port, environment: process.env.NODE_ENV || 'development' }), 'Bootstrap');
}
void bootstrap();
