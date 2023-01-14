import { ConfigService } from '@nestjs/config';

const getBrokers = (configService: ConfigService) => {
  const brokersResult = [];
  const brokerCount: number = configService.get<number>('KAFKA_BROKER_COUNT');
  for (let i = 1; i <= brokerCount; i++) {
    brokersResult.push(configService.get<string>(`KAFKA_BROKER_${i}`));
  }
  return brokersResult;
};

export const setupKafkaConfig = (configService: ConfigService) => {
  return {
    // transport: Transport.KAFKA,
    // options: {
    // client: {
    clientId: configService.get<string>('KAFKA_CLIENT_ID'),
    brokers: getBrokers(configService),
    ssl: false,
    // },
    // },
  };
};
