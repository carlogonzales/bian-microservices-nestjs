import { ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/domain-exception.filter';

async function bootstrap() {
  const logLevel: LogLevel[] = [
    'log',
    'error',
    ...(process.env.NODE_ENV === 'prod'
      ? []
      : (['warn', 'debug', 'verbose'] as const)),
  ];
  const app = await NestFactory.create(AppModule, {
    logger: logLevel,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true, // throws if extra fields sent
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
