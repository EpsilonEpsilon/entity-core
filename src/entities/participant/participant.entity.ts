// participant.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlatformType } from '../../core/platform/platform.enum';
import { ChatEntity } from '../chat/chat.entity';
import { MessageEntity } from '../messages/messages.entity';

export interface TelegramParticipantMeta {
  accessHash?: string;
}

export type ParticipantMeta = TelegramParticipantMeta;

@Entity('participants')
@Index(['platform', 'platformUserId'], { unique: true })
export class ParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformUserId: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  meta?: ParticipantMeta;

  @OneToMany(() => ChatEntity, (chat) => chat.participant)
  chats: ChatEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => MessageEntity, (message) => message.author)
  messages: MessageEntity[];

  @UpdateDateColumn()
  updatedAt: Date;
}
