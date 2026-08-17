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
  constructor(
    private readonly messageHistoryService: MessageHistoryService,
    private readonly participantService: ParticipantService,
    private readonly chatService: ChatService,
  ) {}
  async process(context: RuntimeContext, event: NewPlatformMessage) {
    const platformChatId = event.conversation.meta?.chat.platformChatId;
    const platformId = event.conversation.meta?.sender.platformId;

    if (!platformId) throw new Error('Participant platformId is missing');
    if (!platformChatId)
      throw new Error('MessagePlatformEvent Conversation ref missing chat');
    if (!event.message_id)
      throw new Error('MessagePlatform Event Message platformId is missing');
    if (!event.conversation.meta?.sender.platformId)
      throw new Error('MessagePlatform Event sender platformId is missing');
    const participant =
      await this.participantService.findParticipantByPlatformId(platformId);

    const chat =
      await this.chatService.findChatByPlatformChatId(platformChatId);
    if (!participant || !chat)
      throw new Error('Participant or Chat Entities are missing');

    void this.messageHistoryService.createMessageHistoryRecord(event.message, {
      messageId: event.message_id.toString(),
      chatId: chat.id,
      participantId: participant.id,
    });
  }
}
