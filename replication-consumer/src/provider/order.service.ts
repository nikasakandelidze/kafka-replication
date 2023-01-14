import { OrderCreatedDto } from 'src/controller/dto/order.dto';
import { Logger, Injectable } from '@nestjs/common';
import { MessageConsumer } from './message.consumer';
import { KafkaService } from './kafka.service';
import { MessageTopics } from 'src/common/message.topics';
import { Order } from 'src/repository/entity/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderCreationService implements MessageConsumer {
  constructor(
    private readonly kafkaService: KafkaService,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
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
      await this.orderRepository.save(newOrder);
      return;
    } catch (e) {
      Logger.warn(e.message);
    }
  }
}
