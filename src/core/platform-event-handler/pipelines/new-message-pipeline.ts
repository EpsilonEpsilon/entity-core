import { Injectable } from '@nestjs/common';
import { PipelineAbstract } from './pipeline-abstract';
import { NewPlatformMessage } from '../../platform/events/new-message/NewPlatformMessage';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { MessagesModule } from '../../../entities/messages/messages.module';
import MessageHistoryService from '../../message-history/message-history.service';
import { ParticipantService } from '../../../entities/participant/participant.service';
import { ChatService } from '../../../entities/chat/chat.service';

@Injectable()
export class NewMessagePipeline implements PipelineAbstract<NewPlatformMessage> {
  constructor(private readonly messageHistoryService: MessageHistoryService) {}
  async process(context: RuntimeContext, event: NewPlatformMessage) {
    if (!event.message_id)
      throw new Error('MessagePlatform Event Message platformId is missing');
    if (!event.conversation.meta?.chat.id)
      throw new Error('Conversation meta chat id is missing');
    if (!event.conversation.meta?.sender.id)
      throw new Error('Conversation ref sender id is missing');
    void this.messageHistoryService.createMessageHistoryRecord(event.message, {
      messageId: event.message_id.toString(),
      chatId: event.conversation.meta?.chat.id,
      participantId: event.conversation.meta?.sender.id,
    });
  }
}
