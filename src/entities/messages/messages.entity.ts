// message.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ParticipantEntity } from '../participant/participant.entity';
import { ChatEntity } from '../chat/chat.entity';

@Entity('messages', {
  orderBy: {
    createdAt: 'ASC',
  },
})
@Index(['chat', 'platformMessageId'], { unique: true })
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformMessageId: string;

  @ManyToOne(() => ParticipantEntity, (participant) => participant.messages, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  author: ParticipantEntity;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  chat: ChatEntity;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
