import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './provider/kafka.service';
import { Logger } from '@nestjs/common';

const PORT = 3444;
const CONSUMER_GROUP_ID = 'KAFKA_ORDER_CONSUMER_GROUP';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const port = config.get('PORT') || PORT;
  const kafkaGroupId =
    config.get<string>('KAFKA_CONSUMER_GROUP_ID') || CONSUMER_GROUP_ID;
  app.enableShutdownHooks();
  const kafkaService = app.get(KafkaService);
  await kafkaService.setup(kafkaGroupId);
  await app.listen(port);
  Logger.log(`Application started on port: ${port}`);
}
bootstrap();
