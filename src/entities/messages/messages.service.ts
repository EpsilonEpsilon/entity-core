import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './messages.entity';
import { Repository } from 'typeorm';

interface CreateMessageHistoryParams {
  platformMessageId: string;
  authorId: string;
  chatId: string;
  message: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async create(params: CreateMessageHistoryParams): Promise<MessageEntity> {
    const entity = this.messageRepository.create({
      platformMessageId: params.platformMessageId,
      message: params.message,

      author: {
        id: params.authorId,
      },

      chat: {
        id: params.chatId,
      },
    });

    return this.messageRepository.save(entity);
  }

  async getLastMessages(amount: number, params: { chatId: string }) {
    return (
      await this.messageRepository.find({
        where: { chat: { id: params.chatId } },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          author: true,
        },
        take: amount,
      })
    ).reverse();
  }
}
