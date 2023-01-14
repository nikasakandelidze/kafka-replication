import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ConsumedEvent {
  @PrimaryColumn()
  id: string;

  @Column()
  topic: string;

  @Column()
  createdAt: string;

  @Column()
  payload: string;
}
