// chat.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlatformType } from '../../core/platform/platform.enum';
import { ParticipantEntity } from '../participant/participant.entity';
import { MessageEntity } from '../messages/messages.entity';

export interface TelegramChatMeta {
  accessHash?: string;
}

export type ChatMeta = TelegramChatMeta;

export enum ChatType {
  Private = 'private',
  Group = 'group',
  Channel = 'channel',
}

@Entity('chats')
@Index(['platform', 'platformChatId'], { unique: true })
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformChatId: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;

  @Column({
    type: 'enum',
    enum: ChatType,
  })
  type: ChatType;

  @Column({ nullable: true })
  title?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  meta?: ChatMeta;

  @ManyToOne(() => ParticipantEntity, (participant) => participant.chats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  participant: ParticipantEntity;

  @OneToMany(() => MessageEntity, (message) => message.chat)
  messages: MessageEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
