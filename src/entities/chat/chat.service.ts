import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatEntity } from './chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
  ) {}

  async createOrUpdateChat(
    chat: Omit<
      ChatEntity,
      'id' | 'createdAt' | 'updatedAt' | 'participant' | 'messages'
    > & {
      participantId: string;
    },
  ) {
    const { participantId, ...data } = chat;
    const entity = this.chatRepository.create({
      ...data,
      participant: {
        id: participantId,
      },
    });

    await this.chatRepository.upsert(entity, {
      conflictPaths: ['platform', 'platformChatId'],
    });

    return entity;
  }

  async findChatByPlatformChatId(platformChatId: string) {
    return this.chatRepository.findOne({ where: { platformChatId } });
  }
}
