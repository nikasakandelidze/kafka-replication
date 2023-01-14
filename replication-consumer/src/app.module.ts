import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kafka } from 'kafkajs';
import { TypeOrmConfigService } from './repository/database.config';
import { setupKafkaConfig } from './config/kafka.config';
import { KafkaService } from './provider/kafka.service';
import { OrderCreationService } from './provider/order.service';
import { Order } from './repository/entity/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Order]),
  ],
  controllers: [],
  providers: [
    OrderCreationService,
    {
      provide: 'KAFKA_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Kafka(setupKafkaConfig(configService));
      },
      inject: [ConfigService],
    },
    KafkaService,
  ],
})
export class AppModule {}
