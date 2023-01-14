import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kafka } from 'kafkajs';
import { setupKafkaConfig } from './config/kafka.config';
import { OrderController } from './controller/order.controller';
import { KafkaService } from './provider/kafka.service';
import { OrderService } from './provider/order.service';
import { OutboxRelayService } from './provider/outbox.service';
import { TypeOrmConfigService } from './repository/config';
import { Order } from './repository/entity/order.entity';
import { Outbox } from './repository/entity/outbox.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Outbox, Order]),
    ScheduleModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: 'KAFKA_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Kafka(setupKafkaConfig(configService));
      },
      inject: [ConfigService],
    },
    KafkaService,
    OutboxRelayService,
  ],
})
export class AppModule {}
