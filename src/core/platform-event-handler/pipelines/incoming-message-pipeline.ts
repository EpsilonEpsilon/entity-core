import { PipelineAbstract } from './pipeline-abstract';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { IncomingMessagePlatformEvent } from '../../platform/events/new-message/IncomingMessagePlatformEvent';
import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessageReactionPlannerService } from '../../planner/planners/incoming-message-reaction-planner.service';
import { PlaneResolverService } from '../../planner/plan-resolver.service';
import { MessagesService } from '../../../entities/messages/messages.service';
import { EventBuffer } from '../../platform/events/event-buffer';

@Injectable()
class IncomingMessagePipeline implements PipelineAbstract<
  IncomingMessagePlatformEvent | EventBuffer<IncomingMessagePlatformEvent>
> {
  private logger = new Logger('IncomingMessagePipeline');
  constructor(
    private planner: IncomingMessageReactionPlannerService,
    private planResolver: PlaneResolverService,
  ) {}

  async process(
    context: RuntimeContext,
    input:
      IncomingMessagePlatformEvent | EventBuffer<IncomingMessagePlatformEvent>,
  ) {
    const receivedMessage =
      input instanceof EventBuffer
        ? input.events.map((el) => el.message).join('/n')
        : input.message;
    this.logger.log(receivedMessage);
    const conversation =
      input instanceof EventBuffer
        ? input.last?.conversation
        : input.conversation;
    const plan = await this.planner.plan(context, {
      receivedMessage: receivedMessage,
    });
    await this.planResolver.resolve(context, { conversation }, plan);
  }
}

export default IncomingMessagePipeline;
