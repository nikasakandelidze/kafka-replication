import { OrderCreatedDto } from 'src/controller/dto/order.dto';
import { Logger, Injectable } from '@nestjs/common';
import { MessageConsumer } from './message.consumer';
import { KafkaService } from './kafka.service';
import { MessageTopics } from 'src/common/message.topics';
import { Order } from 'src/repository/entity/order.entity';
import { DataSource } from 'typeorm';
import { ConsumedEvent } from 'src/repository/entity/events.entity';

@Injectable()
export class OrderCreationService implements MessageConsumer {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly dataSource: DataSource,
  ) {
    this.kafkaService.registerMessageConsumer(
      this,
      MessageTopics.NEW_ORDER_CREATED,
    );
  }

  async processOrderCreated(orderCreated: OrderCreatedDto) {
    Logger.log(orderCreated);
  }

  async consume(message: string): Promise<void> {
    try {
      Logger.log(`Received order replication message: ${message}`);
      const orderCreatedEvent: OrderCreatedDto = JSON.parse(message);
      const newOrder: Order = orderCreatedEvent.payload;
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const processedEvent = await queryRunner.manager.findOne(
          ConsumedEvent,
          {
            where: { id: orderCreatedEvent.id },
          },
        );
        if (!processedEvent) {
          const order = new Order();
          order.id = newOrder.id;
          order.authorName = newOrder.authorName;
          order.createdAt = newOrder.createdAt;
          order.details = newOrder.details;
          order.numberOfItems = newOrder.numberOfItems;
          order.price = newOrder.price;
          order.title = newOrder.title;
          order.updatedAt = newOrder.updatedAt;
          await queryRunner.manager.save(order);
          const event = new ConsumedEvent();
          event.createdAt = orderCreatedEvent.createdAt;
          event.id = orderCreatedEvent.id;
          event.payload = orderCreatedEvent.payload;
          event.topic = orderCreatedEvent.topic;
          await queryRunner.manager.save(event);
        } else {
          Logger.log(
            `Event with id:${orderCreatedEvent.id} was already processed`,
          );
        }
        await queryRunner.commitTransaction();
      } catch (e) {
        Logger.warn(e);
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    } catch (e) {
      Logger.warn(e.message);
    }
  }
}
