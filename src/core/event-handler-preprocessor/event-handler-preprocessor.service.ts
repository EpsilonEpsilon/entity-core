import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../platform/events/PlatformEvent';
import { ParticipantService } from '../../entities/participant/participant.service';
import { IncomingMessagePlatformEvent } from '../platform/events/new-message/IncomingMessagePlatformEvent';
import { ConversationRef } from '../platform/common/ConversationRef';
import { ChatService } from '../../entities/chat/chat.service';
import { NewPlatformMessage } from '../platform/events/new-message/NewPlatformMessage';

@Injectable()
class EventHandlerPreprocessorService {
  private logger = new Logger(EventHandlerPreprocessorService.name);
  constructor(
    private participantService: ParticipantService,
    private chatService: ChatService,
  ) {}
  async process(context: RuntimeContext, event: PlatformEvent) {
    if (event instanceof NewPlatformMessage) {
      await this.processParticipant(event.conversation, context);
    }
  }

  private async processParticipant(
    conversation: ConversationRef,
    _context: RuntimeContext,
  ) {
    if (!conversation.meta?.sender.platformId)
      throw new Error(
        'EventHandlerPreprocessorService: conversation ref does not contain sender platformId',
      );
    const participant = await this.participantService.createOrUpdateParticipant(
      {
        platform: conversation.meta.sender.platform,
        firstName: conversation.meta?.sender.firstName,
        username: conversation.meta.sender.username,
        lastName: conversation.meta?.sender.lastName,
        platformUserId: conversation.meta?.sender.platformId,
        meta: {
          accessHash: conversation.meta.sender.accessHash,
        },
      },
    );

    await this.chatService.createOrUpdateChat({
      participantId: participant.id,
      platform: conversation.meta.chat.platform,
      platformChatId: conversation.meta.chat.platformChatId,
      type: conversation.meta.chat.type,
      title: conversation.meta.chat.title,
      meta: { accessHash: conversation.meta.chat.accessHash },
    });

    this.logger.log('Created new participant');
  }
}

export default EventHandlerPreprocessorService;
