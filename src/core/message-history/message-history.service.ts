import { Injectable } from '@nestjs/common';
import { MessagesService } from '../../entities/messages/messages.service';

@Injectable()
class MessageHistoryService {
  constructor(private messageService: MessagesService) {}

  async createMessageHistoryRecord(
    message: string,
    meta: { participantId: string; messageId: string; chatId: string },
  ) {
    return this.messageService.create({
      message,
      platformMessageId: meta.messageId,
      chatId: meta.chatId,
      authorId: meta.participantId,
    });
  }

  async getMessageHistory(amount: number, params: { chatId: string }) {
    return this.messageService.getLastMessages(amount, params);
  }
}

export default MessageHistoryService;
