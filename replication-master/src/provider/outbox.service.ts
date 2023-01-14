import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Outbox } from 'src/repository/entity/outbox.entity';
import { Repository } from 'typeorm';
import { KafkaService } from './kafka.service';

@Injectable()
export class OutboxRelayService {
  constructor(
    @InjectRepository(Outbox) private outboxRepository: Repository<Outbox>,
    private readonly kafkaService: KafkaService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async relayOutboxMessages() {
    Logger.log(
      'Starting next cycle of sending replication messages from outbox relay',
    );
    try {
      const messages: Outbox[] = await this.outboxRepository.find({
        where: { sent: false },
      });
      Logger.log(`Number of messages in current batch: ${messages.length}`);
      await Promise.all(
        messages.map(async (message) => {
          const payload = JSON.stringify(message);
          Logger.log(`Outbox message payload: ${payload}`);
          const result = await this.kafkaService.emitMessage(
            payload,
            message.topic,
          );
          if (result) {
            message.sent = true;
            await this.outboxRepository.save(message);
          }
          return result;
        }),
      );
    } catch (err) {
      Logger.warn(`Error in outbox relay service: ${err.message}`);
    }
  }
}
