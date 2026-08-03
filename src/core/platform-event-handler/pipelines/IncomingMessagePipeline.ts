import { PipelineAbstract } from './pipeline-abstract';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../../platform/events/PlatformEvent';
import { IncomingMessagePlatformEvent } from '../../platform/events/IncomingMessagePlatformEvent';
import { Injectable, Logger } from '@nestjs/common';
import { MessageCapability } from '../../../common/capability/capabilities/message-capability';
import { IncomingMessageReactionPlannerService } from '../../planner/planners/incoming-message-reaction-planner.service';
import { PlaneResolverService } from '../../planner/plan-resolver.service';
@Injectable()
class IncomingMessagePipeline implements PipelineAbstract<IncomingMessagePlatformEvent> {
  constructor(
    private planner: IncomingMessageReactionPlannerService,
    private planResolver: PlaneResolverService,
  ) {}

  async process(context: RuntimeContext, event: IncomingMessagePlatformEvent) {
    const plan = await this.planner.plan(context, {
      receivedMessage: event.message,
    });
    await this.planResolver.resolve(
      context,
      { conversation: event.conversation },
      plan,
    );
  }
}

export default IncomingMessagePipeline;
