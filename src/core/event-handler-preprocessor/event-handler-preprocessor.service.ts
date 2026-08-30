import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../platform/events/platform-event';
import { ParticipantService } from '../../entities/participant/participant.service';
import { IncomingMessagePlatformEvent } from '../platform/events/new-message/IncomingMessagePlatformEvent';
import { ConversationRef } from '../platform/common/conversation-ref';
import { ChatService } from '../../entities/chat/chat.service';
import { NewPlatformMessage } from '../platform/events/new-message/NewPlatformMessage';
import { NewMessagePipeline } from '../platform-event-handler/pipelines/new-message-pipeline';
import { EventBuffer } from '../platform/events/event-buffer';
import runtimeContext from '../runtime-context-builder/runtime-context';

@Injectable()
class EventHandlerPreprocessorService {
  private logger = new Logger(EventHandlerPreprocessorService.name);
  constructor(
    private participantService: ParticipantService,
    private chatService: ChatService,
    private newMessagePipeline: NewMessagePipeline,
  ) {}
  async process(context: RuntimeContext, input: PlatformEvent | EventBuffer) {
    if (input instanceof EventBuffer) {
      return await Promise.allSettled(
        input.events.map(async (event) => this.processEvent(context, event)),
      );
    }
    return this.processEvent(context, input);
  }

  private async processEvent(context: RuntimeContext, event: PlatformEvent) {
    if (event instanceof NewPlatformMessage)
      await this.newMessagePipeline.process(context, event);
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
  }
}

export default EventHandlerPreprocessorService;
