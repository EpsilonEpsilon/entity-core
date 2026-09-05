import { PipelineAbstract } from './pipeline-abstract';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { IncomingMessagePlatformEvent } from '../../platform/events/new-message/IncomingMessagePlatformEvent';
import { Injectable } from '@nestjs/common';
import { IncomingMessageReactionPlannerService } from '../../planner/planners/incoming-message-reaction-planner.service';
import { PlaneResolverService } from '../../planner/plan-resolver.service';
import { EventBuffer } from '../../platform/events/event-buffer';
import MessageHistoryService from '../../message-history/message-history.service';
import IncomingMessageReaction from '../../reaction/reactions/incoming-message-reaction';

@Injectable()
class IncomingMessagePipeline implements PipelineAbstract<
  IncomingMessagePlatformEvent | EventBuffer<IncomingMessagePlatformEvent>
> {
  constructor(
    private planner: IncomingMessageReactionPlannerService,
    private planResolver: PlaneResolverService,
    private messageHistory: MessageHistoryService,
    private incomingMessageReactionService: IncomingMessageReaction,
  ) {}

  async process(
    context: RuntimeContext,
    input:
      IncomingMessagePlatformEvent | EventBuffer<IncomingMessagePlatformEvent>,
  ) {
    const conversation =
      input instanceof EventBuffer
        ? input.last?.conversation
        : input.conversation;
    if (!conversation?.meta?.chat.id) {
      throw new Error('Conversation  chart id is missing');
    }
    const messageHistory = await this.messageHistory.getMessageHistory(3, {
      chatId: conversation?.meta?.chat.id,
    });

    const incomingMessageTextReaction =
      await this.incomingMessageReactionService.generateTextReaction({
        context,
        messageHistory: messageHistory.map((item) => ({
          message: item.message,
          author: item.author.firstName,
          created_at: item.createdAt,
        })),
      });

    const plan = await this.planner.plan(context, {
      incomingMessageReaction: incomingMessageTextReaction,
    });
    await this.planResolver.resolve(context, { conversation }, plan);
  }
}

export default IncomingMessagePipeline;
