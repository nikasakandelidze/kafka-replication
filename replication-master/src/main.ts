import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { KafkaService } from './provider/kafka.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const port = config.get('PORT');
  app.useGlobalPipes(new ValidationPipe());
  const kafkaService = app.get(KafkaService);
  await kafkaService.setup();
  app.enableShutdownHooks();
  await app.listen(port);
  Logger.log(`Application started on port: ${port}`);
}
bootstrap();
