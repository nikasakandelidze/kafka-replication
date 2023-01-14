import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MessageTopics } from 'src/common/message.topic';
import { OrderDto } from 'src/controller/dto/order.dto';
import { Order } from 'src/repository/entity/order.entity';
import { Outbox } from 'src/repository/entity/outbox.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(private dataSource: DataSource) {}

  async addNewOrder(order: OrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newOrder: Order = new Order();
      newOrder.authorName = order.authorName;
      newOrder.details = order.details;
      newOrder.numberOfItems = order.numberOfItems;
      newOrder.price = order.price;
      newOrder.title = order.title;
      const orderResult = await queryRunner.manager.save(newOrder);
      const outboxMessage: Outbox = new Outbox();
      outboxMessage.payload = newOrder;
      outboxMessage.topic = MessageTopics.NEW_ORDER_CREATED;
      const outboxResult = await queryRunner.manager.save(outboxMessage);
      await queryRunner.commitTransaction();
      return { handleId: outboxResult.id, order: orderResult };
    } catch (e) {
      Logger.warn(e);
      await queryRunner.rollbackTransaction();
      throw new ServiceUnavailableException({ message: e.message });
    } finally {
      await queryRunner.release();
    }
  }
}
