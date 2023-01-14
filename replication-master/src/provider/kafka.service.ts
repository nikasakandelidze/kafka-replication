import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Partitioners, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnApplicationShutdown {
  private producer: Producer;
  _isconnected = false;
  constructor(@Inject('KAFKA_CLIENT') private readonly kafkaClient: Kafka) {}

  async setup() {
    this.producer = this.kafkaClient.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
    });
    await this.producer.connect();
    this.setupTeardownListeners();
    this._isconnected = true;
  }

  async onApplicationShutdown() {
    await this.teardown();
  }

  async emitMessage(message: string, topic: string) {
    const result = await this.producer.send({
      topic: topic,
      messages: [{ value: message }],
    });
    return result;
  }

  private async teardown() {
    await this.producer.disconnect();
    this._isconnected = false;
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
}
