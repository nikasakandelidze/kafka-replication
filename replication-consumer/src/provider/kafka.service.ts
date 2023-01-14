import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { MessageTopics } from 'src/common/message.topics';
import { MessageConsumer } from './message.consumer';

@Injectable()
export class KafkaService implements OnApplicationShutdown {
  private consumer: Consumer;
  _isconnected = false;
  private topics: Array<string> = [MessageTopics.NEW_ORDER_CREATED];
  private messageConsumers: Record<string, MessageConsumer[]> = {};

  constructor(@Inject('KAFKA_CLIENT') private readonly kafkaClient: Kafka) {}

  async setup(groupId: string) {
    this.consumer = this.kafkaClient.consumer({ groupId: groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics, fromBeginning: true });
    await this.run();
    this.setupTeardownListeners();
    this._isconnected = true;
  }

  async onApplicationShutdown() {
    await this.teardown();
  }

  registerMessageConsumer(messageConsumer: MessageConsumer, topic: string) {
    const consumers = this.messageConsumers[topic];
    if (!consumers) {
      this.messageConsumers[topic] = [];
    }
    this.messageConsumers[topic].push(messageConsumer);
  }

  async run() {
    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
        heartbeat,
        pause,
      }: EachMessagePayload) => {
        const consumers: MessageConsumer[] = this.messageConsumers[topic];
        consumers.forEach((consumer) => {
          consumer.consume(message.value.toString());
        });
      },
    });
  }

  private setupTeardownListeners() {
    const errorTypes = ['unhandledRejection', 'uncaughtException'];
    const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    errorTypes.forEach((type) => {
      process.on(type, async () => {
        try {
          await this.teardown();
          process.exit(0);
        } catch (_) {
          process.exit(1);
        }
      });
    });

    signalTraps.forEach((type) => {
      process.once(type, async () => {
        try {
          await this.teardown();
        } finally {
          process.kill(process.pid, type);
        }
      });
    });
  }

  private async teardown() {
    await this.consumer.disconnect();
    this._isconnected = false;
  }
}
