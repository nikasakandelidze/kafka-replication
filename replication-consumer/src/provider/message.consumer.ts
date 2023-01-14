export interface MessageConsumer {
  consume(message: string): Promise<void>;
}
